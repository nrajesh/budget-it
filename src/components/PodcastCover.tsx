import React from 'react';
import { Wallet, Map, ShieldCheck, Coins } from 'lucide-react';

export const PodcastCover = () => {
  return (
    <div className="w-[1200px] h-[630px] relative bg-slate-900 overflow-hidden flex flex-col items-center justify-center font-sans text-white">
      {/* Background Gradient/Maze Effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black"></div>

      {/* Maze / Crossroads Pattern (Abstract) */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          {/* Random maze walls */}
          <path d="M 100 100 L 100 300 M 300 100 L 500 100" stroke="white" strokeWidth="2" fill="none" />
          <path d="M 800 400 L 800 600 M 600 500 L 900 500" stroke="white" strokeWidth="2" fill="none" />
        </svg>
      </div>

      {/* The Tunnel / Path */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/3 h-2/3 bg-gradient-to-t from-emerald-500/20 to-transparent blur-3xl"></div>

      {/* The Path Line */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <path
          d="M 600 630 C 600 500, 400 400, 600 250"
          stroke="url(#pathGradient)"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="pathGradient" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>
        </defs>
      </svg>

      {/* The Pot of Gold / Light at the end */}
      <div className="absolute top-[220px] left-1/2 transform -translate-x-1/2">
        <div className="relative">
          <div className="absolute inset-0 bg-yellow-400 blur-[60px] opacity-60 w-32 h-32 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <Coins className="w-24 h-24 text-yellow-400 relative z-10 drop-shadow-[0_0_15px_rgba(251,191,36,0.8)]" />
        </div>
      </div>

      {/* Main Character / User at the start */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
        <div className="bg-emerald-500 p-4 rounded-full shadow-[0_0_30px_rgba(16,185,129,0.5)] border-2 border-emerald-300">
          <Map className="w-10 h-10 text-white" />
        </div>
        <div className="mt-4 bg-black/50 backdrop-blur-md px-4 py-2 rounded-full border border-emerald-500/30">
          <span className="text-emerald-300 font-semibold tracking-wide text-sm uppercase">You are here</span>
        </div>
      </div>

      {/* Title Section */}
      <div className="absolute top-12 left-0 right-0 text-center z-20">
        <h1 className="text-6xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-200 to-yellow-200 drop-shadow-sm">
          BUDGET IT!
        </h1>
        <div className="flex items-center justify-center gap-2 mt-4">
          <div className="h-[1px] w-12 bg-slate-500"></div>
          <p className="text-xl text-slate-300 font-light tracking-[0.2em] uppercase">The Podcast</p>
          <div className="h-[1px] w-12 bg-slate-500"></div>
        </div>
      </div>

      {/* Subtitle / Tagline */}
      <div className="absolute top-40 left-0 right-0 text-center z-20">
        <p className="text-2xl font-medium text-white drop-shadow-md">
          Clarity, Control, & <span className="text-emerald-300 font-bold">Peace of Mind</span>
        </p>
      </div>

      {/* Feature Icons (Floating) */}
      <div className="absolute left-20 top-1/2 transform -translate-y-1/2 flex flex-col gap-8 opacity-40">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-slate-400" />
          <span className="text-slate-400 text-sm font-mono">Local-First Privacy</span>
        </div>
        <div className="flex items-center gap-3">
          <Wallet className="w-8 h-8 text-slate-400" />
          <span className="text-slate-400 text-sm font-mono">Multi-Currency</span>
        </div>
      </div>

      <div className="absolute right-20 top-1/2 transform -translate-y-1/2 flex flex-col gap-8 opacity-40 text-right">
        <div className="flex items-center justify-end gap-3">
          <span className="text-slate-400 text-sm font-mono">Monthly Normalization</span>
          <div className="w-8 h-8 border border-slate-400 rounded flex items-center justify-center">
            <span className="text-xs">Avg</span>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3">
          <span className="text-slate-400 text-sm font-mono">Data Analytics</span>
           <div className="w-8 h-8 border border-slate-400 rounded flex items-center justify-end items-end p-1 gap-0.5">
            <div className="w-1 h-2 bg-slate-400"></div>
            <div className="w-1 h-4 bg-slate-400"></div>
            <div className="w-1 h-3 bg-slate-400"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PodcastCover;
