'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Key, ExternalLink, X, Loader2, CheckCircle, AlertCircle, CloudLightning } from 'lucide-react';
import { GeneratedFile } from '@/lib/gemini';

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: GeneratedFile[];
}

export const PublishModal: React.FC<PublishModalProps> = ({ isOpen, onClose, files }) => {
  const [token, setToken] = useState('');
  const [inputToken, setInputToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [deployUrl, setDeployUrl] = useState('');

  useEffect(() => {
    const savedToken = localStorage.getItem('techwiser_vercel_token');
    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  const handleDeploy = async () => {
    if (!token && !inputToken) return;
    const finalToken = token || inputToken;
    
    setIsLoading(true);
    setStatus('idle');
    setMessage('');

    try {
      const filesMap: Record<string, string> = {};
      files.forEach((f) => {
        filesMap[f.path] = f.content;
      });

      const response = await fetch('/api/deploy-vercel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: filesMap, token: finalToken }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Deployment failed');
      }

      // Save token if successful and it was new
      if (inputToken && !token) {
        setToken(inputToken);
        localStorage.setItem('techwiser_vercel_token', inputToken);
      }

      setStatus('success');
      setMessage('Successfully published to Vercel!');
      if (data.url) setDeployUrl(data.url);
    } catch (error: any) {
      console.error('Vercel Deploy Error:', error);
      setStatus('error');
      setMessage(error.message || 'Failed to deploy to Vercel');
    } finally {
      setIsLoading(false);
    }
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
            className="relative w-full max-w-md glass-panel rounded-2xl border border-white/10 shadow-2xl overflow-hidden bg-[#0d1117]"
          >
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                    <CloudLightning size={20} className="text-emerald-500" />
                  </div>
                  <h2 className="text-lg font-bold">Publish App</h2>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors">
                  <X size={18} />
                </button>
              </div>

              {status === 'success' ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-4 text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                    <CheckCircle size={32} className="text-emerald-500" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-white">Deployed!</h3>
                    <p className="text-sm text-white/60">Your app is now live on Vercel.</p>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={deployUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-2 bg-emerald-500 text-black font-bold rounded-xl hover:bg-emerald-400 transition-colors flex items-center gap-2 text-sm"
                    >
                      Visit Live Site <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {token ? (
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-white/40">Vercel Account</label>
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                          <CheckCircle size={16} />
                          Token Connected
                        </div>
                        <button
                          onClick={() => {
                            setToken('');
                            setInputToken('');
                            localStorage.removeItem('techwiser_vercel_token');
                          }}
                          className="text-white/40 hover:text-white text-xs transition-colors"
                        >
                          Disconnect
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center justify-center text-center space-y-3">
                        <Key size={32} className="text-white/60" />
                        <div className="space-y-1">
                          <h3 className="text-sm font-bold text-white">Connect Vercel Account</h3>
                          <p className="text-xs text-white/50">Provide a Vercel Access Token to publish apps directly to your Vercel account.</p>
                        </div>
                        <div className="w-full text-left mt-2">
                           <a href="https://vercel.com/account/tokens" target="_blank" className="text-xs text-emerald-400 hover:text-emerald-300 underline">Get your Vercel Token here</a>
                        </div>
                        <input
                          type="password"
                          value={inputToken}
                          onChange={(e) => setInputToken(e.target.value)}
                          placeholder="Paste Vercel Token (e.g. kH12...)"
                          className="w-full bg-black/20 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 transition-colors"
                        />
                      </div>
                    </div>
                  )}

                  {status === 'error' && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2 text-red-400 text-xs">
                      <AlertCircle size={14} className="mt-0.5 shrink-0" />
                      <span>{message}</span>
                    </div>
                  )}

                  <button
                    onClick={handleDeploy}
                    disabled={isLoading || (!token && !inputToken)}
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                  >
                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                    {isLoading ? 'Deploying...' : 'Deploy to Vercel'}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
