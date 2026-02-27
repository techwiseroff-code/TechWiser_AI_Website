'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface SettingsContextType {
  openRouterKey: string;
  setOpenRouterKey: (key: string) => void;
  geminiKey: string;
  setGeminiKey: (key: string) => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  useCustomGemini: boolean;
  setUseCustomGemini: (use: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [openRouterKey, setOpenRouterKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini-3-flash-preview'); // Default
  const [useCustomGemini, setUseCustomGemini] = useState(false);

  useEffect(() => {
    const storedOpenRouter = localStorage.getItem('techwiser_openrouter_key');
    const storedGemini = localStorage.getItem('techwiser_gemini_key');
    const storedModel = localStorage.getItem('techwiser_model');
    const storedUseCustom = localStorage.getItem('techwiser_use_custom_gemini');

    setTimeout(() => {
      if (storedOpenRouter) setOpenRouterKey(storedOpenRouter);
      if (storedGemini) setGeminiKey(storedGemini);
      if (storedModel) setSelectedModel(storedModel);
      if (storedUseCustom) setUseCustomGemini(storedUseCustom === 'true');
    }, 0);
  }, []);

  const updateOpenRouterKey = (key: string) => {
    setOpenRouterKey(key);
    localStorage.setItem('techwiser_openrouter_key', key);
  };

  const updateGeminiKey = (key: string) => {
    setGeminiKey(key);
    localStorage.setItem('techwiser_gemini_key', key);
  };

  const updateSelectedModel = (model: string) => {
    setSelectedModel(model);
    localStorage.setItem('techwiser_model', model);
  };

  const updateUseCustomGemini = (use: boolean) => {
    setUseCustomGemini(use);
    localStorage.setItem('techwiser_use_custom_gemini', String(use));
  };

  return (
    <SettingsContext.Provider value={{
      openRouterKey,
      setOpenRouterKey: updateOpenRouterKey,
      geminiKey,
      setGeminiKey: updateGeminiKey,
      selectedModel,
      setSelectedModel: updateSelectedModel,
      useCustomGemini,
      setUseCustomGemini: updateUseCustomGemini
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
