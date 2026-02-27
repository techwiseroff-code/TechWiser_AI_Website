'use client';

import React from 'react';
import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackPreview,
  SandpackFileExplorer,
  useSandpack
} from "@codesandbox/sandpack-react";
import { autocompletion, completionKeymap } from "@codemirror/autocomplete";
import { GeneratedFile } from '@/lib/gemini';
import { cn } from '@/lib/utils';
import { Loader2, ExternalLink, AlertTriangle } from 'lucide-react';

const FixIssuesButton = ({ onFixError }: { onFixError: (error: string) => void }) => {
  const { sandpack } = useSandpack();

  if (!sandpack.error) return null;

  return (
    <button
      onClick={() => onFixError(sandpack.error?.message || "Please check the code for errors and fix them.")}
      className="p-2 bg-red-500/90 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg flex items-center gap-2 px-4"
      title="Fix Errors with AI"
    >
      <AlertTriangle size={16} />
      <span className="text-xs font-bold">Fix Issues</span>
    </button>
  );
};

interface PreviewPanelProps {
  files: GeneratedFile[];
  viewMode: 'split' | 'preview' | 'code';
  loadingState?: 'idle' | 'generating' | 'updating';
  onFixError?: (error: string) => void;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({ files, viewMode, loadingState = 'idle', onFixError }) => {
  // Convert our files to Sandpack format
  const sandpackFiles: Record<string, string> = {};

  if (files.length === 0) {
    sandpackFiles["App.tsx"] = `
import React from 'react';
import { Sparkles, Zap, Code2, Globe } from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-8 font-sans">
      <div className="max-w-2xl w-full space-y-12 text-center">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-bold uppercase tracking-widest">
            <Sparkles size={12} />
            AI Ready to Build
          </div>
          <h1 className="text-6xl font-bold tracking-tighter bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">
            What will you <span className="text-emerald-400">create</span> today?
          </h1>
          <p className="text-white/40 text-lg max-w-lg mx-auto">
            Describe your vision in the chat below. TechWiser will generate a full React application with Tailwind CSS in seconds.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: <Zap size={20} />, title: "Instant", desc: "Real-time generation" },
            { icon: <Code2 size={20} />, title: "Clean", desc: "Production code" },
            { icon: <Globe size={20} />, title: "Live", desc: "Instant preview" }
          ].map((item, i) => (
            <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div className="text-emerald-400 flex justify-center">{item.icon}</div>
              <h3 className="font-bold text-sm">{item.title}</h3>
              <p className="text-[10px] text-white/30 uppercase tracking-wider">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="pt-8 flex flex-col items-center gap-4">
          <p className="text-[10px] text-white/20 uppercase tracking-[0.3em] font-bold">Try these prompts</p>
          <div className="flex flex-wrap justify-center gap-2">
            {["SaaS Landing Page", "Crypto Dashboard", "Personal Portfolio", "E-commerce Store"].map((p) => (
              <button key={p} className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs text-white/60 hover:text-white hover:bg-white/10 transition-all">
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
    `.trim();
  } else {
    files.forEach(file => {
      sandpackFiles[file.path] = file.content;
    });
  }

  return (
    <div className="w-full h-full glass-panel rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-[#0A0A0A] relative flex flex-col">
      {/* Full Screen Loader for Initial Generation */}
      {loadingState === 'generating' && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center gap-6">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-500/30 blur-2xl rounded-full animate-pulse"></div>
            <div className="relative w-16 h-16 border-4 border-white/10 border-t-emerald-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 size={24} className="text-emerald-500 animate-spin" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <p className="text-emerald-400 font-bold tracking-widest uppercase text-sm animate-pulse">Generating App...</p>
            <p className="text-white/40 text-xs">Crafting components & styles</p>
          </div>
        </div>
      )}

      <SandpackProvider
        template="react-ts"
        theme="dark"
        files={sandpackFiles}
        options={{
          externalResources: ["https://cdn.tailwindcss.com"],
          classes: {
            "sp-layout": "!h-full !border-none !bg-transparent",
            "sp-wrapper": "!h-full",
          }
        }}
        customSetup={{
          dependencies: {
            "lucide-react": "latest",
            "motion": "latest",
            "clsx": "latest",
            "tailwind-merge": "latest"
          }
        }}
        className="h-full w-full flex-1 min-h-0"
      >
        <SandpackLayout className="!h-full !border-none !bg-transparent !rounded-none">
          <div className="flex w-full h-full">
            {/* File Explorer */}
            <div className={cn(
              "h-full border-r border-white/5 bg-black/20 shrink-0 transition-all duration-300",
              viewMode === 'preview' ? "w-0 opacity-0 overflow-hidden border-none" : "w-64 hidden md:block"
            )}>
              <SandpackFileExplorer className="!h-full !bg-transparent" />
            </div>

            {/* Code Editor */}
            <div className={cn(
              "h-full border-r border-white/5 transition-all duration-300 min-w-0 relative",
              viewMode === 'preview' ? "flex-0 w-0 opacity-0 overflow-hidden border-none" : "flex-1",
              viewMode === 'split' && "hidden lg:block"
            )}>
              <SandpackCodeEditor
                showTabs
                showLineNumbers
                closableTabs
                className="!h-full"
              />
              {loadingState === 'updating' && (
                <div className="absolute inset-0 z-10 bg-black/50 backdrop-blur-[2px] flex items-center justify-center">
                  <div className="bg-black/80 border border-white/10 px-4 py-2 rounded-full flex items-center gap-3 shadow-xl">
                    <Loader2 size={14} className="text-emerald-500 animate-spin" />
                    <span className="text-xs font-bold text-white/80">Updating Code...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Preview */}
            <div className={cn(
              "h-full bg-white relative transition-all duration-300 min-w-0",
              viewMode === 'code' ? "flex-0 w-0 opacity-0 overflow-hidden" : "flex-1"
            )}>
              <SandpackPreview
                className="!h-full"
                showNavigator
                showOpenInCodeSandbox={false}
              />

              {loadingState === 'updating' && (
                <div className="absolute inset-0 z-40 bg-white/50 backdrop-blur-[2px] flex items-center justify-center">
                  <div className="bg-black/80 border border-white/10 px-4 py-2 rounded-full flex items-center gap-3 shadow-xl">
                    <Loader2 size={14} className="text-emerald-500 animate-spin" />
                    <span className="text-xs font-bold text-white">Refreshing Preview...</span>
                  </div>
                </div>
              )}

              <div className="absolute bottom-4 right-4 flex gap-2 z-50">
                {onFixError && <FixIssuesButton onFixError={onFixError} />}
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    const iframe = document.querySelector('.sp-preview-iframe') as HTMLIFrameElement;
                    if (iframe && iframe.src) {
                      window.open(iframe.src, '_blank');
                    } else {
                      alert("Preview not ready yet. Please wait.");
                    }
                  }}
                  className="p-2 bg-black/80 text-white rounded-full hover:bg-black transition-colors shadow-lg"
                  title="Open in new tab"
                >
                  <ExternalLink size={16} />
                </a>
              </div>
            </div>
          </div>
        </SandpackLayout>
      </SandpackProvider>
    </div>
  );
};
