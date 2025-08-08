import { useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { DocumentUpload } from "./DocumentUpload";
import { DocumentList } from "./DocumentList";
import { DocumentSearch } from "./DocumentSearch";
import { DocumentChat } from "./DocumentChat";
import { DocumentComparison } from "./DocumentComparison";
import { Id } from "../../convex/_generated/dataModel";

type Tab = "upload" | "documents" | "search" | "chat" | "compare";

export function DocumentManager() {
  const [activeTab, setActiveTab] = useState<Tab>("documents");
  const [selectedDocumentId, setSelectedDocumentId] = useState<Id<"documents"> | null>(null);
  const [compareDocuments, setCompareDocuments] = useState<{
    doc1: Id<"documents"> | null;
    doc2: Id<"documents"> | null;
  }>({ doc1: null, doc2: null });

  const documents = useQuery(api.documents.getUserDocuments, { limit: 50 });
  const deleteDocument = useMutation(api.documents.deleteDocument);

  const handleDeleteDocument = async (documentId: Id<"documents">) => {
    try {
      await deleteDocument({ documentId });
      toast.success("Document deleted successfully");
      if (selectedDocumentId === documentId) {
        setSelectedDocumentId(null);
      }
    } catch (error) {
      toast.error("Failed to delete document");
    }
  };

  const tabs = [
    { id: "documents" as const, label: "My Documents", icon: "📄" },
    { id: "upload" as const, label: "Upload", icon: "⬆️" },
    { id: "search" as const, label: "Search", icon: "🔍" },
    { id: "chat" as const, label: "Chat", icon: "💬" },
    { id: "compare" as const, label: "Compare", icon: "⚖️" },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === "upload" && (
          <DocumentUpload onUploadComplete={() => setActiveTab("documents")} />
        )}

        {activeTab === "documents" && (
          <DocumentList
            documents={documents || []}
            onSelectDocument={setSelectedDocumentId}
            onDeleteDocument={handleDeleteDocument}
            selectedDocumentId={selectedDocumentId}
          />
        )}

        {activeTab === "search" && <DocumentSearch />}

        {activeTab === "chat" && (
          <DocumentChat
            documents={documents || []}
            selectedDocumentId={selectedDocumentId}
            onSelectDocument={setSelectedDocumentId}
          />
        )}

        {activeTab === "compare" && (
          <DocumentComparison
            documents={documents || []}
            compareDocuments={compareDocuments}
            onSelectCompareDocuments={setCompareDocuments}
          />
        )}
      </div>
    </div>
  );
}
