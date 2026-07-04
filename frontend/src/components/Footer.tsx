import Link from "next/link";
import { Cpu } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-slate-950/40 py-12">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <Cpu className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              NOVA
            </span>
          </div>
          <p className="text-sm text-slate-450 max-w-xs leading-relaxed text-slate-400">
            Autonomous operations system powered by multi-agent planning frameworks and secure vault infrastructure.
          </p>
        </div>

        {/* Product Links */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Product
          </span>
          <Link href="#features" className="text-sm text-slate-450 hover:text-white transition-colors text-slate-450">
            Features
          </Link>
          <Link href="#workflow" className="text-sm text-slate-450 hover:text-white transition-colors text-slate-450">
            Workflow
          </Link>
          <Link href="#security" className="text-sm text-slate-450 hover:text-white transition-colors text-slate-450">
            Security
          </Link>
        </div>

        {/* System Status Links */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Resources
          </span>
          <Link href="/docs" className="text-sm text-slate-450 hover:text-white transition-colors text-slate-450">
            Documentation
          </Link>
          <Link href="/api-reference" className="text-sm text-slate-450 hover:text-white transition-colors text-slate-450">
            API Reference
          </Link>
        </div>

        {/* Security Info */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Vault Secure
          </span>
          <p className="text-xs text-slate-450 leading-relaxed text-slate-400">
            All user credentials, cookies, and tokens are stored in the secure Vault, fully encrypted at rest using AES-256-GCM.
          </p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
        <span>© {new Date().getFullYear()} NOVA. All rights reserved.</span>
        <span>Version 1.0.0 (Production Build)</span>
      </div>
    </footer>
  );
}
