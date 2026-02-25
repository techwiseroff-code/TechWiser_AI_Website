'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Mic, Send, Languages, Sparkles, Loader2, StopCircle, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { useLanguage, Language } from '@/context/LanguageContext';

interface ChatInterfaceProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ onSendMessage, isLoading }) => {
  const { language, setLanguage, t } = useLanguage();
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => prev + (prev ? ' ' : '') + transcript);
        setIsRecording(false);
      };

      recognitionRef.current.onerror = () => {
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, []);

  useEffect(() => {
    if (recognitionRef.current) {
      const langMap: Record<string, string> = {
        en: 'en-US',
        hi: 'hi-IN',
        mr: 'mr-IN'
      };
      recognitionRef.current.lang = langMap[language];
    }
  }, [language]);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      setIsRecording(true);
      recognitionRef.current?.start();
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (input.trim() && !isLoading) {
      const languageInstruction = `[Respond in ${language === 'hi' ? 'Hindi' : language === 'mr' ? 'Marathi' : 'English'}] `;
      onSendMessage(languageInstruction + input);
      setInput('');
    }
  };

  const languages: { code: Language; name: string }[] = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'हिन्दी' },
    { code: 'mr', name: 'मराठी' },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex justify-center mb-4 overflow-x-auto no-scrollbar py-1">
        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/10 shadow-lg backdrop-blur-md">
          {languages.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => setLanguage(lang.code)}
              className={cn(
                "px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap",
                language === lang.code 
                  ? "bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)] scale-105" 
                  : "text-white/40 hover:text-white hover:bg-white/5"
              )}
            >
              {lang.name}
            </button>
          ))}
        </div>
      </div>
      <form 
        onSubmit={handleSubmit}
        className="relative group"
      >
        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-2xl blur opacity-10 group-hover:opacity-20 transition duration-1000 group-focus-within:opacity-30"></div>
        
        <div className="relative glass-panel rounded-2xl p-1.5 md:p-2 flex items-end gap-1 md:gap-2 shadow-2xl border-white/10 bg-black/40 backdrop-blur-xl">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder={t('placeholder')}
            className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder:text-white/20 resize-none py-3 px-3 md:px-4 min-h-[52px] max-h-[160px] font-sans text-sm md:text-base custom-scrollbar"
            rows={1}
          />

          <div className="flex items-center gap-1 md:gap-1.5 p-1">
            <button
              type="button"
              onClick={toggleRecording}
              className={cn(
                "p-2.5 md:p-3 rounded-xl transition-all duration-300",
                isRecording 
                  ? "bg-red-500/20 text-red-400 animate-pulse" 
                  : "hover:bg-white/5 text-white/40 hover:text-emerald-400"
              )}
            >
              {isRecording ? <StopCircle size={18} /> : <Mic size={18} />}
            </button>

            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className={cn(
                "p-2.5 md:p-3 rounded-xl transition-all duration-300 flex items-center justify-center min-w-[44px] md:min-w-[48px]",
                input.trim() && !isLoading
                  ? "bg-emerald-500 text-black hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)] active:scale-90"
                  : "bg-white/5 text-white/10 cursor-not-allowed"
              )}
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Send size={18} />
              )}
            </button>
          </div>
        </div>
      </form>
      <div className="mt-3 flex items-center justify-center gap-4 text-[9px] md:text-[10px] uppercase tracking-[0.2em] text-white/20 font-bold">
        <span className="flex items-center gap-1"><Sparkles size={10} className="text-emerald-500" /> AI Powered</span>
        <span className="flex items-center gap-1"><Zap size={10} className="text-cyan-500" /> Instant Build</span>
      </div>
    </div>
  );
};
