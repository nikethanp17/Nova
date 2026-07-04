"use client";

import { motion } from "framer-motion";
import { GitBranch, Globe, Lock, ShieldCheck, CheckSquare, Zap } from "lucide-react";

const features = [
  {
    icon: GitBranch,
    iconColor: "text-violet-400",
    iconBg: "bg-violet-500/10 border-violet-500/20",
    title: "Task Decomposition",
    description:
      "NOVA converts complex goals into step-by-step ExecutionPlans with estimated steps and durations prior to launching.",
  },
  {
    icon: Globe,
    iconColor: "text-blue-400",
    iconBg: "bg-blue-500/10 border-blue-500/20",
    title: "Browser Automation",
    description:
      "Programmatically executes playbooks: navigating sites, filling inputs, clicking buttons, and handling transitions automatically.",
  },
  {
    icon: Lock,
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-500/10 border-emerald-500/20",
    title: "Secure Vault Secrets",
    description:
      "Credentials, sensitive cookies, and access tokens are fully isolated and encrypted in a secure Vault using AES-256-GCM.",
  },
  {
    icon: ShieldCheck,
    iconColor: "text-amber-400",
    iconBg: "bg-amber-500/10 border-amber-500/20",
    title: "Execution Validator",
    description:
      "Visual verification reports check if pages match expectations, detecting CAPTCHAs, error states, and handling retries.",
  },
  {
    icon: CheckSquare,
    iconColor: "text-rose-400",
    iconBg: "bg-rose-500/10 border-rose-500/20",
    title: "State Transition Safety",
    description:
      "Rigid task status validation prevents unsafe execution jumps, reverting task states gracefully upon failures.",
  },
  {
    icon: Zap,
    iconColor: "text-cyan-400",
    iconBg: "bg-cyan-500/10 border-cyan-500/20",
    title: "Real-time Live Monitor",
    description:
      "Keep track of active execution runs, terminal commands, and browser progress logs instantly via the dashboard.",
  },
];

export default function LandingFeatures() {
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring" as const, stiffness: 80, damping: 15 },
    },
  };

  return (
    <section id="features" className="py-24 relative overflow-hidden bg-slate-950/20 border-t border-b border-white/5">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(139,92,246,0.03),transparent_60%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 flex flex-col gap-4">
          <span className="text-xs font-bold uppercase tracking-widest text-violet-400">
            System Features
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Designed for Autonomous Web Operations
          </h2>
          <p className="text-slate-400 leading-relaxed text-sm sm:text-base">
            Deconstruct complex operations into verified executions, backed by state-machine security and encryption layers.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              variants={cardVariants}
              className="glass p-6 rounded-xl hover:border-violet-500/30 group transition-all duration-300 relative overflow-hidden flex flex-col gap-4"
            >
              {/* Hover highlight background */}
              <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 to-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Icon */}
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${feature.iconBg} ${feature.iconColor} shrink-0`}>
                <feature.icon className="w-5 h-5" />
              </div>

              {/* Text */}
              <div className="flex flex-col gap-2 relative z-10">
                <h3 className="text-base font-bold text-white group-hover:text-violet-300 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
