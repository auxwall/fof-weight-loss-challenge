"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, X, ExternalLink, Check, AlertCircle } from "lucide-react";

interface RegisterCtaModalProps {
  buttonText?: string;
  className?: string;
}

export default function RegisterCtaModal({
  buttonText = "Register Now",
  className,
}: RegisterCtaModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [hasAttempted, setHasAttempted] = useState(false);

  const instagramUrl = "https://www.instagram.com/faceoff.fitness?stkn=NTB3bG9rZmw3Zmhv";

  const handleOpen = () => {
    setIsOpen(true);
    setHasAttempted(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    setHasAttempted(false);
  };

  const handleProceed = () => {
    if (!isConfirmed) {
      setHasAttempted(true);
      return;
    }

    // handleClose();
    router.push("/register");
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleOpen}
        className={
          className ||
          "w-full py-4 px-6 rounded-xl bg-gymRed hover:bg-gymRed-hover text-white font-bold text-base tracking-wide uppercase transition-all shadow-red-glow flex items-center justify-center gap-2 group cursor-pointer"
        }
      >
        <span>{buttonText}</span>
        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </button>

      {/* Modal Backdrop & Dialog */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
        >
          <div className="relative w-full max-w-lg rounded-3xl bg-zinc-950 border border-zinc-800 shadow-2xl p-6 sm:p-7 overflow-hidden text-left animate-in zoom-in-95 duration-200">
            {/* Top Instagram to GymRed Gradient Bar */}
            <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-rose-500 via-purple-600 to-gymRed absolute top-0 left-0" />

            {/* Ambient Background Glow */}
            <div className="w-56 h-56 bg-rose-600/10 rounded-full blur-3xl absolute -top-10 -right-10 pointer-events-none" />

            {/* Close Button */}
            <button
              type="button"
              onClick={handleClose}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1.5 rounded-full hover:bg-zinc-800/80 transition-colors z-10"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-start gap-4 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center shadow-lg shadow-pink-500/20 shrink-0">
                <svg className="w-6 h-6 text-white fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </div>

              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-[10px] font-bold uppercase tracking-wider text-rose-400 mb-1">
                  Required Step
                </div>
                <h3 className="text-lg sm:text-xl font-black uppercase text-white tracking-tight leading-tight">
                  Instagram Verification
                </h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  To validate your entry for the <strong className="text-white">AED 18,000</strong> prize pool, please make sure you complete these 2 steps on Instagram:
                </p>
              </div>
            </div>

            {/* Checklist Cards */}
            <div className="space-y-2.5 mb-5">
              {/* Step 1 */}
              <div className="p-3.5 rounded-2xl bg-zinc-900/70 border border-zinc-800 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-rose-500/40">
                  1
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span>Follow @faceoff.fitness</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Follow our official Instagram page to stay updated on challenge announcements & leaderboards.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-3.5 rounded-2xl bg-zinc-900/70 border border-zinc-800 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-rose-500/40">
                  2
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-white">
                    Like &amp; Share the Challenge Post
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Share the official 30-Day Weight Loss Challenge post to your Instagram Story or Feed.
                  </p>
                </div>
              </div>
            </div>

            {/* Direct Linkout to Instagram */}
            <div className="mb-5">
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-950/60 to-purple-950/60 hover:from-rose-900/70 hover:to-purple-900/70 border border-rose-500/40 hover:border-rose-500 text-xs font-semibold text-rose-200 hover:text-white flex items-center justify-center gap-2 transition-all group shadow-sm"
              >
                <svg className="w-4 h-4 fill-current text-rose-400 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
                <span>Open @faceoff.fitness on Instagram</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>
            </div>

            {/* Confirmation Agreement Card */}
            <div
              onClick={() => {
                setIsConfirmed(!isConfirmed);
                setHasAttempted(false);
              }}
              className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer select-none mb-5 ${isConfirmed
                  ? "bg-rose-950/20 border-rose-500/60 shadow-sm"
                  : hasAttempted
                    ? "bg-red-950/30 border-gymRed animate-shake"
                    : "bg-zinc-900/90 border-zinc-800 hover:border-zinc-700"
                }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${isConfirmed
                      ? "bg-gymRed border-gymRed text-white"
                      : hasAttempted
                        ? "border-gymRed bg-zinc-950"
                        : "border-zinc-700 bg-zinc-950"
                    }`}
                >
                  {isConfirmed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
                <div className="flex-1">
                  <div className="text-xs sm:text-[13px] font-semibold text-white leading-snug">
                    I confirm that I have followed <span className="text-rose-400">@faceoff.fitness</span> and shared the official challenge post.
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1 leading-normal">
                    Staff will verify your Instagram follow during your Day-1 weigh-in at the club.
                  </p>
                </div>
              </div>
            </div>

            {/* Error prompt if attempted without checking */}
            {hasAttempted && !isConfirmed && (
              <div className="mb-4 p-2.5 rounded-xl bg-red-950/50 border border-gymRed/40 text-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-gymRed shrink-0" />
                <span>Please check the confirmation box above to proceed.</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleClose}
                className="py-3 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProceed}
                className={`flex-1 py-3 px-5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 group ${isConfirmed
                    ? "bg-gymRed hover:bg-gymRed-hover text-white shadow-red-glow cursor-pointer"
                    : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer"
                  }`}
              >
                <span>Confirm &amp; Proceed to Registration</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
