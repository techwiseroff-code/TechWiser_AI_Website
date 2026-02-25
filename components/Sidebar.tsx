'use client';

import React, { useState } from 'react';
import { 
  Layout, 
  History, 
  Settings, 
  ChevronRight, 
  FolderOpen, 
  Plus,
  Trash2,
  Clock,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/Skeleton';
import { useLanguage } from '@/context/LanguageContext';

interface SidebarProps {
  history: { id: string; title: string; date: string }[];
  onSelectProject: (id: string) => void;
  onNewProject: () => void;
  onDeleteProject: (id: string) => void;
  onClearHistory: () => void;
  currentProjectId?: string;
  isOpen?: boolean;
  onClose?: () => void;
  isLoading?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  history, 
  onSelectProject, 
  onNewProject,
  onDeleteProject,
  onClearHistory,
  currentProjectId,
  isOpen,
  onClose,
  isLoading
}) => {
  const { t } = useLanguage();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] md:hidden"
          onClick={onClose}
        />
      )}

      <aside className={cn(
        "fixed md:static inset-y-0 left-0 w-72 h-full glass-panel border-r border-white/5 flex flex-col z-[70] transition-transform duration-500 ease-in-out md:translate-x-0",
        isOpen ? "translate-x-0 shadow-[0_0_50px_rgba(0,0,0,0.5)]" : "-translate-x-full"
      )}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-emerald-500 rounded flex items-center justify-center">
              <Zap size={14} className="text-black fill-current" />
            </div>
            <span className="font-display font-bold text-sm tracking-tight">TechWiser</span>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-lg md:hidden text-white/40"
          >
            <ChevronRight size={18} className="rotate-180" />
          </button>
        </div>

        <div className="px-6 pb-4">
          <button 
            onClick={() => {
              onNewProject();
              onClose?.();
            }}
            className="w-full bg-emerald-500 text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] active:scale-95 group"
          >
            <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
            {t('newProject')}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-6 custom-scrollbar">
          <div>
            <div className="flex items-center justify-between px-2 mb-3">
              <h3 className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold">{t('recentProjects')}</h3>
              {history.length > 0 && !isLoading && (
                <button 
                  onClick={onClearHistory}
                  className="text-[10px] text-white/20 hover:text-red-400 transition-colors uppercase tracking-wider font-bold"
                >
                  {t('clear')}
                </button>
              )}
            </div>
            <div className="space-y-1">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="px-3 py-2.5 rounded-xl border border-white/5 bg-white/5">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-4 h-4 rounded-md" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-3 w-3/4 rounded" />
                        <Skeleton className="h-2 w-1/2 rounded" />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                history.map((project) => (
                  <div key={project.id} className="group relative">
                    <button
                      onClick={() => {
                        onSelectProject(project.id);
                        onClose?.();
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all",
                        currentProjectId === project.id 
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                          : "text-white/50 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      <FolderOpen size={16} className={cn(currentProjectId === project.id ? "text-emerald-400" : "text-white/20")} />
                      <div className="flex-1 text-left truncate">
                        <p className="text-sm font-medium truncate">{project.title}</p>
                        <p className="text-[10px] opacity-50 flex items-center gap-1">
                          <Clock size={10} /> {project.date}
                        </p>
                      </div>
                      <ChevronRight size={14} className={cn("transition-opacity", currentProjectId === project.id ? "opacity-100" : "opacity-0 group-hover:opacity-100")} />
                    </button>
                    
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteProject(project.id);
                      }}
                      className="absolute right-8 top-1/2 -translate-y-1/2 p-1.5 text-white/0 group-hover:text-white/30 hover:text-red-400 transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <h3 className="px-2 text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold mb-3">{t('workspace')}</h3>
            <div className="space-y-1">
              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/50 hover:bg-white/5 hover:text-white transition-all">
                <Layout size={16} className="text-white/20" />
                <span className="text-sm font-medium">Dashboard</span>
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/50 hover:bg-white/5 hover:text-white transition-all">
                <History size={16} className="text-white/20" />
                <span className="text-sm font-medium">Global History</span>
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/50 hover:bg-white/5 hover:text-white transition-all">
                <Settings size={16} className="text-white/20" />
                <span className="text-sm font-medium">{t('settings')}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-white/5 space-y-4">
          <div className="px-2 space-y-2">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-widest font-bold text-white/30">
              <span>{t('storage')}</span>
              <span>{history.length} / 50 Projects</span>
            </div>
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 transition-all duration-500" 
                style={{ width: `${(history.length / 50) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="glass-card rounded-xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500"></div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-bold truncate">TechWiser Pro</p>
              <p className="text-[10px] text-emerald-500 font-medium">Free Plan</p>
            </div>
            <button className="text-white/30 hover:text-red-400 transition-colors">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
