import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { DocumentManager } from "./components/DocumentManager";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm h-16 flex justify-between items-center border-b shadow-sm px-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">DM</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Document Manager</h2>
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
            HackRx 6.0
          </span>
        </div>
        <Authenticated>
          <SignOutButton />
        </Authenticated>
      </header>
      
      <main className="flex-1">
        <Content />
      </main>
      
      <Toaster />
    </div>
  );
}

function Content() {
  const loggedInUser = useQuery(api.auth.loggedInUser);

  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Authenticated>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {loggedInUser?.email?.split('@')[0] || 'User'}!
          </h1>
          <p className="text-gray-600">
            Upload, analyze, and manage your documents with AI-powered insights
          </p>
        </div>
        <DocumentManager />
      </Authenticated>

      <Unauthenticated>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-xl">DM</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              AI-Powered Document Management
            </h1>
            <p className="text-xl text-gray-600 mb-2">
              Built for Bajaj Finserv HackRx 6.0
            </p>
            <p className="text-gray-500 max-w-md mx-auto">
              Upload PDF and Word documents, get AI-powered summaries, classifications, 
              and insights. Search, compare, and chat with your documents.
            </p>
          </div>
          <div className="w-full max-w-md">
            <SignInForm />
          </div>
        </div>
      </Unauthenticated>
    </div>
  );
}
