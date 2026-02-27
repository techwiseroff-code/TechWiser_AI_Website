'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronRight, ChevronLeft, Sparkles, Code2, Github, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnboardingOverlayProps {
  onComplete: () => void;
}

const steps = [
  {
    title: "Welcome to TechWiser",
    description: "Your AI-powered full-stack development assistant. Let's take a quick tour to get you started.",
    icon: <Sparkles size={48} className="text-emerald-400" />,
  },
  {
    title: "Generate Code Instantly",
    description: "Describe what you want to build in the chat, and TechWiser will generate production-ready React code for you.",
    icon: <Code2 size={48} className="text-cyan-400" />,
  },
  {
    title: "GitHub Integration",
    description: "Connect your GitHub account to push your generated projects directly to a repository with one click.",
    icon: <Github size={48} className="text-white" />,
  },
  {
    title: "Customize Your Experience",
    description: "Use your own API keys, select different AI models, and configure the workspace in Settings.",
    icon: <Settings size={48} className="text-purple-400" />,
  },
];

export const OnboardingOverlay: React.FC<OnboardingOverlayProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has seen onboarding
    const hasSeen = localStorage.getItem('techwiser_onboarding_seen');
    if (!hasSeen) {
      // Use setTimeout to avoid synchronous state update warning
      const timer = setTimeout(() => setIsVisible(true), 0);
      return () => clearTimeout(timer);
    } else {
      onComplete();
    }
  }, [onComplete]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('techwiser_onboarding_seen', 'true');
    setIsVisible(false);
    setTimeout(onComplete, 500);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div 
        key={currentStep}
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -20 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-lg glass-panel rounded-3xl border border-white/10 shadow-2xl overflow-hidden bg-[#0d1117] p-8 relative"
      >
        <button 
          onClick={handleComplete}
          className="absolute right-6 top-6 text-white/30 hover:text-white transition-colors text-sm font-medium"
        >
          Skip
        </button>

        <div className="flex flex-col items-center text-center space-y-6 mt-8">
          <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center border border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.05)]">
            {steps[currentStep].icon}
          </div>
          
          <div className="space-y-3">
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
              {steps[currentStep].title}
            </h2>
            <p className="text-white/60 leading-relaxed">
              {steps[currentStep].description}
            </p>
          </div>

          <div className="flex items-center gap-2 mt-8">
            {steps.map((_, i) => (
              <div 
                key={i} 
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i === currentStep ? "w-8 bg-emerald-500" : "w-1.5 bg-white/10"
                )}
              />
            ))}
          </div>

          <div className="flex items-center justify-between w-full pt-8 border-t border-white/5">
            <button 
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="px-4 py-2 text-white/40 hover:text-white disabled:opacity-0 transition-colors flex items-center gap-2 font-medium"
            >
              <ChevronLeft size={18} /> Back
            </button>
            
            <button 
              onClick={handleNext}
              className="px-6 py-2.5 bg-emerald-500 text-black font-bold rounded-xl hover:bg-emerald-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] flex items-center gap-2"
            >
              {currentStep === steps.length - 1 ? "Get Started" : "Next"}
              {currentStep !== steps.length - 1 && <ChevronRight size={18} />}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
