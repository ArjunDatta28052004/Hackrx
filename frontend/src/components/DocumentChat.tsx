import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

interface Document {
  _id: Id<"documents">;
  fileName: string;
  fileType: string;
  isProcessed: boolean;
}

interface DocumentChatProps {
  documents: Document[];
  selectedDocumentId: Id<"documents"> | null;
  onSelectDocument: (id: Id<"documents">) => void;
}

interface ChatMessage {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: number;
}

export function DocumentChat({
  documents,
  selectedDocumentId,
  onSelectDocument,
}: DocumentChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const chatWithDocument = useAction(api.ai.chatWithDocument);

  const selectedDocument = documents.find(doc => doc._id === selectedDocumentId);
  const processedDocuments = documents.filter(doc => doc.isProcessed);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || !selectedDocumentId || isLoading) {
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: inputMessage.trim(),
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await chatWithDocument({
        documentId: selectedDocumentId,
        question: inputMessage.trim(),
      });

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: response.answer,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      toast.error("Failed to get response from AI");
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: "I'm sorry, I couldn't process your question at the moment. Please try again.",
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Document Selection */}
      <div className="lg:col-span-1">
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-4">Select Document</h3>
          
          {processedDocuments.length === 0 ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-2">📄</div>
              <p className="text-sm text-gray-500">
                No processed documents available for chat
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {processedDocuments.map((doc) => (
                <button
                  key={doc._id}
                  onClick={() => {
                    onSelectDocument(doc._id);
                    setMessages([]); // Clear chat when switching documents
                  }}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedDocumentId === doc._id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {doc.fileType === "pdf" ? "📄" : "📝"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">
                        {doc.fileName}
                      </p>
                      <p className="text-xs text-gray-500 uppercase">
                        {doc.fileType}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Interface */}
      <div className="lg:col-span-3">
        <div className="border rounded-lg h-[600px] flex flex-col">
          {/* Chat Header */}
          <div className="border-b p-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">
                {selectedDocument ? `Chat with ${selectedDocument.fileName}` : "Document Chat"}
              </h3>
              <p className="text-sm text-gray-500">
                Ask questions about your document content
              </p>
            </div>
            {messages.length > 0 && (
              <button
                onClick={clearChat}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear Chat
              </button>
            )}
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {!selectedDocument ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">💬</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Select a document to start chatting
                </h3>
                <p className="text-gray-500">
                  Choose a processed document from the sidebar to begin asking questions
                </p>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">🤖</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Start a conversation
                </h3>
                <p className="text-gray-500 mb-4">
                  Ask me anything about "{selectedDocument.fileName}"
                </p>
                <div className="text-left max-w-md mx-auto">
                  <p className="text-sm font-medium text-gray-700 mb-2">Example questions:</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• What is this document about?</li>
                    <li>• Summarize the key points</li>
                    <li>• What are the main conclusions?</li>
                    <li>• Find information about [specific topic]</li>
                  </ul>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.type === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.type === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        message.type === "user"
                          ? "text-blue-100"
                          : "text-gray-500"
                      }`}
                    >
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))
            )}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                    <span className="text-sm text-gray-600">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="border-t p-4">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={
                  selectedDocument
                    ? "Ask a question about this document..."
                    : "Select a document first..."
                }
                disabled={!selectedDocument || isLoading}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || !selectedDocument || isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
