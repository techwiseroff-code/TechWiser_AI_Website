'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Sparkles, Github, Twitter, Layers, Zap, Menu } from 'lucide-react';

interface HeaderProps {
  onMenuClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { t } = useLanguage();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-3 md:px-6 py-2 md:py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between glass-panel rounded-xl md:rounded-2xl px-3 md:px-6 py-2 md:py-3 border border-white/10 shadow-xl bg-black/20 backdrop-blur-md">
        <div className="flex items-center gap-2 md:gap-3">
          <button 
            onClick={onMenuClick}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors text-white/60 md:hidden active:scale-90"
          >
            <Menu size={20} />
          </button>
          <div className="w-8 h-8 md:w-10 md:h-10 bg-emerald-500 rounded-lg md:rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)] group cursor-pointer">
            <Zap size={20} className="text-black fill-current md:w-6 md:h-6 group-hover:scale-110 transition-transform" />
          </div>
          <div className="cursor-default">
            <h1 className="text-base md:text-xl font-display font-bold tracking-tight glow-text">
              Tech<span className="text-emerald-400">Wiser</span>
            </h1>
            <div className="hidden sm:flex items-center gap-2">
              <p className="text-[8px] md:text-[10px] text-white/40 uppercase tracking-[0.2em] font-bold">Engine v2.0</p>
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-bold text-emerald-500 uppercase tracking-tighter">Pro</span>
            </div>
          </div>
        </div>

        <nav className="hidden lg:flex items-center gap-8">
          <a href="#" className="text-xs font-bold uppercase tracking-widest text-white/40 hover:text-emerald-400 transition-colors flex items-center gap-2 group">
            <Layers size={14} className="group-hover:rotate-12 transition-transform" />
            {t('workspace')}
          </a>
          <a href="#" className="text-xs font-bold uppercase tracking-widest text-white/40 hover:text-emerald-400 transition-colors">Templates</a>
          <a href="#" className="text-xs font-bold uppercase tracking-widest text-white/40 hover:text-emerald-400 transition-colors">Components</a>
        </nav>

        <div className="flex items-center gap-2 md:gap-4">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/5 border border-emerald-500/10">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></div>
            <span className="text-[9px] font-bold text-emerald-500/80 uppercase tracking-wider">Live</span>
          </div>
          <button className="hidden sm:flex p-2 hover:bg-white/5 rounded-lg transition-colors text-white/40 hover:text-white">
            <Github size={18} />
          </button>
          <button className="bg-white text-black px-4 md:px-5 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-emerald-400 transition-all duration-300 shadow-lg active:scale-95">
            Sign In
          </button>
        </div>
      </div>
    </header>
  );
};
