/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from "motion/react";
import { 
  Play, 
  Video, 
  Sparkles, 
  History, 
  Settings, 
  ChevronRight, 
  Loader2, 
  AlertCircle,
  Trophy,
  MapPin,
  Clock,
  Download,
  Key
} from 'lucide-react';

// Types for Veo
interface VideoOperation {
  name: string;
  done: boolean;
  response?: {
    generatedVideos?: Array<{
      video: {
        uri: string;
      };
    }>;
  };
}

const LORDS_PRESETS = [
  {
    id: 'cover-drive',
    title: 'Classic Cover Drive',
    description: 'A perfect cover drive through the covers at Lord\'s.',
    prompt: 'A cinematic slow-motion shot of a batsman playing a classic cover drive at Lord\'s Cricket Ground. The iconic red-brick pavilion is in the background. Golden hour lighting, 4k resolution, professional sports broadcast style.',
    image: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'fast-bowler',
    title: 'The Pavilion End',
    description: 'A fast bowler charging in from the Pavilion End.',
    prompt: 'A fast bowler charging in to bowl from the Pavilion End at Lord\'s. The camera follows the bowler in a dynamic tracking shot. The crowd is blurred in the background. High intensity, cinematic lighting, 1080p.',
    image: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'stumping',
    title: 'Lightning Stumping',
    description: 'A wicket-keeper executing a lightning-fast stumping.',
    prompt: 'A close-up cinematic shot of a wicket-keeper catching the ball and whipping the bails off for a stumping at Lord\'s. Dust flies from the pitch. Intense focus, slow motion, crisp details.',
    image: 'https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?auto=format&fit=crop&q=80&w=800'
  }
];

export default function App() {
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<Array<{url: string, prompt: string, date: string}>>([]);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');

  useEffect(() => {
    checkApiKey();
  }, []);

  const checkApiKey = async () => {
    // @ts-ignore - window.aistudio is injected by the platform
    if (window.aistudio) {
      // @ts-ignore
      const hasKey = await window.aistudio.hasSelectedApiKey();
      setHasApiKey(hasKey);
    } else {
      // Fallback for local development if needed, though process.env.GEMINI_API_KEY is usually set
      setHasApiKey(!!process.env.GEMINI_API_KEY);
    }
  };

  const handleOpenSelectKey = async () => {
    // @ts-ignore
    if (window.aistudio) {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      setHasApiKey(true); // Assume success as per instructions
    }
  };

  const generateVideo = async (customPrompt?: string) => {
    const finalPrompt = customPrompt || prompt;
    if (!finalPrompt) return;

    setIsGenerating(true);
    setError(null);
    setVideoUrl(null);
    setStatus('Initializing AI model...');

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error('API Key not found');

      const ai = new GoogleGenAI({ apiKey });
      
      setStatus('Crafting your cinematic moment...');
      
      // Using the model requested by the user in the feature block
      // @ts-ignore - generateVideos is a valid method on models
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: finalPrompt,
        config: {
          numberOfVideos: 1,
          resolution: '1080p',
          aspectRatio: aspectRatio
        }
      });

      const loadingMessages = [
        'Preparing the pitch at Lord\'s...',
        'Simulating the crowd atmosphere...',
        'Rendering the iconic Pavilion...',
        'Capturing the perfect delivery...',
        'Polishing the cinematic frames...',
        'Finalizing the highlight reel...'
      ];

      let msgIndex = 0;
      const interval = setInterval(() => {
        msgIndex = (msgIndex + 1) % loadingMessages.length;
        setStatus(loadingMessages[msgIndex]);
      }, 8000);

      // Poll for completion
      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        // @ts-ignore
        operation = await ai.operations.getVideosOperation({ operation });
      }

      clearInterval(interval);
      setStatus('Video ready!');

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (!downloadLink) throw new Error('Failed to get video download link');

      // Fetch the video with the API key
      const response = await fetch(downloadLink, {
        method: 'GET',
        headers: {
          'x-goog-api-key': apiKey,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          // Reset key selection if entity not found as per instructions
          setHasApiKey(false);
          throw new Error('Requested entity not found. Please re-select your API key.');
        }
        throw new Error('Failed to download video');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setVideoUrl(url);
      setHistory(prev => [{ url, prompt: finalPrompt, date: new Date().toLocaleTimeString() }, ...prev]);

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  if (hasApiKey === false) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-sans text-slate-200">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl"
        >
          <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Key className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold mb-4 tracking-tight">API Key Required</h1>
          <p className="text-slate-400 mb-8 leading-relaxed">
            To generate high-quality videos of Lord's, you need to select a paid Gemini API key. 
            Check the <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-emerald-400 hover:underline">billing documentation</a> for more info.
          </p>
          <button
            onClick={handleOpenSelectKey}
            className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            Select API Key
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-emerald-500/30">
      {/* Background Decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Trophy className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Lord's Cricket AI</h1>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                <MapPin className="w-3 h-3" />
                London, UK
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setHasApiKey(false)}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400"
              title="Change API Key"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 grid lg:grid-cols-12 gap-12">
        {/* Left Column: Controls */}
        <div className="lg:col-span-5 space-y-8">
          <section>
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Create New Moment
            </h2>
            
            <div className="space-y-6">
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe a cricket action at Lord's... e.g., 'A batsman hitting a massive six over the pavilion'"
                  className="w-full h-40 bg-slate-900 border border-slate-800 rounded-2xl p-5 text-lg resize-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-600"
                />
                <div className="absolute bottom-4 right-4 flex items-center gap-2">
                  <button
                    onClick={() => setAspectRatio('16:9')}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${aspectRatio === '16:9' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                  >
                    16:9
                  </button>
                  <button
                    onClick={() => setAspectRatio('9:16')}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${aspectRatio === '9:16' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                  >
                    9:16
                  </button>
                </div>
              </div>

              <button
                onClick={() => generateVideo()}
                disabled={isGenerating || !prompt}
                className={`w-full py-5 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 shadow-xl ${
                  isGenerating || !prompt 
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20 active:scale-[0.98]'
                }`}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Video className="w-6 h-6" />
                    Generate Highlight
                  </>
                )}
              </button>
            </div>
          </section>

          <section>
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
              <History className="w-4 h-4" />
              Iconic Presets
            </h2>
            <div className="grid gap-4">
              {LORDS_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => {
                    setPrompt(preset.prompt);
                    generateVideo(preset.prompt);
                  }}
                  disabled={isGenerating}
                  className="group relative flex items-center gap-4 p-4 bg-slate-900 border border-slate-800 rounded-2xl hover:border-emerald-500/50 transition-all text-left overflow-hidden"
                >
                  <div className="absolute inset-0 bg-emerald-500/0 group-hover:bg-emerald-500/5 transition-colors" />
                  <img 
                    src={preset.image} 
                    alt={preset.title}
                    className="w-16 h-16 rounded-xl object-cover grayscale group-hover:grayscale-0 transition-all"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-200 group-hover:text-emerald-400 transition-colors">{preset.title}</h3>
                    <p className="text-sm text-slate-500 truncate">{preset.description}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-700 group-hover:text-emerald-500 transition-all group-hover:translate-x-1" />
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Preview */}
        <div className="lg:col-span-7">
          <div className="sticky top-32">
            <div className={`relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl transition-all ${aspectRatio === '9:16' ? 'max-w-[400px] mx-auto aspect-[9/16]' : 'aspect-video'}`}>
              <AnimatePresence mode="wait">
                {isGenerating ? (
                  <motion.div 
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center"
                  >
                    <div className="relative mb-8">
                      <div className="w-24 h-24 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Video className="w-8 h-8 text-emerald-500" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold mb-3 tracking-tight">Generating Video</h3>
                    <p className="text-slate-400 max-w-xs mx-auto animate-pulse">{status}</p>
                  </motion.div>
                ) : videoUrl ? (
                  <motion.div 
                    key="video"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="h-full w-full group"
                  >
                    <video 
                      src={videoUrl} 
                      controls 
                      autoPlay 
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a 
                        href={videoUrl} 
                        download="lords-highlight.mp4"
                        className="p-3 bg-slate-950/80 backdrop-blur-md rounded-xl text-emerald-400 hover:text-white transition-colors flex items-center gap-2 font-bold"
                      >
                        <Download className="w-5 h-5" />
                        Save
                      </a>
                    </div>
                  </motion.div>
                ) : error ? (
                  <motion.div 
                    key="error"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center"
                  >
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                      <AlertCircle className="w-8 h-8 text-red-400" />
                    </div>
                    <h3 className="text-xl font-bold text-red-400 mb-2">Generation Failed</h3>
                    <p className="text-slate-500 text-sm mb-6">{error}</p>
                    <button 
                      onClick={() => generateVideo()}
                      className="px-6 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-bold transition-colors"
                    >
                      Try Again
                    </button>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center"
                  >
                    <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-8">
                      <Play className="w-8 h-8 text-slate-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-400 mb-2">Ready to Play</h3>
                    <p className="text-slate-600 max-w-xs">
                      Enter a prompt or select a preset to generate your cinematic Lord's moment.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* History Feed */}
            {history.length > 0 && (
              <div className="mt-12">
                <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Recent Highlights
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  {history.slice(0, 4).map((item, i) => (
                    <div 
                      key={i}
                      className="group relative aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 cursor-pointer"
                      onClick={() => setVideoUrl(item.url)}
                    >
                      <video src={item.url} className="w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent opacity-60" />
                      <div className="absolute bottom-3 left-3 right-3">
                        <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1">{item.date}</p>
                        <p className="text-xs text-slate-200 font-medium truncate">{item.prompt}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-slate-800/50 text-center">
        <p className="text-slate-600 text-sm">
          Powered by Veo 3.1 & Google Gemini AI • Lord's Cricket Ground Cinematic Generator
        </p>
      </footer>
    </div>
  );
}
