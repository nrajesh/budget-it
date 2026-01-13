import React from 'react';
import { Activity, List, PieChart, BarChart3, Users, Lock, CheckCircle2 } from 'lucide-react';

export const AppFeatureInfographic = () => {
  return (
    <div className="w-[1200px] h-[800px] relative bg-slate-950 overflow-hidden flex flex-col font-sans text-white p-12">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-950 via-slate-950 to-black opacity-80"></div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-20">
        <svg width="100%" height="100%">
          <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="white" strokeWidth="0.5"/>
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Header */}
      <div className="relative z-10 flex flex-col items-center mb-8">
        <h1 className="text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-2">
          BUDGET IT!
        </h1>
        <p className="text-xl text-slate-300 tracking-widest uppercase font-light">
          The Ultimate Personal Finance Tracker
        </p>
      </div>

      {/* Content Grid */}
      <div className="relative z-10 flex-1 grid grid-cols-12 gap-8">

        {/* Left Column Features */}
        <div className="col-span-3 flex flex-col justify-center gap-6">
          <FeatureCard
            icon={<Activity className="text-emerald-400" size={32} />}
            title="Financial Pulse"
            desc="Real-time dashboard overview of your net worth and monthly burn rate."
          />
          <FeatureCard
            icon={<List className="text-blue-400" size={32} />}
            title="Smart Transactions"
            desc="Easy entry and categorization of all your income and expenses."
          />
          <FeatureCard
            icon={<PieChart className="text-purple-400" size={32} />}
            title="Normalized Budgets"
            desc="Convert irregular expenses into smooth monthly targets."
          />
        </div>

        {/* Center Image */}
        <div className="col-span-6 flex items-center justify-center relative">
            <div className="relative rounded-xl overflow-hidden shadow-[0_0_50px_rgba(79,70,229,0.3)] border border-slate-700 bg-slate-900/50 backdrop-blur-sm">
                {/* Image Container */}
                <img
                    src="/dashboard_screenshot.png"
                    alt="App Dashboard"
                    className="w-full h-auto object-cover opacity-95"
                />

                {/* Overlay Highlights (Optional decoration) */}
                <div className="absolute top-0 right-0 p-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full inline-block mr-1"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full inline-block mr-1"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full inline-block"></div>
                </div>
            </div>
        </div>

        {/* Right Column Features */}
        <div className="col-span-3 flex flex-col justify-center gap-6">
           <FeatureCard
            icon={<BarChart3 className="text-orange-400" size={32} />}
            title="Deep Analytics"
            desc="Visualize trends, spending habits, and future projections."
            align="right"
          />
          <FeatureCard
            icon={<Users className="text-pink-400" size={32} />}
            title="Entity Management"
            desc="Manage finances for multiple people or household entities."
            align="right"
          />
           <FeatureCard
            icon={<Lock className="text-teal-400" size={32} />}
            title="Privacy First"
            desc="Local-first architecture. Your data stays on your device."
            align="right"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 mt-auto pt-6 text-center">
         <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700 text-slate-400 text-sm">
            <CheckCircle2 size={16} />
            <span>Open Source</span>
            <span className="mx-2">•</span>
            <span>Self-Hostable</span>
            <span className="mx-2">•</span>
            <span>React & Supabase</span>
         </div>
      </div>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc, align = 'left' }: { icon: React.ReactNode, title: string, desc: string, align?: 'left' | 'right' }) => (
  <div className={`flex flex-col ${align === 'right' ? 'items-end text-right' : 'items-start text-left'} p-4 rounded-lg bg-slate-800/30 border border-slate-700/50 hover:bg-slate-800/50 transition-colors`}>
    <div className="mb-3 p-2 bg-slate-900 rounded-lg shadow-sm border border-slate-700">
      {icon}
    </div>
    <h3 className="text-lg font-bold text-slate-100 mb-1">{title}</h3>
    <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
  </div>
);

export default AppFeatureInfographic;
