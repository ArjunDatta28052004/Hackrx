"use node";

import { v } from "convex/values";
import { action, internalAction, query, internalQuery, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

// AI model endpoint
const AI_MODEL_ENDPOINT = "https://github.com/ArjunDatta28052004/HackRx-6.0";

// Analyze document with AI
export const analyzeDocument = internalAction({
  args: {
    documentId: v.id("documents"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Get document info
      const document = await ctx.runQuery(internal.documents.getDocumentForProcessing, {
        documentId: args.documentId,
      });

      if (!document) {
        throw new Error("Document not found");
      }

      // Perform different types of analysis
      const analyses = await Promise.all([
        analyzeWithAI(args.content, "summary"),
        analyzeWithAI(args.content, "classification"),
        analyzeWithAI(args.content, "keywords"),
        analyzeWithAI(args.content, "insights"),
      ]);

      // Save analysis results
      for (let i = 0; i < analyses.length; i++) {
        const analysisType = ["summary", "classification", "keywords", "insights"][i];
        await ctx.runMutation(internal.documents.saveAnalysis, {
          documentId: args.documentId,
          userId: document.userId,
          analysisType,
          result: analyses[i].result,
          confidence: analyses[i].confidence,
        });
      }

      // Update document with summary and classification
      await ctx.runMutation(internal.documents.updateDocumentAnalysis, {
        documentId: args.documentId,
        summary: analyses[0].result,
        classification: analyses[1].result,
        keywords: analyses[2].result.split(",").map(k => k.trim()),
      });

    } catch (error) {
      console.error("AI analysis failed:", error);
    }
  },
});

// Chat with document
export const chatWithDocument = action({
  args: {
    documentId: v.id("documents"),
    question: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }

    const document = await ctx.runQuery(internal.documents.getDocumentForProcessing, {
      documentId: args.documentId,
    });

    if (!document || document.userId !== userId) {
      throw new Error("Document not found or access denied");
    }

    try {
      const response = await analyzeWithAI(
        `Document content: ${document.parsedContent}\n\nQuestion: ${args.question}`,
        "question_answer"
      );

      return {
        answer: response.result,
        confidence: response.confidence,
      };
    } catch (error) {
      throw new Error("Failed to analyze document with AI");
    }
  },
});

// Compare documents
export const compareDocuments = action({
  args: {
    documentId1: v.id("documents"),
    documentId2: v.id("documents"),
  },
  handler: async (ctx, args): Promise<{
    comparison: string;
    confidence: number;
    document1: { id: any; name: string };
    document2: { id: any; name: string };
  }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }

    const [doc1, doc2]: [any, any] = await Promise.all([
      ctx.runQuery(internal.documents.getDocumentForProcessing, {
        documentId: args.documentId1,
      }),
      ctx.runQuery(internal.documents.getDocumentForProcessing, {
        documentId: args.documentId2,
      }),
    ]);

    if (!doc1 || !doc2 || doc1.userId !== userId || doc2.userId !== userId) {
      throw new Error("Documents not found or access denied");
    }

    try {
      const comparison = await analyzeWithAI(
        `Document 1 (${doc1.fileName}): ${doc1.parsedContent}\n\nDocument 2 (${doc2.fileName}): ${doc2.parsedContent}`,
        "comparison"
      );

      return {
        comparison: comparison.result,
        confidence: comparison.confidence,
        document1: { id: doc1._id, name: doc1.fileName },
        document2: { id: doc2._id, name: doc2.fileName },
      };
    } catch (error) {
      throw new Error("Failed to compare documents");
    }
  },
});

// Helper function to call AI model
async function analyzeWithAI(content: string, analysisType: string): Promise<{ result: string; confidence: number }> {
  try {
    // This is a placeholder for the actual AI model call
    // In a real implementation, you would call the AI model at the provided endpoint
    
    const prompt = getPromptForAnalysisType(analysisType, content);
    
    // Simulate AI model response
    // Replace this with actual API call to your AI model
    const mockResponse = generateMockResponse(analysisType, content);
    
    return {
      result: mockResponse,
      confidence: 0.85,
    };
  } catch (error) {
    throw new Error(`AI analysis failed: ${error}`);
  }
}

function getPromptForAnalysisType(analysisType: string, content: string): string {
  switch (analysisType) {
    case "summary":
      return `Please provide a concise summary of the following document:\n\n${content}`;
    case "classification":
      return `Please classify the following document into one of these categories: Legal, Financial, Technical, Marketing, HR, Other:\n\n${content}`;
    case "keywords":
      return `Please extract the top 10 keywords from the following document (comma-separated):\n\n${content}`;
    case "insights":
      return `Please provide key insights and important points from the following document:\n\n${content}`;
    case "question_answer":
      return content; // Content already includes question
    case "comparison":
      return `Please compare these two documents and highlight similarities and differences:\n\n${content}`;
    default:
      return content;
  }
}

function generateMockResponse(analysisType: string, content: string): string {
  // Mock responses for demonstration
  switch (analysisType) {
    case "summary":
      return "This document contains important information about business processes and procedures. It outlines key strategies and implementation guidelines.";
    case "classification":
      return "Business";
    case "keywords":
      return "business, strategy, implementation, process, guidelines, management, operations, efficiency";
    case "insights":
      return "Key insights: 1) Focus on operational efficiency, 2) Strategic planning is emphasized, 3) Implementation requires cross-team collaboration";
    case "question_answer":
      return "Based on the document content, here is the answer to your question...";
    case "comparison":
      return "Both documents share similar themes but differ in their approach to implementation. Document 1 focuses more on strategy while Document 2 emphasizes execution.";
    default:
      return "Analysis completed successfully.";
  }
}




