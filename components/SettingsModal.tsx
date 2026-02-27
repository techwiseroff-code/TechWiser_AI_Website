'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { X, Globe, Cpu, Key, Check, AlertCircle, LogOut, User, Search, Loader2, ExternalLink, Zap, Star, RefreshCcw } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useSettings } from '@/context/SettingsContext';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { fetchOpenRouterModels, GEMINI_MODELS, formatPricing, formatContextLength, type OpenRouterModel } from '@/lib/openrouter';

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
  const [openRouterModels, setOpenRouterModels] = useState<OpenRouterModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelSearch, setModelSearch] = useState('');
  const [modelError, setModelError] = useState('');

  // Fetch OpenRouter models when the models tab is accessed
  useEffect(() => {
    if (activeTab === 'models' && openRouterModels.length === 0 && !isLoadingModels) {
      loadModels();
    }
  }, [activeTab]);

  const loadModels = async () => {
    setIsLoadingModels(true);
    setModelError('');
    try {
      const models = await fetchOpenRouterModels();
      setOpenRouterModels(models);
    } catch (err) {
      setModelError('Failed to load models. Showing fallback list.');
    } finally {
      setIsLoadingModels(false);
    }
  };

  // Filter models by search query
  const filteredOpenRouterModels = useMemo(() => {
    if (!modelSearch.trim()) return openRouterModels;
    const query = modelSearch.toLowerCase();
    return openRouterModels.filter(
      m => m.name.toLowerCase().includes(query) ||
        m.provider.toLowerCase().includes(query) ||
        m.description.toLowerCase().includes(query) ||
        m.id.toLowerCase().includes(query)
    );
  }, [openRouterModels, modelSearch]);

  const filteredGeminiModels = useMemo(() => {
    if (!modelSearch.trim()) return GEMINI_MODELS;
    const query = modelSearch.toLowerCase();
    return GEMINI_MODELS.filter(
      m => m.name.toLowerCase().includes(query) ||
        m.description.toLowerCase().includes(query)
    );
  }, [modelSearch]);

  // Check if selected model is a non-Gemini model
  const isOpenRouterModelSelected = selectedModel && !GEMINI_MODELS.some(m => m.id === selectedModel);

  // Get active model info
  const activeModelInfo = useMemo(() => {
    return GEMINI_MODELS.find(m => m.id === selectedModel) ||
      openRouterModels.find(m => m.id === selectedModel);
  }, [selectedModel, openRouterModels]);

  const providerColor = (provider: string): string => {
    const colors: Record<string, string> = {
      'Google': 'text-blue-400 bg-blue-500/10 border-blue-500/20',
      'OpenAI': 'text-green-400 bg-green-500/10 border-green-500/20',
      'Anthropic': 'text-orange-400 bg-orange-500/10 border-orange-500/20',
      'DeepSeek': 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
      'Meta': 'text-blue-300 bg-blue-400/10 border-blue-400/20',
      'Mistral': 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      'Qwen': 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    };
    return colors[provider] || 'text-white/60 bg-white/5 border-white/10';
  };

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
            className="relative w-full max-w-2xl glass-panel rounded-2xl border border-white/10 shadow-2xl overflow-hidden bg-[#0d1117] flex flex-col md:flex-row h-[85vh] max-h-[650px]"
          >
            {/* Sidebar */}
            <div className="w-full md:w-48 border-b md:border-b-0 md:border-r border-white/10 bg-black/20 p-4 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible shrink-0">
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
                className="absolute right-4 top-4 p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors z-10"
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
                  <div className="space-y-6">
                    {/* Currently Active Model */}
                    {activeModelInfo && (
                      <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                          <Zap size={16} className="text-emerald-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-emerald-400/70 font-bold uppercase tracking-wider">Active Model</p>
                          <p className="text-sm font-bold text-white truncate">{activeModelInfo.name}</p>
                        </div>
                      </div>
                    )}

                    {/* Search Models */}
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                      <input
                        type="text"
                        value={modelSearch}
                        onChange={(e) => setModelSearch(e.target.value)}
                        placeholder="Search models..."
                        className="w-full bg-black/20 border border-white/10 rounded-xl py-2.5 pl-9 pr-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 transition-colors"
                      />
                    </div>

                    {/* Gemini Models (Direct) */}
                    {filteredGeminiModels.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-white/40">Gemini — Direct API</h3>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase tracking-tighter">No key needed</span>
                        </div>
                        <div className="grid gap-2">
                          {filteredGeminiModels.map((model) => (
                            <ModelCard
                              key={model.id}
                              model={model}
                              isSelected={selectedModel === model.id}
                              onSelect={() => setSelectedModel(model.id)}
                              providerColorClass={providerColor(model.provider)}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* OpenRouter Models */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-white/40">OpenRouter Models</h3>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-white/5 text-white/40 border border-white/10 uppercase tracking-tighter">API key required</span>
                        </div>
                        <button
                          onClick={loadModels}
                          disabled={isLoadingModels}
                          className="p-1.5 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors"
                          title="Refresh models"
                        >
                          <RefreshCcw size={12} className={isLoadingModels ? "animate-spin" : ""} />
                        </button>
                      </div>

                      {isLoadingModels ? (
                        <div className="space-y-2">
                          {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-20 rounded-xl bg-white/5 animate-pulse" />
                          ))}
                        </div>
                      ) : modelError ? (
                        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
                          <AlertCircle size={16} />
                          {modelError}
                        </div>
                      ) : filteredOpenRouterModels.length > 0 ? (
                        <div className="grid gap-2 max-h-[250px] overflow-y-auto custom-scrollbar pr-1">
                          {filteredOpenRouterModels.map((model) => (
                            <ModelCard
                              key={model.id}
                              model={model}
                              isSelected={selectedModel === model.id}
                              onSelect={() => setSelectedModel(model.id)}
                              providerColorClass={providerColor(model.provider)}
                            />
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-white/30 text-center py-4">
                          {modelSearch ? 'No models match your search.' : 'No models loaded yet.'}
                        </p>
                      )}
                    </div>

                    {/* Warning if OpenRouter model selected without key */}
                    {isOpenRouterModelSelected && !openRouterKey && (
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2">
                        <AlertCircle size={16} className="text-amber-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-amber-400">OpenRouter API Key Required</p>
                          <p className="text-xs text-amber-400/70 mt-0.5">You&apos;ve selected a non-Gemini model. Please add your OpenRouter API key below to use it.</p>
                        </div>
                      </div>
                    )}

                    {/* Gemini API Key */}
                    <div className="space-y-4 pt-4 border-t border-white/5">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-base font-bold">Gemini API Key</h3>
                          <p className="text-xs text-white/50">Use your own Google AI Studio key.</p>
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
                        <div className="space-y-2">
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
                          <a
                            href="https://aistudio.google.com/apikey"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-[11px] text-emerald-400/70 hover:text-emerald-400 transition-colors font-medium"
                          >
                            <ExternalLink size={10} />
                            Get a free API key from Google AI Studio
                          </a>
                        </div>
                      )}
                    </div>

                    {/* OpenRouter API Key */}
                    <div className="space-y-4 pt-4 border-t border-white/5">
                      <div>
                        <h3 className="text-base font-bold">OpenRouter API Key</h3>
                        <p className="text-xs text-white/50">Required for non-Gemini models (GPT-4, Claude, etc).</p>
                      </div>
                      <div className="space-y-2">
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
                        <a
                          href="https://openrouter.ai/keys"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-[11px] text-emerald-400/70 hover:text-emerald-400 transition-colors font-medium"
                        >
                          <ExternalLink size={10} />
                          Get an API key from OpenRouter
                        </a>
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
                          onClick={onClose}
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

// ─── Model Card Component ───────────────────────────────────────────────────

interface ModelCardProps {
  model: OpenRouterModel;
  isSelected: boolean;
  onSelect: () => void;
  providerColorClass: string;
}

const ModelCard: React.FC<ModelCardProps> = ({ model, isSelected, onSelect, providerColorClass }) => {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full text-left p-3 rounded-xl border transition-all duration-200 group",
        isSelected
          ? "bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
          : "bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-bold text-white truncate">{model.name}</span>
            <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-bold border shrink-0", providerColorClass)}>
              {model.provider}
            </span>
          </div>
          <p className="text-[11px] text-white/40 line-clamp-2 leading-relaxed">{model.description}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-[10px] text-white/30 font-medium">
              {formatContextLength(model.contextLength)} ctx
            </span>
            <span className="text-[10px] text-white/30">•</span>
            <span className="text-[10px] text-white/30 font-medium">
              ↑ {formatPricing(model.pricing.prompt)}
            </span>
            <span className="text-[10px] text-white/30 font-medium">
              ↓ {formatPricing(model.pricing.completion)}
            </span>
          </div>
        </div>
        <div className={cn(
          "w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-all",
          isSelected
            ? "bg-emerald-500 border-emerald-500"
            : "border-white/20 group-hover:border-white/30"
        )}>
          {isSelected && <Check size={12} className="text-black" />}
        </div>
      </div>
    </button>
  );
};
