'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Language = 'en' | 'hi' | 'mr';

interface Translations {
  [key: string]: {
    en: string;
    hi: string;
    mr: string;
  };
}

export const translations: Translations = {
  newProject: {
    en: 'New Project',
    hi: 'नया प्रोजेक्ट',
    mr: 'नवीन प्रकल्प',
  },
  recentProjects: {
    en: 'Recent Projects',
    hi: 'हाल के प्रोजेक्ट',
    mr: 'अलीकडील प्रकल्प',
  },
  workspace: {
    en: 'Workspace',
    hi: 'कार्यक्षेत्र',
    mr: 'काम करण्याची जागा',
  },
  settings: {
    en: 'Settings',
    hi: 'सेटिंग्स',
    mr: 'सेटिंग्ज',
  },
  publish: {
    en: 'Publish App',
    hi: 'ऐप प्रकाशित करें',
    mr: 'अॅप प्रकाशित करा',
  },
  regenerate: {
    en: 'Re-generate',
    hi: 'फिर से बनाएँ',
    mr: 'पुन्हा तयार करा',
  },
  copy: {
    en: 'Copy',
    hi: 'कॉपी करें',
    mr: 'कॉपी करा',
  },
  download: {
    en: 'Download',
    hi: 'डाउनलोड करें',
    mr: 'डाउनलोड करा',
  },
  placeholder: {
    en: 'Describe the website or app you want to build...',
    hi: 'वह वेबसाइट या ऐप बताएं जिसे आप बनाना चाहते हैं...',
    mr: 'तुम्हाला तयार करायची असलेली वेबसाइट किंवा अॅप सांगा...',
  },
  aiThinking: {
    en: 'AI is thinking...',
    hi: 'AI सोच रहा है...',
    mr: 'AI विचार करत आहे...',
  },
  storage: {
    en: 'Storage',
    hi: 'स्टोरेज',
    mr: 'स्टोरेज',
  },
  clear: {
    en: 'Clear',
    hi: 'साफ करें',
    mr: 'साफ करा',
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: keyof typeof translations) => {
    return translations[key][language] || translations[key]['en'];
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
