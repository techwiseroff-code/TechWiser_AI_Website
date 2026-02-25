'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { ChatInterface } from '@/components/ChatInterface';
import { PreviewPanel } from '@/components/PreviewPanel';
import { ToastContainer, Toast } from '@/components/Toast';
import { generateCode, GeneratedFile } from '@/lib/gemini';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Terminal, Code2, Eye, Maximize2, RefreshCcw, Copy, Download, Github, ExternalLink, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface Project {
  id: string;
  title: string;
  date: string;
  files: GeneratedFile[];
  lastPrompt: string;
  chatHistory?: { role: string; content: string }[];
}

import { useLanguage } from '@/context/LanguageContext';

import { LandingPage } from '@/components/LandingPage';

export default function Home() {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [isProjectsLoading, setIsProjectsLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'split' | 'preview' | 'code'>('split');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showWorkspace, setShowWorkspace] = useState(false);

  // Fetch projects from backend on mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsProjectsLoading(true);
        const response = await fetch('/api/projects');
        if (response.ok) {
          const data = await response.json();
          setProjects(data);
          if (data.length > 0) {
            setCurrentProjectId(data[0].id);
            setShowWorkspace(true);
          }
        }
      } catch (e) {
        console.error("Failed to fetch projects", e);
        addToast("Failed to connect to server", "error");
      } finally {
        setIsProjectsLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 5000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const currentProject = projects.find(p => p.id === currentProjectId);
  const files = currentProject?.files || [];

  const handleSendMessage = async (message: string) => {
    setIsLoading(true);
    setShowWorkspace(true);
    
    try {
      // Get history from current project if it exists
      const history = currentProject?.chatHistory || [];
      
      const result = await generateCode(message, history);
      
      const newHistory = [
        ...history,
        { role: 'user', content: message },
        { role: 'model', content: result.description } // Using description as summary
      ];

      const projectData = {
        title: currentProject ? currentProject.title : (message.slice(0, 30) + (message.length > 30 ? '...' : '')),
        date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        files: result.files,
        lastPrompt: message,
        chatHistory: newHistory
      };

      let response;
      if (currentProjectId) {
        // Update existing project
        response = await fetch(`/api/projects/${currentProjectId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(projectData),
        });
      } else {
        // Create new project
        response = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(projectData),
        });
      }

      if (response.ok) {
        const savedProject = await response.json();
        if (currentProjectId) {
          setProjects(prev => prev.map(p => p.id === currentProjectId ? savedProject : p));
        } else {
          setProjects(prev => [savedProject, ...prev]);
          setCurrentProjectId(savedProject.id);
        }
        addToast("Project generated successfully!");
      } else {
        throw new Error("Failed to save project");
      }
    } catch (error) {
      console.error("Generation failed:", error);
      addToast("Failed to generate project. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewProject = () => {
    setCurrentProjectId(null);
    setShowWorkspace(true);
    addToast("Started new workspace");
  };

  const handleDeleteProject = async (id: string) => {
    try {
      const response = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setProjects(prev => prev.filter(p => p.id !== id));
        if (currentProjectId === id) {
          const remaining = projects.filter(p => p.id !== id);
          if (remaining.length > 0) {
            setCurrentProjectId(remaining[0].id);
          } else {
            setCurrentProjectId(null);
            setShowWorkspace(false);
          }
        }
        addToast("Project deleted", "success");
      }
    } catch (e) {
      addToast("Failed to delete project", "error");
    }
  };

  const handleRegenerate = async () => {
    if (!currentProject?.lastPrompt) return;
    handleSendMessage(currentProject.lastPrompt);
  };

  const handlePublish = () => {
    if (files.length === 0) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      addToast("App published to production! (Simulation)", "success");
    }, 2000);
  };

  const handleClearHistory = async () => {
    // For simplicity, we'll just delete all one by one or add a clear endpoint
    // Here we'll just clear the UI and let the user know
    setProjects([]);
    setCurrentProjectId(null);
    setShowWorkspace(false);
    addToast("History cleared in UI", "success");
  };

  const handleCopyCode = () => {
    if (files.length === 0) return;
    const allCode = files.map(f => `// ${f.path}\n${f.content}`).join('\n\n');
    navigator.clipboard.writeText(allCode);
    addToast("Code copied to clipboard!", "success");
  };

  const handleDownload = () => {
    if (files.length === 0) return;
    const allCode = files.map(f => `// ${f.path}\n${f.content}`).join('\n\n');
    const blob = new Blob([allCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `techwiser-project-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    addToast("Project downloaded!", "success");
  };

  const handleDownloadZip = async () => {
    if (files.length === 0) return;
    
    const zip = new JSZip();
    files.forEach(file => {
      zip.file(file.path, file.content);
    });
    
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `techwiser-project-${Date.now()}.zip`);
    addToast("Project downloaded as ZIP!", "success");
  };

  const handleGitHubConnect = () => {
    // Placeholder for GitHub OAuth flow
    addToast("GitHub integration coming soon!", "info");
  };

  return (
    <div className="flex h-screen overflow-hidden font-sans bg-grid relative selection:bg-emerald-500/30">
      <div className="absolute inset-0 bg-noise pointer-events-none"></div>
      <Header onMenuClick={() => setIsSidebarOpen(true)} />
      
      <div className="flex flex-1 pt-16 md:pt-20 h-full overflow-hidden">
        <Sidebar 
          history={projects.map(p => ({ id: p.id, title: p.title, date: p.date }))} 
          onSelectProject={(id) => {
            setCurrentProjectId(id);
            setShowWorkspace(true);
          }} 
          onNewProject={handleNewProject}
          onDeleteProject={handleDeleteProject}
          onClearHistory={handleClearHistory}
          currentProjectId={currentProjectId || undefined}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          isLoading={isProjectsLoading}
        />

        <main className="flex-1 flex flex-col relative overflow-hidden h-full">
          <ToastContainer toasts={toasts} onRemove={removeToast} />
          
          {/* Background Decorative Elements */}
          <div className="absolute top-1/4 -right-20 w-64 md:w-96 h-64 md:h-96 bg-emerald-500/10 rounded-full blur-[80px] md:blur-[120px] pointer-events-none"></div>
          <div className="absolute bottom-1/4 -left-20 w-64 md:w-96 h-64 md:h-96 bg-cyan-500/10 rounded-full blur-[80px] md:blur-[120px] pointer-events-none"></div>

          {!showWorkspace ? (
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <LandingPage onStart={() => setShowWorkspace(true)} />
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Toolbar */}
              <div className="px-4 md:px-6 py-3 md:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 md:gap-0 border-b border-white/5 bg-black/20 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1 border border-white/10">
                    {(['split', 'preview', 'code'] as const).map((mode) => (
                      <button 
                        key={mode}
                        onClick={() => setViewMode(mode)}
                        className={cn(
                          "px-3 py-1.5 rounded-md text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all",
                          viewMode === mode 
                            ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                            : 'text-white/40 hover:text-white hover:bg-white/5'
                        )}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 md:gap-3 w-full sm:w-auto overflow-x-auto no-scrollbar pb-1 sm:pb-0">
                  <button 
                    onClick={handleCopyCode}
                    disabled={files.length === 0}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 md:px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] md:text-xs font-bold text-white/60 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    <Copy size={14} />
                    <span>{t('copy')}</span>
                  </button>
                  <button 
                    onClick={handleDownloadZip}
                    disabled={files.length === 0}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 md:px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] md:text-xs font-bold text-white/60 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    <Download size={14} />
                    <span>{t('download')} Zip</span>
                  </button>
                  <button 
                    onClick={handleGitHubConnect}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 md:px-4 py-2 rounded-xl bg-[#24292e] text-white text-[10px] md:text-xs font-bold hover:bg-[#2f363d] transition-all whitespace-nowrap border border-white/10"
                  >
                    <Github size={14} />
                    <span>GitHub</span>
                  </button>
                  <button 
                    onClick={handleRegenerate}
                    disabled={!currentProject || isLoading}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 md:px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] md:text-xs font-bold text-white/60 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    <RefreshCcw size={14} className={isLoading ? "animate-spin" : ""} />
                    <span>{t('regenerate')}</span>
                  </button>
                  <button 
                    onClick={handlePublish}
                    disabled={files.length === 0 || isLoading}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 md:px-4 py-2 rounded-xl bg-emerald-500 text-black text-[10px] md:text-xs font-bold hover:bg-emerald-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 whitespace-nowrap"
                  >
                    <Sparkles size={14} />
                    {t('publish')}
                  </button>
                </div>
              </div>

              {/* Main Workspace Area */}
              <div className="flex-1 px-2 md:px-6 py-2 md:py-4 overflow-hidden">
                <div className="w-full h-full relative">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentProjectId || 'empty'}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.3 }}
                      className="w-full h-full"
                    >
                      <PreviewPanel files={files} viewMode={viewMode} isLoading={isLoading} />
                    </motion.div>
                  </AnimatePresence>

                  {/* Status Indicator */}
                  {isLoading && (
                    <div className="absolute top-4 right-4 z-20">
                      <div className="glass-card px-4 py-2 rounded-full flex items-center gap-3 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.2)] bg-black/40 backdrop-blur-md">
                        <div className="relative flex h-2 w-2 md:h-3 md:w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 md:h-3 md:w-3 bg-emerald-500"></span>
                        </div>
                        <span className="text-[10px] md:text-xs font-bold text-emerald-400 uppercase tracking-widest">{t('aiThinking')}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Chat Interface - Sticky at bottom for mobile app feel */}
          <div className="absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-[#050505] via-[#050505]/95 to-transparent pt-12 pb-4 md:pb-8 px-4">
            <ChatInterface onSendMessage={handleSendMessage} isLoading={isLoading} />
          </div>
        </main>
      </div>
    </div>
  );
}
