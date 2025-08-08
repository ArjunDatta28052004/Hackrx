import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

export function DocumentSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"content" | "filename">("content");
  const [fileType, setFileType] = useState<string>("");
  const [isSearching, setIsSearching] = useState(false);

  const searchResults = useQuery(
    api.documents.searchDocuments,
    searchQuery.trim().length > 0
      ? {
          query: searchQuery.trim(),
          searchType,
          fileType: fileType || undefined,
        }
      : "skip"
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearching(true);
      // The query will automatically run due to the reactive nature
      setTimeout(() => setIsSearching(false), 500);
    }
  };

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
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Search Documents</h2>
        <p className="text-gray-600">
          Search through your document content or filenames
        </p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter your search query..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            disabled={!searchQuery.trim() || isSearching}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSearching ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              "🔍"
            )}
            Search
          </button>
        </div>

        {/* Search Options */}
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Search in:</label>
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value as "content" | "filename")}
              className="border border-gray-300 rounded px-3 py-1 text-sm"
            >
              <option value="content">Document Content</option>
              <option value="filename">File Names</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">File type:</label>
            <select
              value={fileType}
              onChange={(e) => setFileType(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1 text-sm"
            >
              <option value="">All types</option>
              <option value="pdf">PDF</option>
              <option value="docx">Word</option>
            </select>
          </div>
        </div>
      </form>

      {/* Search Results */}
      {searchQuery.trim() && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Search Results
              {searchResults && ` (${searchResults.length})`}
            </h3>
          </div>

          {searchResults === undefined ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-500">
                Try adjusting your search query or search criteria
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {searchResults.map((doc) => (
                <div
                  key={doc._id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">
                          {doc.fileType === "pdf" ? "📄" : "📝"}
                        </span>
                        <h4 className="font-medium text-gray-900 truncate">
                          {doc.fileName}
                        </h4>
                        {doc.classification && (
                          <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                            {doc.classification}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                        <span>{formatFileSize(doc.fileSize)}</span>
                        <span>{formatDate(doc.uploadTime)}</span>
                        <span className="uppercase">{doc.fileType}</span>
                      </div>

                      {doc.summary && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {doc.summary}
                        </p>
                      )}

                      {doc.keywords && doc.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {doc.keywords.slice(0, 5).map((keyword, index) => (
                            <span
                              key={index}
                              className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                            >
                              {keyword}
                            </span>
                          ))}
                          {doc.keywords.length > 5 && (
                            <span className="text-xs text-gray-500">
                              +{doc.keywords.length - 5} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {doc.downloadUrl && (
                        <a
                          href={doc.downloadUrl}
                          download={doc.fileName}
                          className="p-2 text-gray-400 hover:text-blue-600"
                        >
                          ⬇️
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Search Tips */}
      {!searchQuery.trim() && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="font-medium text-gray-900 mb-3">Search Tips</h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>• Use specific keywords for better results</li>
            <li>• Search in document content to find text within your files</li>
            <li>• Search in filenames to find documents by their names</li>
            <li>• Filter by file type to narrow down results</li>
            <li>• Try different variations of your search terms</li>
          </ul>
        </div>
      )}
    </div>
  );
}
