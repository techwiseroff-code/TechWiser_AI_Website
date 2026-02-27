'use client';

import React, { useState, useEffect } from 'react';
import { GitHubModal } from '@/components/GitHubModal';
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
import { useLanguage } from '@/context/LanguageContext';
import { useSettings } from '@/context/SettingsContext';
import { useAuth } from '@/context/AuthContext';
import { LandingPage } from '@/components/LandingPage';
import { SettingsModal } from '@/components/SettingsModal';
import { AuthModal } from '@/components/AuthModal';
import { OnboardingOverlay } from '@/components/OnboardingOverlay';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';

interface Project {
  id: string;
  title: string;
  date: string;
  files: GeneratedFile[];
  lastPrompt: string;
  chatHistory?: { role: string; content: string }[];
}

export default function Home() {
  const { t } = useLanguage();
  const { openRouterKey, geminiKey, selectedModel, useCustomGemini } = useSettings();
  const { user } = useAuth();
  const userToken = user?.id || 'anonymous-user';

  const [isLoading, setIsLoading] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'split' | 'preview' | 'code'>('split');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showWorkspace, setShowWorkspace] = useState(false);
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Convex hooks
  const convexWorkspaces = useQuery(api.workspace.GetAllWorkspaces, { userToken });
  const createWorkspace = useMutation(api.workspace.CreateWorkspace);
  const updateWorkspace = useMutation(api.workspace.UpdateWorkspace);
  const updateFiles = useMutation(api.workspace.UpdateFiles);
  const deleteWorkspace = useMutation(api.workspace.DeleteWorkspace);

  const projects = convexWorkspaces?.map(w => ({
    id: w._id,
    title: w.messages?.[0]?.content?.slice(0, 30) || 'New Project',
    date: new Date(w._creationTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    files: w.fileData || [],
    lastPrompt: w.messages?.[w.messages.length - 2]?.content || '',
    chatHistory: w.messages || []
  })) || [];

  const isProjectsLoading = convexWorkspaces === undefined;

  const currentProject = projects.find(p => p.id === currentProjectId);
  const files = currentProject?.files || [];

  // Fetch projects from backend on mount
  useEffect(() => {
    if (convexWorkspaces && convexWorkspaces.length > 0 && !currentProjectId && !showWorkspace) {
      setCurrentProjectId(convexWorkspaces[0]._id);
      setShowWorkspace(true);
    }
  }, [convexWorkspaces]);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 5000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Handle GitHub OAuth Redirects
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const url = new URL(window.location.href);
    const token = url.searchParams.get('github_token');
    const error = url.searchParams.get('github_error');

    if (token) {
      localStorage.setItem('techwiser_github_oauth_token', token);
      addToast("Successfully connected to GitHub!", "success");

      url.searchParams.delete('github_token');
      window.history.replaceState({}, '', url.toString());

      // We can't automatically open the modal here reliably since projects might still be loading,
      // but the token is securely saved for the next manual click.
    } else if (error) {
      addToast(`GitHub connection failed: ${error}`, "error");

      url.searchParams.delete('github_error');
      window.history.replaceState({}, '', url.toString());
    }
  }, []);


  const handleSendMessage = async (message: string) => {
    setIsLoading(true);
    setShowWorkspace(true);

    try {
      // Get history from current project if it exists
      const history = currentProject?.chatHistory || [];

      const result = await generateCode(message, history, {
        geminiKey: useCustomGemini ? geminiKey : undefined,
        openRouterKey,
        model: selectedModel
      });

      if (!result || !result.files) {
        throw new Error("The AI model failed to return a proper code structure. Please try a different model or rephrase your prompt.");
      }

      const newHistory = [
        ...history,
        { role: 'user', content: message },
        { role: 'model', content: result.description || 'Generated code' } // Using description as summary
      ];

      if (currentProjectId) {
        // Update existing project
        await updateWorkspace({
          workspaceId: currentProjectId as any,
          messages: newHistory
        });
        await updateFiles({
          workspaceId: currentProjectId as any,
          files: result.files
        });
      } else {
        // Create new project
        const newId = await createWorkspace({
          messages: newHistory,
          userToken
        });
        await updateFiles({
          workspaceId: newId as any,
          files: result.files
        });
        setCurrentProjectId(newId);
      }

      addToast("Project generated successfully!");
    } catch (error: any) {
      console.error("Generation failed:", error);
      addToast(error.message || "Failed to generate project. Please try again.", "error");
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
      await deleteWorkspace({ workspaceId: id as any });
      if (currentProjectId === id) {
        const remaining = projects.filter((p: any) => p.id !== id);
        if (remaining.length > 0) {
          setCurrentProjectId(remaining[0].id);
        } else {
          setCurrentProjectId(null);
          setShowWorkspace(false);
        }
      }
      addToast("Project deleted", "success");
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
    try {
      // For clearing history, we map over projects and delete all belonging to the user
      await Promise.all(projects.map((p: any) => deleteWorkspace({ workspaceId: p.id as any })));
      setCurrentProjectId(null);
      setShowWorkspace(false);
      addToast("History cleared in Convex", "success");
    } catch (e) {
      addToast("Failed to clear history", "error");
    }
  };

  const handleCopyCode = () => {
    if (files.length === 0) return;
    const allCode = files.map((f: any) => `// ${f.path}\n${f.content}`).join('\n\n');
    navigator.clipboard.writeText(allCode);
    addToast("Code copied to clipboard!", "success");
  };

  const handleDownloadZip = async () => {
    if (files.length === 0) return;

    const zip = new JSZip();
    files.forEach((file: any) => {
      zip.file(file.path, file.content);
    });

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `techwiser-project-${Date.now()}.zip`);
    addToast("Project downloaded as ZIP!", "success");
  };

  const handleGitHubConnect = () => {
    if (files.length === 0) return;
    setIsGitHubModalOpen(true);
  };

  const handleHome = () => {
    setCurrentProjectId(null);
    setShowWorkspace(false);
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex h-screen overflow-hidden font-sans bg-grid relative selection:bg-emerald-500/30">
      <div className="absolute inset-0 bg-noise pointer-events-none"></div>

      {/* Only show Header when not in workspace mode, or make it part of the layout flow */}
      {!showWorkspace && <Header onMenuClick={() => setIsSidebarOpen(true)} onSignIn={() => setIsAuthModalOpen(true)} />}

      <div className={cn("flex flex-1 h-full overflow-hidden", !showWorkspace ? "pt-16 md:pt-20" : "")}>
        {/* Desktop Sidebar Container */}
        <div className={cn(
          "hidden md:block h-full transition-all duration-500 ease-in-out overflow-hidden",
          isSidebarCollapsed ? "w-20" : "w-72"
        )}>
          <Sidebar
            history={projects.map(p => ({ id: p.id, title: p.title, date: p.date }))}
            onSelectProject={(id) => {
              setCurrentProjectId(id);
              setShowWorkspace(true);
            }}
            onNewProject={handleNewProject}
            onDeleteProject={handleDeleteProject}
            onClearHistory={handleClearHistory}
            onSettings={() => setIsSettingsOpen(true)}
            onHome={handleHome}
            currentProjectId={currentProjectId || undefined}
            isLoading={isProjectsLoading}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          />
        </div>

        {/* Mobile Sidebar (Drawer) */}
        <div className="md:hidden">
          <Sidebar
            history={projects.map(p => ({ id: p.id, title: p.title, date: p.date }))}
            onSelectProject={(id) => {
              setCurrentProjectId(id);
              setShowWorkspace(true);
            }}
            onNewProject={handleNewProject}
            onDeleteProject={handleDeleteProject}
            onClearHistory={handleClearHistory}
            onSettings={() => setIsSettingsOpen(true)}
            onHome={handleHome}
            currentProjectId={currentProjectId || undefined}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            isLoading={isProjectsLoading}
          />
        </div>

        <main className="flex-1 flex flex-col relative overflow-hidden h-full transition-all duration-500">
          <ToastContainer toasts={toasts} onRemove={removeToast} />
          <GitHubModal
            isOpen={isGitHubModalOpen}
            onClose={() => setIsGitHubModalOpen(false)}
            files={files}
            projectName={currentProject?.title || 'techwiser-project'}
          />
          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
          />
          <AuthModal
            isOpen={isAuthModalOpen}
            onClose={() => setIsAuthModalOpen(false)}
          />
          <OnboardingOverlay onComplete={() => { }} />

          {/* Background Decorative Elements */}
          <div className="absolute top-1/4 -right-20 w-64 md:w-96 h-64 md:h-96 bg-emerald-500/10 rounded-full blur-[80px] md:blur-[120px] pointer-events-none"></div>
          <div className="absolute bottom-1/4 -left-20 w-64 md:w-96 h-64 md:h-96 bg-cyan-500/10 rounded-full blur-[80px] md:blur-[120px] pointer-events-none"></div>

          <AnimatePresence mode="wait">
            {!showWorkspace ? (
              <motion.div
                key="landing"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="flex-1 overflow-y-auto custom-scrollbar relative z-10"
              >
                <LandingPage onStart={() => setShowWorkspace(true)} />
              </motion.div>
            ) : (
              <motion.div
                key="workspace"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="flex-1 flex flex-col overflow-hidden relative z-10"
              >
                {/* Toolbar */}
                <div className="px-4 md:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-white/5 bg-black/40 backdrop-blur-md z-40 shrink-0">
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <button
                      onClick={() => {
                        // Simple check for mobile vs desktop behavior
                        if (window.innerWidth >= 768) {
                          setIsSidebarCollapsed(!isSidebarCollapsed);
                        } else {
                          setIsSidebarOpen(true);
                        }
                      }}
                      className="p-2 hover:bg-white/5 rounded-lg text-white/60 hover:text-white transition-colors"
                      title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                    >
                      <Terminal size={20} />
                    </button>

                    <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1 border border-white/10">
                      {(['split', 'preview', 'code'] as const).map((mode) => (
                        <motion.button
                          key={mode}
                          onClick={() => setViewMode(mode)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={cn(
                            "px-3 py-1.5 rounded-md text-[10px] md:text-xs font-bold uppercase tracking-wider transition-colors",
                            viewMode === mode
                              ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                              : 'text-white/60 hover:text-white hover:bg-white/10'
                          )}
                        >
                          {mode}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar">
                    <motion.button
                      onClick={handleCopyCode}
                      disabled={files.length === 0}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30"
                      title={t('copy')}
                    >
                      <Copy size={16} />
                    </motion.button>
                    <motion.button
                      onClick={handleDownloadZip}
                      disabled={files.length === 0}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30"
                      title="Download Zip"
                    >
                      <Download size={16} />
                    </motion.button>
                    <motion.button
                      onClick={handleGitHubConnect}
                      disabled={files.length === 0}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#24292e] text-white text-xs font-bold hover:bg-[#2f363d] transition-colors border border-white/10 disabled:opacity-50"
                    >
                      <Github size={16} />
                      <span className="hidden sm:inline">GitHub</span>
                    </motion.button>
                    <div className="w-px h-6 bg-white/10 mx-1"></div>
                    <motion.button
                      onClick={handleRegenerate}
                      disabled={!currentProject || isLoading}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30"
                      title={t('regenerate')}
                    >
                      <RefreshCcw size={16} className={isLoading ? "animate-spin" : ""} />
                    </motion.button>
                    <motion.button
                      onClick={handlePublish}
                      disabled={files.length === 0 || isLoading}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-black text-xs font-bold hover:bg-emerald-400 transition-colors shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50"
                    >
                      <Sparkles size={16} />
                      <span className="hidden sm:inline">{t('publish')}</span>
                    </motion.button>
                  </div>
                </div>

                {/* Main Workspace Area */}
                <div className="flex-1 overflow-hidden relative">
                  <div className="absolute inset-0 pb-24 md:pb-32 px-4 md:px-6 pt-2 md:pt-4">
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
                          <PreviewPanel
                            files={files}
                            viewMode={viewMode}
                            loadingState={isLoading ? (files.length > 0 ? 'updating' : 'generating') : 'idle'}
                            onFixError={(error) => handleSendMessage(`Fix the following error: ${error}`)}
                          />
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

                  {/* Chat Interface - Sticky at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-[#050505] via-[#050505] to-transparent pt-12 pb-4 md:pb-6 px-4 pointer-events-none">
                    <div className="max-w-4xl mx-auto pointer-events-auto">
                      <ChatInterface onSendMessage={handleSendMessage} isLoading={isLoading} />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
