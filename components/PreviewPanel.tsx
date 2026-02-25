'use client';

import React from 'react';
import { 
  SandpackProvider, 
  SandpackLayout, 
  SandpackCodeEditor, 
  SandpackPreview,
  SandpackFileExplorer
} from "@codesandbox/sandpack-react";
import { autocompletion, completionKeymap } from "@codemirror/autocomplete";
import { GeneratedFile } from '@/lib/gemini';
import { cn } from '@/lib/utils';
import { Loader2, ExternalLink } from 'lucide-react';

interface PreviewPanelProps {
  files: GeneratedFile[];
  viewMode: 'split' | 'preview' | 'code';
  isLoading?: boolean;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({ files, viewMode, isLoading }) => {
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
    <div className="w-full h-full glass-panel rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black/40 relative">
      {isLoading && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full animate-pulse"></div>
            <Loader2 size={48} className="text-emerald-500 animate-spin relative z-10" />
          </div>
          <p className="text-emerald-400 font-bold tracking-widest uppercase text-xs animate-pulse">Generating App...</p>
        </div>
      )}
      <SandpackProvider
        template="react-ts"
        theme="dark"
        files={sandpackFiles}
        options={{
          externalResources: ["https://cdn.tailwindcss.com"],
        }}
        customSetup={{
          dependencies: {
            "lucide-react": "latest",
            "motion": "latest",
            "clsx": "latest",
            "tailwind-merge": "latest"
          }
        }}
      >
        <SandpackLayout className="h-full border-none">
          {viewMode !== 'preview' && (
            <SandpackFileExplorer className="h-full border-r border-white/5 bg-black/20 hidden md:block" />
          )}
          {viewMode !== 'preview' && (
            <SandpackCodeEditor 
              showTabs 
              showLineNumbers
              closableTabs
              className="h-full border-r border-white/5 flex-1"
            />
          )}

          {viewMode !== 'code' && (
            <div className={cn(
              "h-full bg-white relative",
              viewMode === 'split' ? 'hidden lg:block lg:flex-1' : 'flex-1'
            )}>
              <SandpackPreview 
                className="h-full"
                showNavigator
                showOpenInCodeSandbox={false}
              />
              <a 
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  // Sandpack doesn't easily expose the URL, but we can try to find the iframe
                  const iframe = document.querySelector('.sp-preview-iframe') as HTMLIFrameElement;
                  if (iframe && iframe.src) {
                    window.open(iframe.src, '_blank');
                  } else {
                    alert("Preview not ready yet. Please wait.");
                  }
                }}
                className="absolute bottom-4 right-4 p-2 bg-black/80 text-white rounded-full hover:bg-black transition-colors z-50 shadow-lg"
                title="Open in new tab"
              >
                <ExternalLink size={16} />
              </a>
            </div>
          )}
        </SandpackLayout>
      </SandpackProvider>
    </div>
  );
};
