'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Zap, Globe, Code2, ArrowRight, Play, Layout, Cpu } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface LandingPageProps {
  onStart: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  const { t } = useLanguage();

  return (
    <div className="min-h-full flex flex-col items-center justify-center px-4 py-16 md:py-24 overflow-y-auto selection:bg-emerald-500/30">
      {/* Hero Section */}
      <div className="max-w-5xl w-full text-center space-y-10 md:space-y-16 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="space-y-8"
        >
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] md:text-xs font-black uppercase tracking-[0.3em] shadow-[0_0_30px_rgba(16,185,129,0.1)] cursor-default"
          >
            <Sparkles size={14} className="animate-pulse" />
            The Future of App Building
          </motion.div>
          
          <h1 className="text-5xl md:text-9xl font-display font-bold tracking-tighter leading-[0.85] md:leading-[0.8]">
            Build your <br />
            <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(52,211,153,0.3)]">
              dream app
            </span> <br />
            with AI.
          </h1>
          
          <p className="text-white/40 text-base md:text-2xl max-w-2xl mx-auto font-medium leading-relaxed tracking-tight">
            TechWiser turns your ideas into production-ready React applications in seconds. No code required. Multi-language support included.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6 pt-6">
            <motion.button 
              onClick={onStart}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full sm:w-auto px-10 py-5 bg-emerald-500 text-black font-black uppercase tracking-widest text-xs rounded-2xl flex items-center justify-center gap-3 hover:bg-emerald-400 transition-colors shadow-[0_0_40px_rgba(16,185,129,0.4)] group"
            >
              Start Building Free
              <ArrowRight size={20} className="group-hover:translate-x-1.5 transition-transform duration-300" />
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full sm:w-auto px-10 py-5 bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest text-xs rounded-2xl flex items-center justify-center gap-3 hover:bg-white/10 transition-colors backdrop-blur-md"
            >
              <Play size={18} className="fill-current text-emerald-400" />
              Watch Demo
            </motion.button>
          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1,
                delayChildren: 0.3
              }
            }
          }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 pt-16"
        >
          {[
            { icon: <Zap className="text-yellow-400" />, title: "Instant Build", desc: "From prompt to app in under 30 seconds." },
            { icon: <Globe className="text-blue-400" />, title: "Multi-Language", desc: "Build in English, Hindi, or Marathi." },
            { icon: <Cpu className="text-purple-400" />, title: "AI Architect", desc: "Powered by Gemini 3.1 Pro reasoning." },
            { icon: <Layout className="text-emerald-400" />, title: "Responsive", desc: "Mobile-first designs by default." }
          ].map((feature, i) => (
            <motion.div 
              key={i} 
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50 } }
              }}
              whileHover={{ y: -5, borderColor: "rgba(16, 185, 129, 0.2)" }}
              className="glass-panel p-8 rounded-[2rem] border-white/5 transition-colors duration-300 group text-left space-y-4 hover:bg-white/[0.02]"
            >
              <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-500/10 transition-all duration-500">
                {feature.icon}
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-xl tracking-tight">{feature.title}</h3>
                <p className="text-sm text-white/30 leading-relaxed font-medium">{feature.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};
