"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AlertCircle, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";

// Dynamically import scanner to avoid SSR canvas/navigator issues
const Scanner = dynamic(
  () => import("@yudiel/react-qr-scanner").then((mod) => mod.Scanner),
  { ssr: false }
);

export default function StaffScanPage() {
  const router = useRouter();
  const [manualId, setManualId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(true);

  const handleScan = (detectedCodes: any) => {
    if (detectedCodes && detectedCodes.length > 0) {
      const rawValue = detectedCodes[0].rawValue;
      if (rawValue) {
        setScanning(false);
        router.push(`/staff/checkin/${encodeURIComponent(rawValue.trim())}`);
      }
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualId.trim()) {
      setError("Please enter a valid User ID.");
      return;
    }
    router.push(`/staff/checkin/${encodeURIComponent(manualId.trim())}`);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between py-6 px-4">
      <div className="max-w-md w-full mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/staff/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
          <span className="text-xs font-bold uppercase tracking-wider text-gymRed">QR Scanner</span>
        </div>

        {/* Camera Viewport Card */}
        <div className="gym-card rounded-2xl p-4 sm:p-6 shadow-2xl border-surface-border text-center space-y-4">
          <div>
            <h1 className="text-lg font-black uppercase text-white">SCAN PARTICIPANT PASS</h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Position the participant&apos;s QR code within the frame below.
            </p>
          </div>

          <div className="relative rounded-2xl overflow-hidden bg-black aspect-square max-w-xs mx-auto border-2 border-gymRed/60 shadow-red-glow">
            {scanning ? (
              <Scanner
                onScan={handleScan}
                onError={(err: any) => {
                  console.error("Camera error:", err);
                  setError(
                    err?.message ||
                      "Camera access denied or unavailable. Ensure you are on HTTPS and camera permission is allowed."
                  );
                }}
                constraints={{
                  facingMode: "environment",
                }}
                components={{
                  torch: true,
                  finder: true,
                }}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 text-xs">
                <Loader2 className="w-8 h-8 animate-spin text-gymRed mb-2" />
                <span>Redirecting to check-in...</span>
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-950/50 border border-gymRed/40 text-red-200 text-xs flex items-center gap-2 text-left">
              <AlertCircle className="w-4 h-4 text-gymRed shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Manual Entry Fallback */}
          <div className="pt-2 border-t border-zinc-800 text-left">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-2">
              OR ENTER USER ID MANUALLY:
            </span>
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input
                type="text"
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
                placeholder="Paste or type User ID..."
                className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-gymRed"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-gymRed hover:bg-gymRed-hover text-white text-xs font-bold uppercase tracking-wider transition-colors"
              >
                Go
              </button>
            </form>
          </div>
        </div>
      </div>

      <footer className="text-center text-[11px] text-zinc-400">
        Gym Floor Scanner · Works with all branch passes
      </footer>
    </div>
  );
}
