import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface Document {
  _id: Id<"documents">;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadTime: number;
  isProcessed: boolean;
  summary?: string;
  classification?: string;
  keywords?: string[];
  downloadUrl?: string | null;
}

interface DocumentListProps {
  documents: Document[];
  onSelectDocument: (id: Id<"documents">) => void;
  onDeleteDocument: (id: Id<"documents">) => void;
  selectedDocumentId: Id<"documents"> | null;
}

export function DocumentList({
  documents,
  onSelectDocument,
  onDeleteDocument,
  selectedDocumentId,
}: DocumentListProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  
  const selectedDocument = documents.find(doc => doc._id === selectedDocumentId);
  const documentAnalysis = useQuery(
    api.documents.getDocumentAnalysis,
    selectedDocumentId ? { documentId: selectedDocumentId } : "skip"
  );

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📄</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
        <p className="text-gray-500">Upload your first document to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">
          My Documents ({documents.length})
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded ${
              viewMode === "list" ? "bg-blue-100 text-blue-600" : "text-gray-400"
            }`}
          >
            ☰
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded ${
              viewMode === "grid" ? "bg-blue-100 text-blue-600" : "text-gray-400"
            }`}
          >
            ⊞
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document List */}
        <div className="lg:col-span-2">
          {viewMode === "list" ? (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc._id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedDocumentId === doc._id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => onSelectDocument(doc._id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">
                          {doc.fileType === "pdf" ? "📄" : "📝"}
                        </span>
                        <h3 className="font-medium text-gray-900 truncate">
                          {doc.fileName}
                        </h3>
                        {!doc.isProcessed && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                            Processing...
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{formatFileSize(doc.fileSize)}</span>
                        <span>{formatDate(doc.uploadTime)}</span>
                        {doc.classification && (
                          <span className="bg-gray-100 px-2 py-1 rounded">
                            {doc.classification}
                          </span>
                        )}
                      </div>
                      {doc.summary && (
                        <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                          {doc.summary}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {doc.downloadUrl && (
                        <a
                          href={doc.downloadUrl}
                          download={doc.fileName}
                          className="p-2 text-gray-400 hover:text-blue-600"
                          onClick={(e) => e.stopPropagation()}
                        >
                          ⬇️
                        </a>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteDocument(doc._id);
                        }}
                        className="p-2 text-gray-400 hover:text-red-600"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documents.map((doc) => (
                <div
                  key={doc._id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedDocumentId === doc._id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => onSelectDocument(doc._id)}
                >
                  <div className="text-center mb-3">
                    <div className="text-4xl mb-2">
                      {doc.fileType === "pdf" ? "📄" : "📝"}
                    </div>
                    <h3 className="font-medium text-gray-900 truncate">
                      {doc.fileName}
                    </h3>
                  </div>
                  <div className="text-xs text-gray-500 text-center space-y-1">
                    <div>{formatFileSize(doc.fileSize)}</div>
                    <div>{formatDate(doc.uploadTime)}</div>
                    {doc.classification && (
                      <div className="bg-gray-100 px-2 py-1 rounded inline-block">
                        {doc.classification}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Document Details */}
        <div className="lg:col-span-1">
          {selectedDocument ? (
            <div className="border rounded-lg p-4 sticky top-4">
              <h3 className="font-semibold text-gray-900 mb-4">Document Details</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Name</label>
                  <p className="text-sm text-gray-900">{selectedDocument.fileName}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Type</label>
                  <p className="text-sm text-gray-900 uppercase">{selectedDocument.fileType}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Size</label>
                  <p className="text-sm text-gray-900">{formatFileSize(selectedDocument.fileSize)}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Uploaded</label>
                  <p className="text-sm text-gray-900">{formatDate(selectedDocument.uploadTime)}</p>
                </div>

                {selectedDocument.classification && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Classification</label>
                    <p className="text-sm text-gray-900">{selectedDocument.classification}</p>
                  </div>
                )}

                {selectedDocument.keywords && selectedDocument.keywords.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Keywords</label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedDocument.keywords.map((keyword, index) => (
                        <span
                          key={index}
                          className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedDocument.summary && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Summary</label>
                    <p className="text-sm text-gray-900 mt-1">{selectedDocument.summary}</p>
                  </div>
                )}

                {documentAnalysis && documentAnalysis.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">AI Analysis</label>
                    <div className="space-y-2 mt-1">
                      {documentAnalysis.map((analysis: any) => (
                        <div key={analysis._id} className="text-xs">
                          <span className="font-medium capitalize">{analysis.analysisType}:</span>
                          <p className="text-gray-600 mt-1">{analysis.result}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="border rounded-lg p-4 text-center text-gray-500">
              Select a document to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
