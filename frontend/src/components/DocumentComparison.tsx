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
  summary?: string;
  classification?: string;
}

interface DocumentComparisonProps {
  documents: Document[];
  compareDocuments: {
    doc1: Id<"documents"> | null;
    doc2: Id<"documents"> | null;
  };
  onSelectCompareDocuments: (docs: {
    doc1: Id<"documents"> | null;
    doc2: Id<"documents"> | null;
  }) => void;
}

interface ComparisonResult {
  comparison: string;
  confidence: number;
  document1: { id: Id<"documents">; name: string };
  document2: { id: Id<"documents">; name: string };
}

export function DocumentComparison({
  documents,
  compareDocuments,
  onSelectCompareDocuments,
}: DocumentComparisonProps) {
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [isComparing, setIsComparing] = useState(false);

  const compareDocumentsAction = useAction(api.ai.compareDocuments);

  const processedDocuments = documents.filter(doc => doc.isProcessed);
  const doc1 = processedDocuments.find(doc => doc._id === compareDocuments.doc1);
  const doc2 = processedDocuments.find(doc => doc._id === compareDocuments.doc2);

  const handleCompare = async () => {
    if (!compareDocuments.doc1 || !compareDocuments.doc2) {
      toast.error("Please select two documents to compare");
      return;
    }

    if (compareDocuments.doc1 === compareDocuments.doc2) {
      toast.error("Please select two different documents");
      return;
    }

    setIsComparing(true);
    setComparisonResult(null);

    try {
      const result = await compareDocumentsAction({
        documentId1: compareDocuments.doc1,
        documentId2: compareDocuments.doc2,
      });

      setComparisonResult(result);
    } catch (error) {
      console.error("Comparison error:", error);
      toast.error("Failed to compare documents");
    } finally {
      setIsComparing(false);
    }
  };

  const clearComparison = () => {
    setComparisonResult(null);
    onSelectCompareDocuments({ doc1: null, doc2: null });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Compare Documents</h2>
        <p className="text-gray-600">
          Select two documents to compare their content and find similarities or differences
        </p>
      </div>

      {processedDocuments.length < 2 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">⚖️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Not enough documents
          </h3>
          <p className="text-gray-500">
            You need at least 2 processed documents to use the comparison feature
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Document Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Document 1 Selection */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Document 1</h3>
              <div className="space-y-2">
                {processedDocuments.map((doc) => (
                  <button
                    key={doc._id}
                    onClick={() =>
                      onSelectCompareDocuments({
                        ...compareDocuments,
                        doc1: doc._id,
                      })
                    }
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      compareDocuments.doc1 === doc._id
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
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-gray-500 uppercase">
                            {doc.fileType}
                          </p>
                          {doc.classification && (
                            <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                              {doc.classification}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Document 2 Selection */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Document 2</h3>
              <div className="space-y-2">
                {processedDocuments.map((doc) => (
                  <button
                    key={doc._id}
                    onClick={() =>
                      onSelectCompareDocuments({
                        ...compareDocuments,
                        doc2: doc._id,
                      })
                    }
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      compareDocuments.doc2 === doc._id
                        ? "border-green-500 bg-green-50"
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
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-gray-500 uppercase">
                            {doc.fileType}
                          </p>
                          {doc.classification && (
                            <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                              {doc.classification}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Selected Documents Summary */}
          {(doc1 || doc2) && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">Selected Documents</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <div>
                    <p className="font-medium text-sm">
                      {doc1 ? doc1.fileName : "Select Document 1"}
                    </p>
                    {doc1?.summary && (
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {doc1.summary}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="font-medium text-sm">
                      {doc2 ? doc2.fileName : "Select Document 2"}
                    </p>
                    {doc2?.summary && (
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {doc2.summary}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Compare Button */}
          <div className="text-center">
            <button
              onClick={handleCompare}
              disabled={!compareDocuments.doc1 || !compareDocuments.doc2 || isComparing}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
            >
              {isComparing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Comparing...
                </>
              ) : (
                <>
                  ⚖️ Compare Documents
                </>
              )}
            </button>
          </div>

          {/* Comparison Result */}
          {comparisonResult && (
            <div className="border rounded-lg p-6 bg-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Comparison Result
                </h3>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500">
                    Confidence: {Math.round(comparisonResult.confidence * 100)}%
                  </span>
                  <button
                    onClick={clearComparison}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="font-medium text-sm">
                      {comparisonResult.document1.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="font-medium text-sm">
                      {comparisonResult.document2.name}
                    </span>
                  </div>
                </div>

                <div className="prose max-w-none">
                  <div className="whitespace-pre-wrap text-gray-700">
                    {comparisonResult.comparison}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Comparison Tips */}
          {!comparisonResult && (
            <div className="bg-purple-50 rounded-lg p-6">
              <h3 className="font-medium text-purple-900 mb-3">Comparison Features</h3>
              <ul className="text-sm text-purple-800 space-y-2">
                <li>• Identifies similarities and differences between documents</li>
                <li>• Compares content themes and key topics</li>
                <li>• Highlights unique aspects of each document</li>
                <li>• Provides insights on document relationships</li>
                <li>• Suggests which document might be more relevant for specific use cases</li>
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
