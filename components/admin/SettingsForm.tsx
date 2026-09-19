"use client";

import { useState } from "react";
import { formatDubai } from "@/lib/dayjs";
import { Calendar, Clock, Save, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface SettingsFormProps {
  initialSettings: {
    registrationStart: string | null;
    registrationEnd: string | null;
    finalizeDate: string | null;
    rulesText: string | null;
    termsText: string | null;
  };
}

export default function SettingsForm({ initialSettings }: SettingsFormProps) {
  // Format dates for datetime-local input (YYYY-MM-DDTHH:mm)
  const toInputFormat = (isoString: string | null) => {
    if (!isoString) return "";
    const d = new Date(isoString);
    const tzOffset = d.getTimezoneOffset() * 60000;
    const localISOTime = new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
    return localISOTime;
  };

  const [regStart, setRegStart] = useState(toInputFormat(initialSettings.registrationStart));
  const [regEnd, setRegEnd] = useState(toInputFormat(initialSettings.registrationEnd));
  const [finalizeDate, setFinalizeDate] = useState(toInputFormat(initialSettings.finalizeDate));
  const [rulesText, setRulesText] = useState(initialSettings.rulesText || "");
  const [termsText, setTermsText] = useState(initialSettings.termsText || "");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationStart: regStart ? new Date(regStart).toISOString() : null,
          registrationEnd: regEnd ? new Date(regEnd).toISOString() : null,
          finalizeDate: finalizeDate ? new Date(finalizeDate).toISOString() : null,
          rulesText,
          termsText,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save settings.");
        setLoading(false);
        return;
      }

      setSuccess("Challenge settings and schedule updated successfully!");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="gym-card rounded-2xl p-4 sm:p-7 shadow-xl space-y-6 overflow-hidden">
      {error && (
        <div className="p-3.5 rounded-xl bg-red-950/50 border border-gymRed/40 text-red-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-gymRed shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {/* Registration Start */}
        <div className="min-w-0">
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
            Registration Start Date & Time
          </label>
          <div className="relative w-full min-w-0">
            <Calendar className="text-gymRed absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
            <input
              type="datetime-local"
              value={regStart}
              onChange={(e) => setRegStart(e.target.value)}
              className="w-full min-w-0 max-w-full bg-zinc-900 border border-zinc-700/80 rounded-xl pl-9 pr-2 sm:pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-gymRed [color-scheme:dark]"
            />
          </div>
          <span className="text-[10px] text-zinc-400 mt-1 block">When public registration opens.</span>
        </div>

        {/* Registration End */}
        <div className="min-w-0">
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
            Registration Close Date & Time
          </label>
          <div className="relative w-full min-w-0">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gymRed pointer-events-none" />
            <input
              type="datetime-local"
              value={regEnd}
              onChange={(e) => setRegEnd(e.target.value)}
              className="w-full min-w-0 max-w-full bg-zinc-900 border border-zinc-700/80 rounded-xl pl-9 pr-2 sm:pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-gymRed [color-scheme:dark]"
            />
          </div>
          <span className="text-[10px] text-zinc-400 mt-1 block">When public registration closes.</span>
        </div>
      </div>

      {/* Finalize Date */}
      <div className="min-w-0">
        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
          Winner Finalize Cut-off Date
        </label>
        <div className="relative w-full max-w-sm min-w-0">
          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gymRed pointer-events-none" />
          <input
            type="datetime-local"
            value={finalizeDate}
            onChange={(e) => setFinalizeDate(e.target.value)}
            className="w-full min-w-0 max-w-full bg-zinc-900 border border-zinc-700/80 rounded-xl pl-9 pr-2 sm:pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-gymRed [color-scheme:dark]"
          />
        </div>
        <span className="text-[10px] text-zinc-400 mt-1 block">
          Date and time after which Admin can officially lock in 1st, 2nd, and 3rd place winners.
        </span>
      </div>

      {/* Rules Text Editor */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
          Challenge Rules (Embedded in Final PDF)
        </label>
        <textarea
          rows={5}
          value={rulesText}
          onChange={(e) => setRulesText(e.target.value)}
          placeholder="Enter official rules here..."
          className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl p-3.5 text-xs text-zinc-200 font-mono focus:outline-none focus:border-gymRed leading-relaxed"
        />
      </div>

      {/* Terms & Conditions Text Editor */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
          Terms & Conditions
        </label>
        <textarea
          rows={6}
          value={termsText}
          onChange={(e) => setTermsText(e.target.value)}
          placeholder="Enter the official challenge terms and conditions for participants..."
          className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl p-3.5 text-xs text-zinc-200 font-mono focus:outline-none focus:border-gymRed leading-relaxed"
        />
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={loading}
          className="py-3 px-6 rounded-xl bg-gymRed hover:bg-gymRed-hover text-white font-bold text-xs tracking-wider uppercase transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Challenge Settings</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
