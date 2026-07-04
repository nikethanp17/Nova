"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Shield, Terminal, ArrowRight, Activity, Eye } from "lucide-react";

export default function LandingHero() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100 } },
  };

  return (
    <section className="relative min-h-screen pt-32 pb-24 overflow-hidden flex flex-col items-center justify-center">
      {/* Background radial blobs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-radial-glow opacity-60 pointer-events-none z-0" />
      <div className="absolute top-1/2 right-10 w-[300px] h-[300px] bg-radial-blue opacity-40 pointer-events-none z-0 animate-pulse-slow" />

      <div className="max-w-7xl mx-auto px-6 relative z-10 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left text panel */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="lg:col-span-6 flex flex-col gap-8 text-center lg:text-left"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center self-center lg:self-start gap-2 px-3 py-1 rounded-full border border-violet-500/20 bg-violet-500/5 text-violet-300 text-xs font-semibold tracking-wide">
            <Activity className="w-3.5 h-3.5 animate-pulse text-violet-400" />
            NOVA Core V1 Active Launch
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight"
          >
            Automate Web Tasks with{" "}
            <span className="text-gradient-purple block mt-1">
              Multi-Agent AI
            </span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-base sm:text-lg text-slate-400 max-w-xl mx-auto lg:mx-0 leading-relaxed"
          >
            NOVA is a personal operations system that decomposes tasks, generates structured execution plans, and automates browsers securely without server-side leaks.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
          >
            <Link
              href="/register"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold tracking-wide shadow-lg shadow-violet-500/25 hover:shadow-violet-500/35 transition-all group"
            >
              Start Planning
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="#workflow"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg border border-white/10 hover:border-white/20 bg-white/3 hover:bg-white/6 text-white font-semibold transition-all"
            >
              See Workflow
            </Link>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="flex items-center justify-center lg:justify-start gap-8 pt-4 border-t border-white/5 mt-4"
          >
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Shield className="w-4 h-4 text-violet-400" />
              Vault-Secured Secrets
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Terminal className="w-4 h-4 text-indigo-400" />
              State-Machine Safety
            </div>
          </motion.div>
        </motion.div>

        {/* Right dashboard mock-up */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 50, delay: 0.4 }}
          className="lg:col-span-6 w-full max-w-2xl mx-auto"
        >
          <div className="glass rounded-xl shadow-2xl shadow-black/80 overflow-hidden relative border border-white/10">
            {/* Header controls */}
            <div className="px-4 py-3 bg-slate-950/70 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
                <span className="text-[11px] text-slate-500 font-mono ml-2">
                  nova-executor://run_id_382
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-[10px] text-green-400 font-semibold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Executing
              </div>
            </div>

            {/* Content areas */}
            <div className="grid grid-cols-1 md:grid-cols-5 h-[340px] text-xs">
              {/* Decomposed Plan list */}
              <div className="md:col-span-2 border-r border-white/5 bg-slate-950/20 p-4 flex flex-col gap-3">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest block mb-1">
                  Active Playbook
                </span>
                
                {/* Steps */}
                <div className="flex gap-2.5 items-start">
                  <div className="w-5 h-5 rounded-full bg-green-500/20 text-green-400 border border-green-500/40 flex items-center justify-center font-bold text-[10px] shrink-0">
                    ✓
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold text-slate-200">Load Form Page</span>
                    <span className="text-[10px] text-slate-500">navigate: google.com</span>
                  </div>
                </div>

                <div className="flex gap-2.5 items-start">
                  <div className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 border border-violet-500/40 flex items-center justify-center font-bold text-[10px] shrink-0 animate-pulse">
                    2
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold text-white">Fill Form Inputs</span>
                    <span className="text-[10px] text-slate-400">fill: input[type=&quot;text&quot;]</span>
                  </div>
                </div>

                <div className="flex gap-2.5 items-start opacity-50">
                  <div className="w-5 h-5 rounded-full bg-white/5 text-slate-400 border border-white/10 flex items-center justify-center font-bold text-[10px] shrink-0">
                    3
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold text-slate-350">Confirm Verification</span>
                    <span className="text-[10px] text-slate-500">validate: result_body</span>
                  </div>
                </div>
              </div>

              {/* Browser Preview Panel */}
              <div className="md:col-span-3 p-4 bg-slate-950/40 flex flex-col gap-3 relative">
                <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-500 tracking-widest">
                  <span>Visual Monitor</span>
                  <span className="text-violet-400 flex items-center gap-1">
                    <Eye className="w-3 h-3" /> Live Capture
                  </span>
                </div>
                
                {/* Browser window representation */}
                <div className="w-full flex-1 rounded bg-slate-900 border border-white/5 overflow-hidden flex flex-col relative shadow-inner">
                  {/* Mock browser address bar */}
                  <div className="bg-slate-950/60 px-2 py-1.5 border-b border-white/5 flex items-center gap-1.5 text-[9px] text-slate-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                    <span>https://careers.google.com/jobs/results</span>
                  </div>
                  {/* Mock content rendering */}
                  <div className="p-3 flex flex-col gap-2 relative z-10">
                    <div className="h-3 w-1/3 rounded bg-slate-800" />
                    <div className="h-6 w-3/4 rounded bg-slate-800/40 border border-white/5 p-1 flex items-center">
                      <span className="w-2 h-3.5 bg-violet-400 rounded animate-pulse" />
                    </div>
                    <div className="h-3.5 w-1/2 rounded bg-slate-800" />
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <div className="h-8 rounded bg-slate-800/20 border border-white/5" />
                      <div className="h-8 rounded bg-slate-800/20 border border-white/5" />
                    </div>
                  </div>
                  {/* Glowing cursor mock */}
                  <div className="absolute top-1/2 left-2/3 w-3 h-3 rounded-full bg-violet-500 shadow-[0_0_12px_#8b5cf6] animate-float shrink-0" />
                </div>
              </div>
            </div>

            {/* Terminal log section */}
            <div className="px-4 py-3 bg-slate-950/80 border-t border-white/5 font-mono text-[10px] text-slate-455 flex items-center gap-2 text-slate-400">
              <span className="text-violet-400">$</span>
              <span>Decompose action... Success. Invoking secure vault mapping.</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
