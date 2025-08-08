import { v } from "convex/values";
import { query, mutation, action, internalQuery, internalMutation, internalAction } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

// Generate upload URL for document files
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }
    return await ctx.storage.generateUploadUrl();
  },
});

// Save document metadata after upload
export const saveDocument = mutation({
  args: {
    fileName: v.string(),
    fileType: v.string(),
    fileSize: v.number(),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }

    const documentId = await ctx.db.insert("documents", {
      userId,
      fileName: args.fileName,
      fileType: args.fileType,
      fileSize: args.fileSize,
      storageId: args.storageId,
      parsedContent: "", // Will be updated after parsing
      uploadTime: Date.now(),
      isProcessed: false,
    });

    // Schedule document processing
    await ctx.scheduler.runAfter(0, internal.documents.processDocument, {
      documentId,
    });

    return documentId;
  },
});

// Get user's documents
export const getUserDocuments = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }

    const documents = await ctx.db
      .query("documents")
      .withIndex("by_user_and_upload_time", (q) => q.eq("userId", userId))
      .order("desc")
      .take(args.limit || 50);

    return Promise.all(
      documents.map(async (doc) => ({
        ...doc,
        downloadUrl: await ctx.storage.getUrl(doc.storageId),
      }))
    );
  },
});

// Get single document
export const getDocument = query({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }

    const document = await ctx.db.get(args.documentId);
    if (!document || document.userId !== userId) {
      throw new Error("Document not found or access denied");
    }

    return {
      ...document,
      downloadUrl: await ctx.storage.getUrl(document.storageId),
    };
  },
});

// Search documents
export const searchDocuments = query({
  args: {
    query: v.string(),
    searchType: v.union(v.literal("content"), v.literal("filename")),
    fileType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }

    const indexName = args.searchType === "content" ? "search_content" : "search_filename";
    const searchField = args.searchType === "content" ? "parsedContent" : "fileName";

    let query = ctx.db
      .query("documents")
      .withSearchIndex(indexName, (q) => 
        q.search(searchField, args.query).eq("userId", userId)
      );

    if (args.fileType) {
      query = query.filter((q) => q.eq(q.field("fileType"), args.fileType));
    }

    const results = await query.take(20);

    return Promise.all(
      results.map(async (doc) => ({
        ...doc,
        downloadUrl: await ctx.storage.getUrl(doc.storageId),
      }))
    );
  },
});

// Delete document
export const deleteDocument = mutation({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }

    const document = await ctx.db.get(args.documentId);
    if (!document || document.userId !== userId) {
      throw new Error("Document not found or access denied");
    }

    // Delete from storage
    await ctx.storage.delete(document.storageId);
    
    // Delete document record
    await ctx.db.delete(args.documentId);

    // Delete related analysis
    const analyses = await ctx.db
      .query("documentAnalysis")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .collect();

    for (const analysis of analyses) {
      await ctx.db.delete(analysis._id);
    }

    return { success: true };
  },
});

// Process document (internal function)
export const processDocument = internalAction({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    const document = await ctx.runQuery(internal.documents.getDocumentForProcessing, {
      documentId: args.documentId,
    });

    if (!document) {
      throw new Error("Document not found");
    }

    try {
      // Get file from storage
      const fileUrl = await ctx.storage.getUrl(document.storageId);
      if (!fileUrl) {
        throw new Error("File not found in storage");
      }

      // Parse document content
      const parsedContent = await parseDocumentContent(fileUrl, document.fileType);

      // Update document with parsed content
      await ctx.runMutation(internal.documents.updateParsedContent, {
        documentId: args.documentId,
        parsedContent,
      });

      // Analyze document with AI
      await ctx.runAction(internal.ai.analyzeDocument, {
        documentId: args.documentId,
        content: parsedContent,
      });

    } catch (error) {
      console.error("Document processing failed:", error);
      await ctx.runMutation(internal.documents.markProcessingFailed, {
        documentId: args.documentId,
      });
    }
  },
});

// Helper function to parse document content
async function parseDocumentContent(fileUrl: string, fileType: string): Promise<string> {
  try {
    const response = await fetch(fileUrl);
    const arrayBuffer = await response.arrayBuffer();
    
    if (fileType === "pdf") {
      // For PDF parsing, we'll use a simple text extraction
      // In a real implementation, you'd use a proper PDF parser
      return "PDF content extracted (placeholder - implement PDF parser)";
    } else if (fileType === "docx") {
      // For DOCX parsing, we'll use a simple text extraction
      // In a real implementation, you'd use a proper DOCX parser
      return "DOCX content extracted (placeholder - implement DOCX parser)";
    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }
  } catch (error) {
    throw new Error(`Failed to parse document: ${error}`);
  }
}

// Internal queries and mutations
export const getDocumentForProcessing = internalQuery({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.documentId);
  },
});

export const updateParsedContent = internalMutation({
  args: {
    documentId: v.id("documents"),
    parsedContent: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.documentId, {
      parsedContent: args.parsedContent,
      isProcessed: true,
    });
  },
});

export const markProcessingFailed = internalMutation({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.documentId, {
      isProcessed: false,
      parsedContent: "Processing failed",
    });
  },
});

// Get document analysis
export const getDocumentAnalysis = query({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }

    return await ctx.db
      .query("documentAnalysis")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();
  },
});

// Internal mutations for AI analysis
export const saveAnalysis = internalMutation({
  args: {
    documentId: v.id("documents"),
    userId: v.id("users"),
    analysisType: v.string(),
    result: v.string(),
    confidence: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("documentAnalysis", {
      documentId: args.documentId,
      userId: args.userId,
      analysisType: args.analysisType,
      result: args.result,
      confidence: args.confidence,
      createdAt: Date.now(),
    });
  },
});

export const updateDocumentAnalysis = internalMutation({
  args: {
    documentId: v.id("documents"),
    summary: v.string(),
    classification: v.string(),
    keywords: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.documentId, {
      summary: args.summary,
      classification: args.classification,
      keywords: args.keywords,
    });
  },
});
