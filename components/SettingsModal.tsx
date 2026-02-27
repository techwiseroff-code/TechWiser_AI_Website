'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { X, Globe, Cpu, Key, Check, AlertCircle, LogOut, User } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useSettings } from '@/context/SettingsContext';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { language, setLanguage, t } = useLanguage();
  const { 
    openRouterKey, setOpenRouterKey, 
    geminiKey, setGeminiKey, 
    selectedModel, setSelectedModel,
    useCustomGemini, setUseCustomGemini
  } = useSettings();
  const { user, logout } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'general' | 'models' | 'account'>('general');
  const [availableModels, setAvailableModels] = useState<{id: string, name: string}[]>([
    { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash (Default)' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
    { id: 'gpt-4o', name: 'GPT-4o (via OpenRouter)' },
    { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet (via OpenRouter)' },
    { id: 'deepseek-coder-v2', name: 'DeepSeek Coder V2 (via OpenRouter)' },
  ]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl glass-panel rounded-2xl border border-white/10 shadow-2xl overflow-hidden bg-[#0d1117] flex flex-col md:flex-row h-[600px] md:h-[500px]"
          >
            {/* Sidebar */}
            <div className="w-full md:w-48 border-b md:border-b-0 md:border-r border-white/10 bg-black/20 p-4 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible">
              <button 
                onClick={() => setActiveTab('general')}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
                  activeTab === 'general' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "text-white/60 hover:text-white hover:bg-white/5"
                )}
              >
                <Globe size={16} />
                General
              </button>
              <button 
                onClick={() => setActiveTab('models')}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
                  activeTab === 'models' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "text-white/60 hover:text-white hover:bg-white/5"
                )}
              >
                <Cpu size={16} />
                Models & API
              </button>
              <button 
                onClick={() => setActiveTab('account')}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
                  activeTab === 'account' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "text-white/60 hover:text-white hover:bg-white/5"
                )}
              >
                <User size={16} />
                Account
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar relative">
              <button 
                onClick={onClose}
                className="absolute right-4 top-4 p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>

              <div className="mt-2">
                {activeTab === 'general' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-bold mb-1">Language</h3>
                      <p className="text-sm text-white/50 mb-4">Choose your preferred language for the interface.</p>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { code: 'en', name: 'English' },
                          { code: 'es', name: 'Español' },
                          { code: 'fr', name: 'Français' },
                          { code: 'de', name: 'Deutsch' },
                          { code: 'hi', name: 'Hindi' },
                          { code: 'zh', name: 'Chinese' },
                          { code: 'ja', name: 'Japanese' },
                        ].map((lang) => (
                          <button
                            key={lang.code}
                            onClick={() => setLanguage(lang.code as any)}
                            className={cn(
                              "flex items-center justify-between px-4 py-3 rounded-xl border transition-all",
                              language === lang.code 
                                ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400" 
                                : "bg-white/5 border-white/5 text-white/70 hover:bg-white/10 hover:border-white/10"
                            )}
                          >
                            <span>{lang.name}</span>
                            {language === lang.code && <Check size={16} />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'models' && (
                  <div className="space-y-8">
                    {/* Model Selection */}
                    <div>
                      <h3 className="text-lg font-bold mb-1">AI Model</h3>
                      <p className="text-sm text-white/50 mb-4">Select the AI model to use for code generation.</p>
                      <div className="relative">
                        <select 
                          value={selectedModel}
                          onChange={(e) => setSelectedModel(e.target.value)}
                          className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-emerald-500/50 appearance-none cursor-pointer"
                        >
                          {availableModels.map(model => (
                            <option key={model.id} value={model.id} className="bg-[#0d1117] text-white">
                              {model.name}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/40">
                          <ChevronDownIcon />
                        </div>
                      </div>
                    </div>

                    {/* Gemini API Key */}
                    <div className="space-y-4 pt-4 border-t border-white/5">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-base font-bold">Gemini API Key</h3>
                          <p className="text-xs text-white/50">Override the default API key with your own.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={useCustomGemini}
                            onChange={(e) => setUseCustomGemini(e.target.checked)}
                            className="sr-only peer" 
                          />
                          <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                        </label>
                      </div>
                      
                      {useCustomGemini && (
                        <div className="relative">
                          <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                          <input 
                            type="password" 
                            value={geminiKey}
                            onChange={(e) => setGeminiKey(e.target.value)}
                            placeholder="AIza..."
                            className="w-full bg-black/20 border border-white/10 rounded-xl py-2.5 pl-9 pr-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 transition-colors"
                          />
                        </div>
                      )}
                    </div>

                    {/* OpenRouter API Key */}
                    <div className="space-y-4 pt-4 border-t border-white/5">
                      <div>
                        <h3 className="text-base font-bold">OpenRouter API Key</h3>
                        <p className="text-xs text-white/50">Required for models other than Gemini (GPT-4, Claude, etc).</p>
                      </div>
                      <div className="relative">
                        <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                        <input 
                          type="password" 
                          value={openRouterKey}
                          onChange={(e) => setOpenRouterKey(e.target.value)}
                          placeholder="sk-or-..."
                          className="w-full bg-black/20 border border-white/10 rounded-xl py-2.5 pl-9 pr-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 transition-colors"
                        />
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-white/40 bg-white/5 p-2 rounded-lg">
                        <AlertCircle size={12} />
                        <span>Keys are stored locally in your browser and never sent to our servers.</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'account' && (
                  <div className="space-y-6">
                    {user ? (
                      <div className="space-y-6">
                        <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                          <div className="w-16 h-16 rounded-full overflow-hidden bg-emerald-500/20 border-2 border-emerald-500/30 relative">
                            <Image 
                              src={user.avatar || ''} 
                              alt={user.name} 
                              fill
                              className="object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold">{user.name}</h3>
                            <p className="text-sm text-white/50">{user.email}</p>
                            <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                              Pro Plan
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="text-sm font-bold uppercase tracking-wider text-white/40">Account Actions</h4>
                          <button 
                            onClick={logout}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all"
                          >
                            <LogOut size={16} />
                            Sign Out
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                          <User size={32} className="text-white/20" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold">Not Signed In</h3>
                          <p className="text-sm text-white/50 max-w-xs mx-auto">Sign in to sync your projects across devices and access premium features.</p>
                        </div>
                        <button 
                          onClick={onClose} // Close settings to show auth modal (handled in parent or we can trigger it here)
                          className="px-6 py-2 bg-emerald-500 text-black font-bold rounded-xl hover:bg-emerald-400 transition-colors"
                        >
                          Sign In / Sign Up
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const ChevronDownIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
