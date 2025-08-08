import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  documents: defineTable({
    userId: v.id("users"),
    fileName: v.string(),
    fileType: v.string(), // "pdf" or "docx"
    fileSize: v.number(),
    storageId: v.id("_storage"),
    parsedContent: v.string(),
    uploadTime: v.number(),
    summary: v.optional(v.string()),
    classification: v.optional(v.string()),
    keywords: v.optional(v.array(v.string())),
    isProcessed: v.boolean(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_upload_time", ["userId", "uploadTime"])
    .searchIndex("search_content", {
      searchField: "parsedContent",
      filterFields: ["userId", "fileType"],
    })
    .searchIndex("search_filename", {
      searchField: "fileName",
      filterFields: ["userId"],
    }),

  documentAnalysis: defineTable({
    documentId: v.id("documents"),
    userId: v.id("users"),
    analysisType: v.string(), // "summary", "classification", "keywords", "insights"
    result: v.string(),
    confidence: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_document", ["documentId"])
    .index("by_user", ["userId"]),

  userSessions: defineTable({
    userId: v.id("users"),
    sessionToken: v.string(),
    lastActivity: v.number(),
    isActive: v.boolean(),
  })
    .index("by_user", ["userId"])
    .index("by_token", ["sessionToken"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
