"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import SignaturePad from "@/components/staff/SignaturePad";
import ScalePhotoCapture from "@/components/staff/ScalePhotoCapture";
import PhotoProofModal from "@/components/staff/PhotoProofModal";
import { maskEmiratesId } from "@/lib/mask";
import dayjs, { formatDubai, formatDateOnlyDubai, getFinalWeighInWindow, DUBAI_TZ } from "@/lib/dayjs";
import { ArrowLeft, Eye, EyeOff, Scale, Clock, CheckCircle2, AlertTriangle, FileCheck, Loader2, Award, Camera, PenLine, QrCode, Scan } from "lucide-react";

interface Branch { id: string; name: string; label: string; }
interface UserData {
  id: string;
  name: string;
  emiratesId: string;
  emiratesIdExpiry?: Date | string | null;
  mobile: string;
  email: string;
  gender: string;
  dob?: Date | string | null;
  branchLabel: string;
  branchId: string;
  status: "REGISTERED" | "ACTIVE" | "COMPLETED" | "DISQUALIFIED";
  day1Date?: Date | string | null;
  deadlineDate: Date | string | null;
}
interface WeighInRecord { id: string; type: string; weightKg: number; createdAt: Date | string; photoUrl?: string | null; personScalePhotoUrl?: string | null; emiratesIdPhotoUrl?: string | null; signatureUrl?: string | null; branch: { label: string }; loggedByStaff: { username: string; name?: string | null }; }
interface CheckinClientProps { user: UserData; day1WeighIn?: WeighInRecord | null; finalWeighIn: WeighInRecord | null; daysRemaining: { daysLeft: number; isExpired: boolean; label: string } | null; branches: Branch[]; staffBranchId?: string | null; staffName: string; }

export default function CheckinClient({ user: initialUser, day1WeighIn: initialDay1, finalWeighIn: initialFinal, daysRemaining: initialDaysRemaining, branches, staffBranchId }: CheckinClientProps) {
  const router = useRouter();

  const [user, setUser] = useState<UserData>(initialUser);
  const [day1WeighIn, setDay1WeighIn] = useState<WeighInRecord | null>(initialDay1 || null);
  const [finalWeighIn, setFinalWeighIn] = useState<WeighInRecord | null>(initialFinal);
  const [daysRemaining, setDaysRemaining] = useState(initialDaysRemaining);

  const [revealEmirates, setRevealEmirates] = useState(false);
  const [weightInput, setWeightInput] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState(staffBranchId || user.branchId);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [signatureDataDay1, setSignatureDataDay1] = useState<string | null>(null);
  const [scalePhotoDay1, setScalePhotoDay1] = useState<string | null>(null);
  const [personScalePhotoDay1, setPersonScalePhotoDay1] = useState<string | null>(null);
  const [emiratesIdPhotoDay1, setEmiratesIdPhotoDay1] = useState<string | null>(null);
  const [scalePhotoFinal, setScalePhotoFinal] = useState<string | null>(null);
  const [personScalePhotoFinal, setPersonScalePhotoFinal] = useState<string | null>(null);
  const [emiratesIdPhotoFinal, setEmiratesIdPhotoFinal] = useState<string | null>(null);
  const [modalImage, setModalImage] = useState<{ url: string; title: string; subtitle?: string } | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [day1JustRecorded, setDay1JustRecorded] = useState(false);

  // 30-Day Final Weigh-in window validation
  const finalWindow = user.status === "ACTIVE" ? getFinalWeighInWindow(user.day1Date, user.deadlineDate) : null;

  // Live kg lost calculation for final weigh-in
  const parsedWeight = parseFloat(weightInput);
  const liveKgLost =
    day1WeighIn && !isNaN(parsedWeight)
      ? parseFloat((Number(day1WeighIn.weightKg) - parsedWeight).toFixed(3))
      : null;

  // Handle Day-1 Submission
  const handleDay1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const cleanWeight = weightInput.trim();
    if (!/^\d+(\.\d{3})$/.test(cleanWeight)) {
      setError("Starting weight strictly requires exactly 3 decimal places (e.g. 88.123 kg). Formats like 88, 88.2, or 88.33 are not allowed.");
      return;
    }

    if (!emiratesIdPhotoDay1) {
      setError("Please capture the Emirates ID photo proof for Day-1.");
      return;
    }

    if (!scalePhotoDay1) {
      setError("Please capture the scale photo proof for Day-1.");
      return;
    }

    if (!personScalePhotoDay1) {
      setError("Please capture the scale + person on machine photo for Day-1.");
      return;
    }

    if (!signatureDataDay1) {
      setError("Please have the participant sign in the signature pad and tap 'Lock In Signature' before submitting.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/staff/weigh-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          type: "DAY_1",
          weightKg: cleanWeight,
          branchId: selectedBranchId,
          emiratesIdPhoto: emiratesIdPhotoDay1,
          scalePhoto: scalePhotoDay1,
          personScalePhoto: personScalePhotoDay1,
          signatureDataUrl: signatureDataDay1,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to log Day-1 weigh-in.");
        setLoading(false);
        return;
      }

      setUser((prev) => ({
        ...prev,
        status: "ACTIVE",
        day1Date: data.user.day1Date,
        deadlineDate: data.user.deadlineDate,
      }));
      setDay1WeighIn(data.weighIn);
      setDay1JustRecorded(true);
      setSuccessMessage("Day-1 weigh-in, photo proofs, and participant signature recorded successfully! 30-day challenge clock started.");
      setWeightInput("");
      setEmiratesIdPhotoDay1(null);
      setScalePhotoDay1(null);
      setPersonScalePhotoDay1(null);
      setSignatureDataDay1(null);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Final Submission
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const cleanWeight = weightInput.trim();
    if (!/^\d+(\.\d{3})$/.test(cleanWeight)) {
      setError("Final weight strictly requires exactly 3 decimal places (e.g. 79.123 kg). Formats like 88, 88.2, or 88.33 are not allowed.");
      return;
    }

    if (finalWindow && !finalWindow.isEligible) {
      setError(finalWindow.message);
      return;
    }

    if (!emiratesIdPhotoFinal) {
      setError("Please capture the Emirates ID photo proof for the final weigh-in.");
      return;
    }

    if (!scalePhotoFinal) {
      setError("Please capture the scale photo proof for the final weigh-in.");
      return;
    }

    if (!personScalePhotoFinal) {
      setError("Please capture the scale + person on machine photo for the final weigh-in.");
      return;
    }

    if (!signatureData) {
      setError("Please have the participant sign in the signature pad and tap 'Lock In Signature' before submitting.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/staff/weigh-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          type: "FINAL",
          weightKg: cleanWeight,
          branchId: selectedBranchId,
          emiratesIdPhoto: emiratesIdPhotoFinal,
          scalePhoto: scalePhotoFinal,
          personScalePhoto: personScalePhotoFinal,
          signatureDataUrl: signatureData,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to log final weigh-in.");
        setLoading(false);
        return;
      }

      setUser((prev) => ({ ...prev, status: "COMPLETED" }));
      if (data.weighIn) {
        setFinalWeighIn(data.weighIn);
      }
      setSuccessMessage("Final weigh-in verified & certificate PDF emailed to participant!");
      setEmiratesIdPhotoFinal(null);
      setScalePhotoFinal(null);
      setPersonScalePhotoFinal(null);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between py-6 px-4">
      <div className="max-w-2xl w-full mx-auto space-y-4">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/staff/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Floor Search</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/staff/scan"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gymRed hover:bg-gymRed-hover text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-sm shadow-red-500/20"
            >
              <Scan className="w-3.5 h-3.5" />
              <span>Verify Next User</span>
            </Link>
            <Logo size="sm" showText={false} />
          </div>
        </div>

        {/* Participant Header Card */}
        <div className="gym-card rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-gymRed block">
                PARTICIPANT CHECK-IN
              </span>
              <h1 className="text-xl font-black text-white leading-snug">{user.name}</h1>
              <div className="font-mono text-xs text-zinc-400">ID: {user.id}</div>
            </div>

            <div className="text-right">
              {user.status === "REGISTERED" && (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/15 text-blue-400 border border-blue-500/30 block">
                  Day-1 Pending
                </span>
              )}
              {user.status === "ACTIVE" && (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30 block animate-pulse">
                  Active (Day 1-30)
                </span>
              )}
              {user.status === "COMPLETED" && (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 block">
                  Completed 🏆
                </span>
              )}
              {user.status === "DISQUALIFIED" && (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/15 text-red-400 border border-red-500/30 block">
                  Disqualified
                </span>
              )}
            </div>
          </div>

          {/* Quick Participant Metadata */}
          <div className="grid grid-cols-2 gap-2 text-xs bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
            <div>
              <span className="text-[10px] text-zinc-400 uppercase block">Emirates ID</span>
              <div className="font-mono flex items-center gap-1.5 text-zinc-200">
                <span>{revealEmirates ? user.emiratesId : maskEmiratesId(user.emiratesId)}</span>
                <button
                  type="button"
                  onClick={() => setRevealEmirates(!revealEmirates)}
                  className="text-zinc-400 hover:text-white"
                >
                  {revealEmirates ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-zinc-400 uppercase block">Emirates ID Expiry</span>
              {user.emiratesIdExpiry ? (
                <span className="text-zinc-200 font-mono">
                  {formatDateOnlyDubai(user.emiratesIdExpiry)}
                </span>
              ) : (
                <span className="text-zinc-500">—</span>
              )}
            </div>

            <div>
              <span className="text-[10px] text-zinc-400 uppercase block">Mobile</span>
              <span className="text-zinc-200 font-mono">{user.mobile}</span>
            </div>

            <div>
              <span className="text-[10px] text-zinc-400 uppercase block">Registered Club</span>
              <span className="text-zinc-200">{user.branchLabel}</span>
            </div>

            <div>
              <span className="text-[10px] text-zinc-400 uppercase block">Gender</span>
              <span className="text-zinc-200">{user.gender}</span>
            </div>

            {user.dob && (
              <div>
                <span className="text-[10px] text-zinc-400 uppercase block">Date of Birth</span>
                <span className="text-zinc-200">{formatDateOnlyDubai(user.dob)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Status Alerts */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-950/50 border border-gymRed/40 text-red-200 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-gymRed shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs space-y-3">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="font-semibold text-white">{successMessage}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-emerald-500/20">
              <Link
                href="/staff/scan"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black uppercase tracking-wider transition-all shadow-md"
              >
                <Scan className="w-4 h-4" />
                <span>Verify Next User (Scan QR)</span>
              </Link>
              <Link
                href="/staff/dashboard"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Dashboard</span>
              </Link>
            </div>
          </div>
        )}

        {/* ===================================================== */}
        {/* STATE: DAY-1 JUST RECORDED SUCCESS CONFIRMATION       */}
        {/* ===================================================== */}
        {day1JustRecorded ? (
          <div className="gym-card rounded-2xl p-6 shadow-2xl border-surface-border text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 border-2 border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">
                CHECKPOINT 1 OF 2 COMPLETE
              </span>
              <h2 className="text-xl font-black uppercase text-white">DAY-1 START WEIGHT LOGGED!</h2>
              <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
                Day-1 starting weight has been successfully saved into the official challenge registry.
              </p>
            </div>

            {/* Recorded Details Box */}
            <div className="bg-zinc-900/90 rounded-xl p-4 border border-zinc-800 text-left space-y-2.5">
              <div className="flex justify-between items-center py-1 border-b border-zinc-800/80 text-xs">
                <span className="text-zinc-400">Recorded Weight:</span>
                <span className="font-mono font-black text-white text-base">
                  {day1WeighIn ? `${Number(day1WeighIn.weightKg).toFixed(3)} kg` : "—"}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-zinc-800/80 text-xs">
                <span className="text-zinc-400">Day-1 Date:</span>
                <span className="font-semibold text-zinc-200">
                  {formatDubai(user.day1Date, "DD MMM YYYY")}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-zinc-800/80 text-xs">
                <span className="text-zinc-400">Club Logged:</span>
                <span className="font-semibold text-zinc-200">
                  {day1WeighIn?.branch?.label || user.branchLabel}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-zinc-800/80 text-xs">
                <span className="text-zinc-400">Challenge Window:</span>
                <span className="font-bold text-amber-400">30-Day Clock Running</span>
              </div>
              <div className="flex justify-between items-center py-1 text-xs">
                <span className="text-zinc-400">Return Deadline:</span>
                <span className="font-semibold text-zinc-200">
                  {user.day1Date
                    ? dayjs(user.day1Date).tz(DUBAI_TZ).add(29, "day").format("DD MMM YYYY")
                    : "—"}
                </span>
              </div>
            </div>

            {/* Security Callout */}
            <div className="p-3.5 bg-zinc-950/80 rounded-xl border border-zinc-800/80 text-[11px] text-zinc-400 text-left leading-relaxed">
              🔒 <strong className="text-zinc-300">Final weigh-in locked:</strong> Day 30 weigh-in fields will only become available when this participant returns to a club at the end of their challenge.
            </div>

            {/* Quick Actions to Scan Next */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
              <Link
                href="/staff/scan"
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gymRed hover:bg-gymRed-hover text-white text-xs font-bold uppercase tracking-wider transition-all shadow-red-glow flex items-center justify-center gap-2"
              >
                <Scan className="w-4 h-4" />
                <span>Verify Next User (Scan QR)</span>
              </Link>
              <Link
                href="/staff/dashboard"
                className="w-full sm:w-auto py-3 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Floor Search</span>
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* ===================================================== */}
            {/* STATE 1: REGISTERED -> SHOW DAY-1 FORM                */}
            {/* ===================================================== */}
            {user.status === "REGISTERED" && (
              <div className="gym-card rounded-2xl p-5 shadow-xl border-surface-border space-y-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gymRed block mb-0.5">
                    CHECKPOINT 1 OF 2
                  </span>
                  <h2 className="text-lg font-black uppercase text-white">RECORD DAY-1 START WEIGHT</h2>
                  <p className="text-xs text-zinc-400 mt-1">
                    Recording Day-1 starts this participant&apos;s 30-day challenge window.
                  </p>
                </div>

                <form onSubmit={handleDay1Submit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
                      Starting Weight (kg)
                    </label>
                    <div className="relative">
                      <Scale className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input
                        type="text"
                        inputMode="decimal"
                        pattern="^\d+(\.\d{3})$"
                        required
                        value={weightInput}
                        onChange={(e) => setWeightInput(e.target.value)}
                        placeholder="e.g. 88.123"
                        className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl pl-10 pr-12 py-3 text-lg font-mono font-bold text-white placeholder-zinc-500 focus:outline-none focus:border-gymRed"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400 uppercase">
                        KG
                      </span>
                    </div>
                    <span className="text-[11px] text-zinc-400 mt-1 block">
                      Strictly 3 decimal places required (e.g. 88.123).
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
                      Weigh-In Club
                    </label>
                    <select
                      value={selectedBranchId}
                      onChange={(e) => setSelectedBranchId(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3.5 py-3 text-xs text-white focus:outline-none focus:border-gymRed"
                    >
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.label}
                        </option>
                      ))}
                    </select>
                  </div>



                  {/* 1. Emirates ID Photo Proof */}
                  <ScalePhotoCapture
                    value={emiratesIdPhotoDay1}
                    onChange={setEmiratesIdPhotoDay1}
                    label="1. Emirates ID Photo"
                    subLabel="Capture clear front photo of the Emirates ID"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* 2. Scale Photo Proof */}
                    <ScalePhotoCapture
                      value={scalePhotoDay1}
                      onChange={setScalePhotoDay1}
                      label="2. Scale Photo"
                      subLabel="Capture scale display showing weight readout"
                    />

                    {/* 3. Scale + Person on Weigh Machine Photo Proof */}
                    <ScalePhotoCapture
                      value={personScalePhotoDay1}
                      onChange={setPersonScalePhotoDay1}
                      label="3. Scale + Person Photo"
                      subLabel="Capture participant standing on the weigh machine"
                    />
                  </div>

                  {/* Day-1 Digital Signature Pad */}
                  <div>
                    <SignaturePad
                      onSave={(dataUrl) => {
                        setSignatureDataDay1(dataUrl);
                        setSuccessMessage("Signature captured! Tap submit below to record Day-1 weight.");
                      }}
                      onClear={() => setSignatureDataDay1(null)}
                    />
                    {signatureDataDay1 && (
                      <div className="mt-2.5 flex flex-col items-center gap-1.5">
                        <div className="p-1 bg-white rounded-lg border border-zinc-300 shadow-sm max-w-[220px]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={signatureDataDay1} alt="Day-1 Signature" className="h-10 w-auto object-contain mx-auto" />
                        </div>
                        <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Signature locked in & ready</span>
                        </div>
                      </div>
                    )}
                  </div>


                  <button
                    type="submit"
                    disabled={loading || !weightInput || !emiratesIdPhotoDay1 || !scalePhotoDay1 || !personScalePhotoDay1 || !signatureDataDay1}
                    className="w-full py-3.5 rounded-xl bg-gymRed hover:bg-gymRed-hover text-white font-bold text-xs tracking-wider uppercase transition-all shadow-red-glow flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Logging Day-1...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Confirm Day-1 & Start 30-Day Clock</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* ===================================================== */}
            {/* STATE 2: ACTIVE -> SHOW FINAL WEIGH-IN FORM           */}
            {/* ===================================================== */}
            {user.status === "ACTIVE" && (
              <div className="gym-card rounded-2xl p-5 shadow-xl border-surface-border space-y-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gymRed block mb-0.5">
                    CHECKPOINT 2 OF 2
                  </span>
                  <h2 className="text-lg font-black uppercase text-white">RECORD FINAL WEIGH-IN</h2>
                  <p className="text-xs text-zinc-400 mt-1">
                    Log participant&apos;s final weight, capture their digital signature, and issue completion certificate.
                  </p>
                </div>

                {/* Day-1 Baseline Banner */}
                <div className="bg-zinc-900/90 p-3 rounded-xl border border-zinc-800 text-xs space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase block">Day-1 Start Weight</span>
                      <span className="text-base font-black text-white font-mono">
                        {day1WeighIn ? `${Number(day1WeighIn.weightKg).toFixed(3)} kg` : "—"}
                      </span>
                      <span className="text-[10px] text-zinc-400 block">
                        {formatDubai(user.day1Date, "DD MMM YYYY")}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase block">Deadline Countdown</span>
                      <span
                        className={`text-xs font-bold block ${daysRemaining?.isExpired ? "text-red-400" : "text-amber-400"
                          }`}
                      >
                        {daysRemaining?.label || "Day 30 Window Active"}
                      </span>
                      <span className="text-[10px] text-zinc-400 block">
                        Due by: {formatDubai(user.deadlineDate, "DD MMM YYYY")}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    {day1WeighIn?.emiratesIdPhotoUrl && (
                      <button
                        type="button"
                        onClick={() =>
                          setModalImage({
                            url: day1WeighIn.emiratesIdPhotoUrl!,
                            title: "Emirates ID Photo",
                            subtitle: `${user.name} · Day-1 Verified`,
                          })
                        }
                        className="w-full py-1.5 px-2 rounded-lg bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/60 text-zinc-300 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 text-blue-400" />
                        <span>Emirates ID</span>
                      </button>
                    )}
                    {day1WeighIn?.photoUrl && (
                      <button
                        type="button"
                        onClick={() =>
                          setModalImage({
                            url: day1WeighIn.photoUrl!,
                            title: "Day-1 Scale Photo",
                            subtitle: `${Number(day1WeighIn.weightKg).toFixed(3)} kg · ${formatDubai(user.day1Date)}`,
                          })
                        }
                        className="w-full py-1.5 px-2 rounded-lg bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/60 text-zinc-300 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Camera className="w-3.5 h-3.5 text-gymRed" />
                        <span>Scale</span>
                      </button>
                    )}
                    {day1WeighIn?.personScalePhotoUrl && (
                      <button
                        type="button"
                        onClick={() =>
                          setModalImage({
                            url: day1WeighIn.personScalePhotoUrl!,
                            title: "Day-1 Scale + Person Photo",
                            subtitle: `${user.name} · ${formatDubai(user.day1Date)}`,
                          })
                        }
                        className="w-full py-1.5 px-2 rounded-lg bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/60 text-zinc-300 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Camera className="w-3.5 h-3.5 text-purple-400" />
                        <span>Scale + Person</span>
                      </button>
                    )}
                    {day1WeighIn?.signatureUrl && (
                      <button
                        type="button"
                        onClick={() =>
                          setModalImage({
                            url: day1WeighIn.signatureUrl!,
                            title: "Day-1 Participant Signature",
                            subtitle: `Signed at ${day1WeighIn.branch?.label || "Club"} · ${formatDubai(day1WeighIn.createdAt, "DD MMM YYYY, hh:mm A")}`,
                          })
                        }
                        className="w-full py-1.5 px-2 rounded-lg bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/60 text-zinc-300 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <PenLine className="w-3.5 h-3.5 text-amber-400" />
                        <span>Signature</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Final Weigh-in Window Status Banner */}
                {finalWindow?.status === "TOO_EARLY" && (
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/40 text-left space-y-2.5">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wide">
                      <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Final Weigh-In Window Not Yet Open</span>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      Participant is currently on <strong className="text-white">Day {finalWindow.challengeDay}</strong> of the 30-day challenge. Final weigh-in can only be recorded on <strong className="text-amber-400">Day 30</strong>.
                    </p>
                    <div className="p-3 rounded-lg bg-black/50 border border-amber-500/20 text-xs text-zinc-400 space-y-1">
                      <div className="text-zinc-200">
                        <span className="font-semibold">Eligible Date:</span>{" "}
                        <strong className="text-amber-300">{finalWindow.day30Date}</strong>
                      </div>
                      <div className="text-[11px] text-zinc-400 pt-0.5">
                        Please advise the participant to return on Day 30 to officially log their final weight.
                      </div>
                    </div>
                  </div>
                )}

                {finalWindow?.status === "OPEN" && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-left flex items-center gap-2.5 text-xs text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <span className="font-bold text-white block">Final Weigh-In Window Open (Day {finalWindow.challengeDay} of 30)</span>
                      <span className="text-[11px] text-zinc-300">Eligible date: {finalWindow.day30Date}</span>
                    </div>
                  </div>
                )}

                {finalWindow?.isEligible && (
                  <form onSubmit={handleFinalSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
                        Final Weigh-In (kg)
                      </label>
                      <div className="relative">
                        <Scale className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                          type="text"
                          inputMode="decimal"
                          pattern="^\d+(\.\d{3})$"
                          required
                          value={weightInput}
                          onChange={(e) => setWeightInput(e.target.value)}
                          placeholder="e.g. 79.123"
                          className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl pl-10 pr-12 py-3 text-lg font-mono font-bold text-white placeholder-zinc-500 focus:outline-none focus:border-gymRed"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400 uppercase">
                          KG
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-400 mt-1 block">
                        Strictly 3 decimal places required (e.g. 79.123).
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
                        Weigh-In Club
                      </label>
                      <select
                        value={selectedBranchId}
                        onChange={(e) => setSelectedBranchId(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3.5 py-3 text-xs text-white focus:outline-none focus:border-gymRed"
                      >
                        {branches.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Live Weight Loss Preview */}
                    {liveKgLost !== null && (
                      <div className="p-3 rounded-xl bg-zinc-900 border border-gymRed/30 flex items-center justify-between text-xs">
                        <span className="text-zinc-400 font-semibold uppercase">
                          {liveKgLost > 0 ? "Total Weight Reduced:" : liveKgLost < 0 ? "Weight Gained:" : "Weight Difference:"}
                        </span>
                        <span
                          className={`font-mono text-base font-black ${
                            liveKgLost > 0 ? "text-emerald-400" : liveKgLost < 0 ? "text-red-400" : "text-zinc-300"
                          }`}
                        >
                          {liveKgLost > 0
                            ? `-${liveKgLost.toFixed(3)} kg`
                            : liveKgLost < 0
                            ? `+${Math.abs(liveKgLost).toFixed(3)} kg`
                            : "0.000 kg"}
                        </span>
                      </div>
                    )}

                    {/* 1. Emirates ID Photo Proof */}
                    <ScalePhotoCapture
                      value={emiratesIdPhotoFinal}
                      onChange={setEmiratesIdPhotoFinal}
                      label="1. Emirates ID Photo"
                      subLabel="Capture clear front photo of the Emirates ID"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* 2. Scale Photo Proof */}
                      <ScalePhotoCapture
                        value={scalePhotoFinal}
                        onChange={setScalePhotoFinal}
                        label="2. Scale Photo"
                        subLabel="Capture scale display showing final weight readout"
                      />

                      {/* 3. Scale + Person on Weigh Machine Photo Proof */}
                      <ScalePhotoCapture
                        value={personScalePhotoFinal}
                        onChange={setPersonScalePhotoFinal}
                        label="3. Scale + Person Photo"
                        subLabel="Capture participant standing on the weigh machine"
                      />
                    </div>

                    {/* Digital Signature Pad */}
                    <div>
                      <SignaturePad
                        onSave={(dataUrl) => {
                          setSignatureData(dataUrl);
                          setSuccessMessage("Signature captured! Tap submit below to complete final weigh-in.");
                        }}
                        onClear={() => setSignatureData(null)}
                      />
                      {signatureData && (
                        <div className="mt-2.5 flex flex-col items-center gap-1.5">
                          <div className="p-1 bg-white rounded-lg border border-zinc-300 shadow-sm max-w-[220px]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={signatureData} alt="Final Signature" className="h-10 w-auto object-contain mx-auto" />
                          </div>
                          <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Signature locked in & ready</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={loading || !weightInput || !emiratesIdPhotoFinal || !scalePhotoFinal || !personScalePhotoFinal || !signatureData}
                      className="w-full py-3.5 rounded-xl bg-gymRed hover:bg-gymRed-hover text-white font-bold text-xs tracking-wider uppercase transition-all shadow-red-glow flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Verifying & Generating PDF...</span>
                        </>
                      ) : (
                        <>
                          <FileCheck className="w-4 h-4" />
                          <span>Complete Final Weigh-In & Email PDF</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* ===================================================== */}
            {/* STATE 3: COMPLETED -> READ ONLY CERTIFICATE SUMMARY   */}
            {/* ===================================================== */}
            {user.status === "COMPLETED" && (
              <div className="gym-card rounded-2xl p-5 sm:p-6 shadow-xl border-surface-border text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                  <Award className="w-6 h-6" />
                </div>

                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block mb-0.5">
                    OFFICIALLY VERIFIED
                  </span>
                  <h2 className="text-xl font-black uppercase text-white">CHALLENGE COMPLETED</h2>
                  <p className="text-xs text-zinc-400 mt-1">
                    Both weigh-ins recorded and signed. Official summary has been emailed.
                  </p>
                </div>

                {/* Results Grid */}
                <div className="grid grid-cols-3 gap-2 bg-zinc-900/80 p-3 rounded-xl border border-zinc-800 text-center">
                  <div>
                    <span className="text-[10px] text-zinc-400 uppercase block font-semibold">Day-1 Start</span>
                    <span className="font-mono text-sm font-bold text-white block">
                      {day1WeighIn ? `${Number(day1WeighIn.weightKg).toFixed(3)} kg` : "—"}
                    </span>
                    {day1WeighIn && (
                      <span className="text-[9px] text-zinc-500 block leading-tight mt-0.5">
                        {formatDubai(day1WeighIn.createdAt, "DD MMM YYYY")}<br />
                        {formatDubai(day1WeighIn.createdAt, "hh:mm A")}
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] text-zinc-400 uppercase block font-semibold">Final Weight</span>
                    <span className="font-mono text-sm font-bold text-white block">
                      {finalWeighIn ? `${Number(finalWeighIn.weightKg).toFixed(3)} kg` : "—"}
                    </span>
                    {finalWeighIn && (
                      <span className="text-[9px] text-zinc-500 block leading-tight mt-0.5">
                        {formatDubai(finalWeighIn.createdAt, "DD MMM YYYY")}<br />
                        {formatDubai(finalWeighIn.createdAt, "hh:mm A")}
                      </span>
                    )}
                  </div>

                  <div>
                    {(() => {
                      if (!day1WeighIn || !finalWeighIn) {
                        return (
                          <>
                            <span className="text-[10px] text-zinc-400 uppercase font-bold block">Weight Delta</span>
                            <span className="font-mono text-sm font-black text-zinc-500 block">—</span>
                          </>
                        );
                      }
                      const diff = Number(day1WeighIn.weightKg) - Number(finalWeighIn.weightKg);
                      const isLost = diff > 0;
                      const isGained = diff < 0;
                      return (
                        <>
                          <span className={`text-[10px] uppercase font-bold block ${isLost ? "text-emerald-400" : isGained ? "text-red-400" : "text-zinc-400"}`}>
                            {isLost ? "Weight Reduced" : isGained ? "Weight Gained" : "No Change"}
                          </span>
                          <span className={`font-mono text-sm font-black block ${isLost ? "text-emerald-400" : isGained ? "text-red-400" : "text-zinc-200"}`}>
                            {isLost
                              ? `-${diff.toFixed(3)} kg`
                              : isGained
                              ? `+${Math.abs(diff).toFixed(3)} kg`
                              : "0.000 kg"}
                          </span>
                        </>
                      );
                    })()}
                    <span className="text-[9px] text-zinc-500 block mt-0.5">
                      Total Delta
                    </span>
                  </div>
                </div>

                {/* Proofs Section: Day-1 Photo, Final Photo */}
                <div className="space-y-2 text-left">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block px-1">
                    Verification Photos on Record
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {day1WeighIn?.photoUrl ? (
                      <button
                        type="button"
                        onClick={() =>
                          setModalImage({
                            url: day1WeighIn.photoUrl!,
                            title: "Day-1 Scale Photo",
                            subtitle: `${Number(day1WeighIn.weightKg).toFixed(3)} kg · ${formatDubai(day1WeighIn.createdAt, "DD MMM YYYY, hh:mm A")}`,
                          })
                        }
                        className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-left transition-colors flex items-center gap-2"
                      >
                        <div className="w-7 h-7 rounded-lg bg-gymRed/15 text-gymRed flex items-center justify-center shrink-0">
                          <Camera className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[11px] font-bold text-white leading-none">Day-1 Scale</span>
                          <span className="text-[10px] text-zinc-400 leading-none">View Scale</span>
                        </div>
                      </button>
                    ) : (
                      <div className="p-2.5 rounded-xl bg-zinc-900/50 border border-zinc-800/50 text-[11px] text-zinc-500 flex items-center gap-2">
                        <Camera className="w-3.5 h-3.5 text-zinc-600" />
                        <span>No Day-1 Photo</span>
                      </div>
                    )}

                    {day1WeighIn?.emiratesIdPhotoUrl && (
                      <button
                        type="button"
                        onClick={() =>
                          setModalImage({
                            url: day1WeighIn.emiratesIdPhotoUrl!,
                            title: "Emirates ID Photo",
                            subtitle: `${user.name} · Day-1 Verified Proof`,
                          })
                        }
                        className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-left transition-colors flex items-center gap-2"
                      >
                        <div className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0">
                          <Eye className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[11px] font-bold text-white leading-none">Emirates ID</span>
                          <span className="text-[10px] text-zinc-400 leading-none">View ID</span>
                        </div>
                      </button>
                    )}

                    {day1WeighIn?.personScalePhotoUrl && (
                      <button
                        type="button"
                        onClick={() =>
                          setModalImage({
                            url: day1WeighIn.personScalePhotoUrl!,
                            title: "Day-1 Scale + Person Photo",
                            subtitle: `${user.name} · Day-1 Verified Proof`,
                          })
                        }
                        className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-left transition-colors flex items-center gap-2"
                      >
                        <div className="w-7 h-7 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center shrink-0">
                          <Camera className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[11px] font-bold text-white leading-none">Day-1 Person</span>
                          <span className="text-[10px] text-zinc-400 leading-none">Scale + Person</span>
                        </div>
                      </button>
                    )}

                    {finalWeighIn?.photoUrl ? (
                      <button
                        type="button"
                        onClick={() =>
                          setModalImage({
                            url: finalWeighIn.photoUrl!,
                            title: "Final Scale Photo",
                            subtitle: `${Number(finalWeighIn.weightKg).toFixed(3)} kg · ${formatDubai(finalWeighIn.createdAt, "DD MMM YYYY, hh:mm A")}`,
                          })
                        }
                        className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-left transition-colors flex items-center gap-2"
                      >
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                          <Camera className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[11px] font-bold text-white leading-none">Final Scale</span>
                          <span className="text-[10px] text-zinc-400 leading-none">View Scale</span>
                        </div>
                      </button>
                    ) : (
                      <div className="p-2.5 rounded-xl bg-zinc-900/50 border border-zinc-800/50 text-[11px] text-zinc-500 flex items-center gap-2">
                        <Camera className="w-3.5 h-3.5 text-zinc-600" />
                        <span>No Final Photo</span>
                      </div>
                    )}

                    {finalWeighIn?.emiratesIdPhotoUrl && (
                      <button
                        type="button"
                        onClick={() =>
                          setModalImage({
                            url: finalWeighIn.emiratesIdPhotoUrl!,
                            title: "Final Emirates ID Photo",
                            subtitle: `${user.name} · Final Verified Proof`,
                          })
                        }
                        className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-left transition-colors flex items-center gap-2"
                      >
                        <div className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0">
                          <Eye className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[11px] font-bold text-white leading-none">Final Emirates ID</span>
                          <span className="text-[10px] text-zinc-400 leading-none">View ID</span>
                        </div>
                      </button>
                    )}

                    {finalWeighIn?.personScalePhotoUrl && (
                      <button
                        type="button"
                        onClick={() =>
                          setModalImage({
                            url: finalWeighIn.personScalePhotoUrl!,
                            title: "Final Scale + Person Photo",
                            subtitle: `${user.name} · Final Verified Proof`,
                          })
                        }
                        className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-left transition-colors flex items-center gap-2"
                      >
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                          <Camera className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[11px] font-bold text-white leading-none">Final Person</span>
                          <span className="text-[10px] text-zinc-400 leading-none">Scale + Person</span>
                        </div>
                      </button>
                    )}
                  </div>
                </div>

                {/* Verification Signatures Preview */}
                <div className="space-y-3">
                  {day1WeighIn?.signatureUrl && (
                    <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 text-left space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-zinc-400">
                          Day-1 Starting Signature
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setModalImage({
                              url: day1WeighIn.signatureUrl!,
                              title: "Day-1 Participant Signature",
                              subtitle: `Signed at ${day1WeighIn.branch?.label || "Club"} · ${formatDubai(day1WeighIn.createdAt, "DD MMM YYYY, hh:mm A")}`,
                            })
                          }
                          className="text-[10px] font-semibold text-gymRed hover:underline"
                        >
                          Enlarge
                        </button>
                      </div>
                      <div
                        onClick={() =>
                          setModalImage({
                            url: day1WeighIn.signatureUrl!,
                            title: "Day-1 Participant Signature",
                            subtitle: `Signed at ${day1WeighIn.branch?.label || "Club"} · ${formatDubai(day1WeighIn.createdAt, "DD MMM YYYY, hh:mm A")}`,
                          })
                        }
                        className="h-16 relative bg-zinc-900/60 rounded-lg flex items-center justify-center overflow-hidden cursor-pointer hover:bg-zinc-900 transition-colors"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={day1WeighIn.signatureUrl}
                          alt="Day-1 Participant Signature"
                          className="max-h-12 w-auto max-w-[80%] object-contain"
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-0.5">
                        <span>
                          Logged by: {day1WeighIn.loggedByStaff?.name || day1WeighIn.loggedByStaff?.username}
                        </span>
                        <span className="font-mono text-zinc-500">
                          {formatDubai(day1WeighIn.createdAt, "DD MMM YYYY · hh:mm A")}
                        </span>
                      </div>
                    </div>
                  )}

                  {finalWeighIn?.signatureUrl && (
                    <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 text-left space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-zinc-400">
                          Final Weigh-In Signature
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setModalImage({
                              url: finalWeighIn.signatureUrl!,
                              title: "Final Participant Digital Signature",
                              subtitle: `Signed at ${finalWeighIn.branch?.label || "Club"} · ${formatDubai(finalWeighIn.createdAt, "DD MMM YYYY, hh:mm A")}`,
                            })
                          }
                          className="text-[10px] font-semibold text-gymRed hover:underline"
                        >
                          Enlarge
                        </button>
                      </div>
                      <div
                        onClick={() =>
                          setModalImage({
                            url: finalWeighIn.signatureUrl!,
                            title: "Final Participant Digital Signature",
                            subtitle: `Signed at ${finalWeighIn.branch?.label || "Club"} · ${formatDubai(finalWeighIn.createdAt, "DD MMM YYYY, hh:mm A")}`,
                          })
                        }
                        className="h-16 relative bg-zinc-900/60 rounded-lg flex items-center justify-center overflow-hidden cursor-pointer hover:bg-zinc-900 transition-colors"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={finalWeighIn.signatureUrl}
                          alt="Final Participant Signature"
                          className="max-h-12 w-auto max-w-[80%] object-contain"
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-0.5">
                        <span>
                          Verified by: {finalWeighIn.loggedByStaff?.name || finalWeighIn.loggedByStaff?.username}
                        </span>
                        <span className="font-mono text-zinc-500">
                          {formatDubai(finalWeighIn.createdAt, "DD MMM YYYY · hh:mm A")}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Actions after Final Weigh-in Completed */}
                <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-3 border-t border-zinc-800">
                  <Link
                    href="/staff/scan"
                    className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gymRed hover:bg-gymRed-hover text-white text-xs font-bold uppercase tracking-wider transition-all shadow-red-glow flex items-center justify-center gap-2"
                  >
                    <Scan className="w-4 h-4" />
                    <span>Verify Next User (Scan QR)</span>
                  </Link>
                  <Link
                    href="/staff/dashboard"
                    className="w-full sm:w-auto py-3 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Floor Search</span>
                  </Link>
                </div>
              </div>
            )}

            {/* ===================================================== */}
            {/* STATE 4: DISQUALIFIED BANNER                          */}
            {/* ===================================================== */}
            {user.status === "DISQUALIFIED" && (
              <div className="gym-card rounded-2xl p-6 border-red-900/50 bg-red-950/20 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-red-900/30 border border-red-700/50 text-red-400 flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-6 h-6 text-gymRed" />
                </div>

                <h2 className="text-lg font-black uppercase text-red-400">PARTICIPANT DISQUALIFIED</h2>
                <p className="text-xs text-zinc-300 leading-relaxed max-w-xs mx-auto">
                  This participant exceeded the 30-day period without completing their final weigh-in.
                </p>

                <div className="text-xs text-zinc-400 pt-2 border-t border-red-900/30">
                  <div>Day-1 Date: {formatDubai(user.day1Date)}</div>
                  <div>Deadline was: {formatDubai(user.deadlineDate)}</div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <footer className="text-center text-[11px] text-zinc-400 mt-6">
        Staff Check-In Portal · Face off fitness
      </footer>

      {/* Lightbox Photo Proof Modal */}
      <PhotoProofModal
        isOpen={!!modalImage}
        onClose={() => setModalImage(null)}
        imageUrl={modalImage?.url || null}
        title={modalImage?.title || ""}
        subtitle={modalImage?.subtitle}
      />
    </div>
  );
}
