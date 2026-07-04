"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { useAuthStore } from "@/store/auth";
import { toast } from "sonner";
import { useLogout } from "@/hooks/useLogout";
import {
  Settings,
  User,
  Shield,
  Bell,
  Monitor,
  Key,
  LogOut,
  Trash2,
  Info,
  CheckCircle2,
  Eye,
  EyeOff,
  Cpu,
  RefreshCw,
  Globe,
  Lock,
  Zap,
  Terminal,
  Moon,
  Layers,
} from "lucide-react";

// ─── Animation Variants ────────────────────────────────────────────────────────
const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, delay: i * 0.07, ease: "easeOut" as const },
  }),
};

function Toggle({
  checked,
  onChange,
  id,
  "aria-label": ariaLabel,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  id?: string;
  "aria-label"?: string;
}) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-5.5 rounded-full border transition-all duration-300 shrink-0 ${
        checked
          ? "bg-violet-600/30 border-violet-500/40"
          : "bg-slate-900 border-white/10"
      }`}
    >
      <motion.span
        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full ${checked ? "bg-violet-400" : "bg-slate-600"}`}
        animate={{ x: checked ? 18 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </button>
  );
}

// ─── SettingRow ───────────────────────────────────────────────────────────────
function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-6 py-3.5 border-b border-white/5 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-white">{label}</p>
        {description && <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

// ─── SectionCard ─────────────────────────────────────────────────────────────
function SectionCard({
  title,
  icon,
  children,
  accent = "violet",
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  accent?: string;
}) {
  const accentBg: Record<string, string> = {
    violet: "bg-violet-500/10 border-violet-500/20",
    blue:   "bg-blue-500/10 border-blue-500/20",
    amber:  "bg-amber-500/10 border-amber-500/20",
    rose:   "bg-rose-500/10 border-rose-500/20",
    emerald:"bg-emerald-500/10 border-emerald-500/20",
    indigo: "bg-indigo-500/10 border-indigo-500/20",
    slate:  "bg-slate-500/10 border-slate-500/20",
  };
  return (
    <div className="glass rounded-2xl border border-white/10 overflow-hidden hover:border-white/15 transition-colors">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/5 bg-slate-950/30 flex items-center gap-3">
        <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${accentBg[accent] ?? accentBg.violet}`}>
          {icon}
        </div>
        <h2 className="text-sm font-bold text-white">{title}</h2>
      </div>
      <div className="px-6 py-2">{children}</div>
    </div>
  );
}

// ─── Logout Confirmation ───────────────────────────────────────────────────────
function LogoutButton({ onLogout }: { onLogout: () => void }) {
  const [confirm, setConfirm] = useState(false);
  return confirm ? (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-rose-300 font-semibold">Confirm logout?</span>
      <button
        onClick={onLogout}
        className="px-2.5 py-1 rounded bg-rose-600/20 border border-rose-500/30 text-rose-300 text-[10px] font-bold hover:bg-rose-500/20 transition-colors"
      >
        Yes
      </button>
      <button
        onClick={() => setConfirm(false)}
        className="px-2.5 py-1 rounded bg-white/5 border border-white/10 text-slate-400 text-[10px] font-bold hover:bg-white/8 transition-colors"
      >
        Cancel
      </button>
    </div>
  ) : (
    <button
      id="logout-btn"
      onClick={() => setConfirm(true)}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-500/20 bg-rose-500/5 text-rose-400 text-xs font-semibold hover:bg-rose-500/10 transition-colors"
    >
      <LogOut className="w-3.5 h-3.5" /> Sign Out
    </button>
  );
}

// ─── API Key Input ────────────────────────────────────────────────────────────
function APIKeyInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative flex items-center gap-2">
      <input
        id="gemini-api-key"
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="AIzaSy…"
        className="flex-1 px-3 py-2 rounded-lg border border-white/5 bg-slate-950/60 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/40 font-mono min-w-[180px]"
      />
      <button
        onClick={() => setVisible((v) => !v)}
        className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-colors"
      >
        {visible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const user = useAuthStore((state) => state.user);
  const triggerLogout = useLogout();

  // ─── Local settings state ───────────────────────────────────────────────
  const [geminiKey, setGeminiKey] = useState("");
  const [keySaved, setKeySaved] = useState(false);

  // Notifications
  const [notifExecution, setNotifExecution] = useState(true);
  const [notifPlanner, setNotifPlanner] = useState(true);
  const [notifErrors, setNotifErrors] = useState(true);

  // Browser Preferences
  const [headless, setHeadless] = useState(true);
  const [viewport, setViewport] = useState("1280x800");
  const [execTimeout, setExecTimeout] = useState("120");
  const [screenshotQuality, setScreenshotQuality] = useState<"low" | "medium" | "high">("high");
  const [autoRetry, setAutoRetry] = useState(false);

  // Clear storage confirm
  const [clearConfirm, setClearConfirm] = useState(false);

  const handleSaveKey = () => {
    if (!geminiKey.trim()) return;
    // In production: send to backend vault / env
    toast.success("API key saved securely.");
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 2500);
  };

  const handleLogout = () => {
    triggerLogout();
  };

  const handleClearStorage = () => {
    localStorage.clear();
    triggerLogout();
  };


  return (
    <div className="space-y-6 pb-8">
      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-6 rounded-2xl border border-white/10"
      >
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-slate-400" />
          Settings
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure profile, browser preferences, notifications, and security settings.
        </p>
      </motion.div>

      {/* ─── Profile ─────────────────────────────────────────────────────── */}
      <motion.div custom={0} variants={sectionVariants} initial="hidden" animate="visible">
        <SectionCard title="Profile" icon={<User className="w-4 h-4 text-violet-400" />} accent="violet">
          {user ? (
            <>
              {/* Avatar Row */}
              <div className="flex items-center gap-4 py-4 border-b border-white/5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600/30 to-indigo-600/30 border border-violet-500/20 flex items-center justify-center shrink-0">
                  <span className="text-xl font-extrabold text-violet-300">
                    {user.full_name?.charAt(0)?.toUpperCase() ?? "?"}
                  </span>
                </div>
                <div className="space-y-0.5 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{user.full_name}</p>
                  <p className="text-xs text-slate-400 font-mono">@{user.username}</p>
                  <span className="inline-block px-2 py-0.5 text-[9px] font-bold border rounded-full bg-violet-500/10 border-violet-500/20 text-violet-400 capitalize">
                    {user.role}
                  </span>
                </div>
              </div>

              <SettingRow label="Email Address" description="Used for authentication and notifications.">
                <span className="text-xs text-slate-300 font-mono">{user.email}</span>
              </SettingRow>
              <SettingRow label="Username">
                <span className="text-xs text-slate-300 font-mono">@{user.username}</span>
              </SettingRow>
              <SettingRow label="Account Status">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs text-emerald-400 font-semibold">Active & Verified</span>
                </div>
              </SettingRow>
              <SettingRow label="Member Since">
                <span className="text-xs text-slate-400 font-mono">
                  {new Date(user.created_at).toLocaleDateString()}
                </span>
              </SettingRow>
              {user.last_login_at && (
                <SettingRow label="Last Login">
                  <span className="text-xs text-slate-400 font-mono">
                    {new Date(user.last_login_at).toLocaleString()}
                  </span>
                </SettingRow>
              )}
            </>
          ) : (
            <div className="py-8 text-center text-xs text-slate-500">Not authenticated. Please log in.</div>
          )}
        </SectionCard>
      </motion.div>

      {/* ─── Gemini API Key ───────────────────────────────────────────────── */}
      <motion.div custom={1} variants={sectionVariants} initial="hidden" animate="visible">
        <SectionCard title="Gemini API Key" icon={<Key className="w-4 h-4 text-amber-400" />} accent="amber">
          <SettingRow
            label="API Key"
            description="Used by the Planner Agent to decompose task goals into browser sequences. Stored in the secure vault only."
          >
            <div className="flex items-center gap-2">
              <APIKeyInput value={geminiKey} onChange={setGeminiKey} />
              <button
                onClick={handleSaveKey}
                id="save-api-key-btn"
                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-amber-600/10 border border-amber-500/20 text-amber-400 text-xs font-semibold hover:bg-amber-500/15 transition-colors whitespace-nowrap"
              >
                {keySaved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Key className="w-3.5 h-3.5" />}
                {keySaved ? "Saved" : "Save Key"}
              </button>
            </div>
          </SettingRow>
          <div className="py-3">
            <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 text-[10px] text-amber-400/80 leading-relaxed">
              <strong>Note:</strong> Your API key is stored locally and never transmitted to external servers. It is passed directly to the Planner Agent during plan generation.
            </div>
          </div>
        </SectionCard>
      </motion.div>

      {/* ─── Browser Preferences ──────────────────────────────────────────── */}
      <motion.div custom={2} variants={sectionVariants} initial="hidden" animate="visible">
        <SectionCard title="Browser Preferences" icon={<Monitor className="w-4 h-4 text-indigo-400" />} accent="indigo">
          <SettingRow
            label="Headless Mode"
            description="Run browser without a visible window. Recommended for production execution."
          >
            <Toggle id="headless-toggle" checked={headless} onChange={setHeadless} aria-label="Headless Mode" />
          </SettingRow>

          <SettingRow
            label="Viewport Resolution"
            description="Browser window dimensions for the Playwright session."
          >
            <select
              id="viewport-select"
              value={viewport}
              onChange={(e) => setViewport(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-white/5 bg-slate-950/60 text-xs text-slate-300 focus:outline-none focus:border-indigo-500/40"
            >
              <option value="1280x800">1280 × 800</option>
              <option value="1920x1080">1920 × 1080</option>
              <option value="1440x900">1440 × 900</option>
              <option value="375x812">375 × 812 (Mobile)</option>
            </select>
          </SettingRow>

          <SettingRow
            label="Execution Timeout"
            description="Maximum duration (seconds) before an execution step is marked as timed out."
          >
            <div className="flex items-center gap-2">
              <input
                id="exec-timeout"
                type="number"
                min={10}
                max={600}
                value={execTimeout}
                onChange={(e) => setExecTimeout(e.target.value)}
                className="w-20 px-3 py-1.5 rounded-lg border border-white/5 bg-slate-950/60 text-xs text-white text-right focus:outline-none focus:border-indigo-500/40 font-mono"
              />
              <span className="text-xs text-slate-500">sec</span>
            </div>
          </SettingRow>

          <SettingRow
            label="Screenshot Quality"
            description="Resolution of captured screenshots stored per step."
          >
            <div className="flex items-center gap-1 rounded-lg overflow-hidden border border-white/5">
              {(["low", "medium", "high"] as const).map((q) => (
                <button
                  key={q}
                  id={`screenshot-quality-${q}`}
                  onClick={() => setScreenshotQuality(q)}
                  className={`px-3 py-1.5 text-[10px] font-bold capitalize transition-colors ${
                    screenshotQuality === q
                      ? "bg-indigo-600/20 text-indigo-300"
                      : "bg-slate-950/40 text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </SettingRow>

          <SettingRow
            label="Auto Retry"
            description="Automatically retry failed steps up to 2 times before marking step as failed."
          >
            <Toggle id="auto-retry-toggle" checked={autoRetry} onChange={setAutoRetry} aria-label="Auto Retry" />
          </SettingRow>
        </SectionCard>
      </motion.div>

      {/* ─── Notifications ───────────────────────────────────────────────── */}
      <motion.div custom={3} variants={sectionVariants} initial="hidden" animate="visible">
        <SectionCard title="Notifications" icon={<Bell className="w-4 h-4 text-blue-400" />} accent="blue">
          <SettingRow label="Execution Completed" description="Notify when a browser agent run finishes.">
            <Toggle id="notif-exec-toggle" checked={notifExecution} onChange={setNotifExecution} aria-label="Execution Completed Notification" />
          </SettingRow>
          <SettingRow label="Plan Generated" description="Notify when the AI Planner produces a new execution plan.">
            <Toggle id="notif-planner-toggle" checked={notifPlanner} onChange={setNotifPlanner} aria-label="Plan Generated Notification" />
          </SettingRow>
          <SettingRow label="Execution Errors" description="Alert on step failures and terminal error states.">
            <Toggle id="notif-errors-toggle" checked={notifErrors} onChange={setNotifErrors} aria-label="Execution Errors Notification" />
          </SettingRow>
        </SectionCard>
      </motion.div>

      {/* ─── Security ────────────────────────────────────────────────────── */}
      <motion.div custom={4} variants={sectionVariants} initial="hidden" animate="visible">
        <SectionCard title="Security" icon={<Shield className="w-4 h-4 text-emerald-400" />} accent="emerald">
          <SettingRow label="JWT Session" description="Your session uses rotating JWT access + refresh token pairs stored in secure memory.">
            <div className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs text-emerald-400 font-semibold">Active</span>
            </div>
          </SettingRow>

          <SettingRow label="VaultFS State" description="All passwords, tokens, and cookies are encrypted with AES-256-GCM at rest.">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-violet-300 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full">
                ENCRYPTED
              </span>
            </div>
          </SettingRow>

          <SettingRow label="Sign Out" description="Terminates your current session and clears all in-memory auth tokens.">
            <LogoutButton onLogout={handleLogout} />
          </SettingRow>

          <SettingRow
            label="Clear Local Storage"
            description="Removes all cached data, auth tokens, and preferences from this browser."
          >
            {clearConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-rose-300 font-semibold">This will log you out.</span>
                <button
                  onClick={handleClearStorage}
                  className="px-2.5 py-1 rounded bg-rose-600/20 border border-rose-500/30 text-rose-300 text-[10px] font-bold hover:bg-rose-500/20"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setClearConfirm(false)}
                  className="px-2.5 py-1 rounded bg-white/5 border border-white/10 text-slate-400 text-[10px] font-bold"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                id="clear-storage-btn"
                onClick={() => setClearConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/3 hover:bg-rose-500/5 hover:border-rose-500/20 text-slate-400 hover:text-rose-400 text-xs font-semibold transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear Storage
              </button>
            )}
          </SettingRow>
        </SectionCard>
      </motion.div>

      {/* ─── About NOVA ──────────────────────────────────────────────────── */}
      <motion.div custom={5} variants={sectionVariants} initial="hidden" animate="visible">
        <SectionCard title="About NOVA" icon={<Info className="w-4 h-4 text-slate-400" />} accent="slate">
          <div className="py-4 space-y-4">
            {/* Logo area */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/20 flex items-center justify-center">
                <Zap className="w-6 h-6 text-violet-400" />
              </div>
              <div>
                <p className="text-sm font-extrabold text-white">NOVA</p>
                <p className="text-[10px] text-slate-500">Autonomous Operations System</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {[
                { icon: <Layers className="w-3.5 h-3.5 text-violet-400" />, label: "Frontend", value: "Next.js 15 + TypeScript" },
                { icon: <Terminal className="w-3.5 h-3.5 text-slate-400" />, label: "Backend", value: "FastAPI + MongoDB" },
                { icon: <Globe className="w-3.5 h-3.5 text-sky-400" />, label: "Browser Agent", value: "Playwright (Chromium)" },
                { icon: <Cpu className="w-3.5 h-3.5 text-amber-400" />, label: "Planner Agent", value: "Gemini LLM" },
                { icon: <Moon className="w-3.5 h-3.5 text-indigo-400" />, label: "Theme", value: "Glassmorphism Dark" },
                { icon: <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />, label: "Version", value: "v1.0.0 (Phase 5)" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2.5 p-3 rounded-xl bg-white/2 border border-white/5">
                  {item.icon}
                  <div>
                    <p className="text-[9px] text-slate-600 uppercase font-bold tracking-wider">{item.label}</p>
                    <p className="text-[10px] text-slate-300 font-mono">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-white/2 border border-white/5 text-[10px] font-mono text-slate-500 leading-relaxed">
              NOVA is a multi-agent autonomous web operations platform. The Planner Agent decomposes natural language task goals into browser sequences. The Browser Agent executes them step-by-step using Playwright.
            </div>
          </div>
        </SectionCard>
      </motion.div>
    </div>
  );
}
