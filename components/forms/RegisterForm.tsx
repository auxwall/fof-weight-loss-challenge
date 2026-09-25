"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, CreditCard, Phone, Mail, Building2, AlertCircle, Loader2, ArrowRight, ChevronDown, Calendar } from "lucide-react";
import dayjs from "dayjs";
import { RegisterSchema, formatEmiratesId } from "@/lib/validation";

interface Branch { id: string; name: string; label: string; }

interface RegisterFormProps { branches: Branch[]; }

export default function RegisterForm({ branches }: RegisterFormProps) {
  const router = useRouter();

  const [formData, setFormData] = useState({ name: "", emiratesId: "", dob: "", mobile: "", email: "", gender: "MALE", branchId: "", termsAccepted: false});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    // Clear field-specific error as user types/interacts
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }

    if (name === "termsAccepted" || type === "checkbox") {
      setFormData((prev) => ({...prev, termsAccepted: checked,}));
      return;
    }

    if (name === "emiratesId") {
      setFormData((prev) => ({ ...prev, emiratesId: formatEmiratesId(value), }));
      return;
    }

    setFormData((prev) => ({...prev,[name]: value,}));
  };

  const handleGenderSelect = (gender: "MALE" | "FEMALE") => {
    setFormData((prev) => ({ ...prev, gender }));
    if (fieldErrors.gender) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.gender;
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    // 1. Client-side Zod Schema Validation
    const validation = RegisterSchema.safeParse(formData);
    if (!validation.success) {
      const errMap: Record<string, string> = {};
      for (const issue of validation.error.issues) {
        const key = issue.path[0] as string;
        if (key && !errMap[key]) {
          errMap[key] = issue.message;
        }
      }
      setFieldErrors(errMap);
      setError(validation.error.issues[0]?.message || "Please correct the highlighted fields.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(validation.data), });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to register. Please try again.");
        setLoading(false);
        return;
      }

      // Store in session storage for the success preview screen
      if (typeof window !== "undefined") {
        sessionStorage.setItem("challenge_registered_user", JSON.stringify(data));
      }

      router.push(`/register/success?userId=${encodeURIComponent(data.userId)}`);
    } catch {
      setError("Network error. Please check your connection and try again.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="gym-card rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
      {error && (
        <div className="p-3.5 rounded-xl bg-red-950/50 border border-gymRed/40 text-red-200 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-gymRed shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Full Name */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
          Full Name <span className="text-gymRed">*</span>
        </label>
        <div className="relative">
          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input type="text" name="name" required value={formData.name} onChange={handleChange} placeholder="e.g. Ahmed Al Mansoori" className={`w-full bg-zinc-900 border rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none transition-all ${ fieldErrors.name ? "border-gymRed ring-1 ring-gymRed" : "border-zinc-700/80 focus:border-yellow-600/50 focus:ring-0.1 focus:ring-gymRed" }`}/>
        </div>
        {fieldErrors.name && ( <p className="text-[11px] text-gymRed mt-1 font-medium">{fieldErrors.name}</p> )}
      </div>

      {/* Emirates ID */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5"> Emirates ID <span className="text-gymRed">*</span> </label>
        <div className="relative">
          <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input type="text" name="emiratesId" required maxLength={18} value={formData.emiratesId} onChange={handleChange} placeholder="784-XXXX-XXXXXXX-X" className={`w-full bg-zinc-900 border rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none transition-all font-mono ${ fieldErrors.emiratesId ? "border-gymRed ring-1 ring-gymRed" : "border-zinc-700/80 focus:border-yellow-600/50 focus:ring-0.1 focus:ring-gymRed" }`}/>
        </div>
        {fieldErrors.emiratesId ? (
          <p className="text-[11px] text-gymRed mt-1 font-medium">{fieldErrors.emiratesId}</p>
        ) : (
          <span className="text-[10px] text-zinc-400 mt-1 block">Masked by default in logs for your privacy.</span>
        )}
      </div>

      {/* Date of Birth */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300">
            Date of Birth <span className="text-gymRed">*</span>
          </label>
          <span className="text-[10px] text-zinc-400 font-medium">Must be 18+ years</span>
        </div>
        <div
          className={`relative w-full bg-zinc-900 border rounded-xl pl-10 pr-3.5 py-3 flex items-center transition-all cursor-pointer ${
            fieldErrors.dob
              ? "border-gymRed ring-1 ring-gymRed"
              : "border-zinc-700/80 focus-within:border-yellow-600/50 focus-within:ring-0.1 focus-within:ring-gymRed"
          }`}
        >
          <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
          <span
            className={`text-sm select-none truncate ${
              formData.dob ? "text-white font-medium" : "text-zinc-500"
            }`}
          >
            {formData.dob
              ? dayjs(formData.dob).isValid()
                ? dayjs(formData.dob).format("DD MMM YYYY")
                : formData.dob
              : "Select Date of Birth"}
          </span>
          <ChevronDown className="ml-auto w-4 h-4 text-zinc-500 pointer-events-none shrink-0" />

          {/* Native date picker overlay restricted to participants who are at least 18 years old */}
          <input
            type="date"
            name="dob"
            required
            max={dayjs().subtract(18, "year").format("YYYY-MM-DD")}
            value={formData.dob}
            onChange={handleChange}
            onClick={(e) => {
              try {
                (e.target as HTMLInputElement & { showPicker?: () => void }).showPicker?.();
              } catch {}
            }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 text-base"
          />
        </div>
        {fieldErrors.dob && (
          <p className="text-[11px] text-gymRed mt-1 font-medium">{fieldErrors.dob}</p>
        )}
      </div>

      {/* Mobile Number */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">Mobile Number <span className="text-gymRed">*</span></label>
        <div className="relative">
          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input type="tel" name="mobile" required value={formData.mobile} onChange={handleChange} placeholder="050 123 4567" className={`w-full bg-zinc-900 border rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none transition-all ${ fieldErrors.mobile ? "border-gymRed ring-1 ring-gymRed" : "border-zinc-700/80 focus:border-yellow-600/50 focus:ring-0.1 focus:ring-gymRed" }`}/>
        </div>
        {fieldErrors.mobile && (
          <p className="text-[11px] text-gymRed mt-1 font-medium">{fieldErrors.mobile}</p>
        )}
      </div>

      {/* Email Address */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">Email Address <span className="text-gymRed">*</span></label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input type="email" name="email" required value={formData.email} onChange={handleChange} placeholder="yourname@domain.com" className={`w-full bg-zinc-900 border rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none transition-all ${ fieldErrors.email ? "border-gymRed ring-1 ring-gymRed" : "border-zinc-700/80 focus:border-yellow-600/50 focus:ring-0.1 focus:ring-gymRed" }`}/>
        </div>
        {fieldErrors.email ? (
          <p className="text-[11px] text-gymRed mt-1 font-medium">{fieldErrors.email}</p>
        ) : (
          <span className="text-[10px] text-zinc-400 mt-1 block">Your User ID and QR Code pass will be sent here.</span>
        )}
      </div>

      {/* Gender Selection */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">Gender <span className="text-gymRed">*</span></label>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => handleGenderSelect("MALE")} className={`py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${ formData.gender === "MALE" ? "bg-gymRed text-white border-gymRed shadow-sm" : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700" }`}>
            Male
          </button>
          <button type="button" onClick={() => handleGenderSelect("FEMALE")} className={`py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${ formData.gender === "FEMALE" ? "bg-gymRed text-white border-gymRed shadow-sm" : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700" }`}>
            Female
          </button>
        </div>
        {fieldErrors.gender && ( <p className="text-[11px] text-gymRed mt-1 font-medium">{fieldErrors.gender}</p> )}
      </div>

      {/* Primary Branch Selection */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">Select Club <span className="text-gymRed">*</span></label>
        <div className="relative">
          <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
          <select name="branchId" required value={formData.branchId} onChange={handleChange} className={`w-full bg-zinc-900 border rounded-xl pl-10 pr-10 py-3 text-sm focus:outline-none transition-all appearance-none cursor-pointer ${ fieldErrors.branchId ? "border-gymRed ring-1 ring-gymRed" : "border-zinc-700/80 focus:border-yellow-600/50 focus:ring-0.1 focus:ring-gymRed" } ${formData.branchId ? "text-white font-medium" : "text-zinc-500"}`}>
            <option value="" disabled className="bg-zinc-900 text-zinc-500">Choose club</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id} className="bg-zinc-900 text-white"> {b.label} </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
        </div>
        {fieldErrors.branchId ? (
          <p className="text-[11px] text-gymRed mt-1 font-medium">{fieldErrors.branchId}</p>
        ) : (
          <span className="text-[10px] text-zinc-400 mt-1 block">Cross-club visits allowed for weigh-ins.</span>
        )}
      </div>

      {/* Terms & Conditions Checkbox */}
      <div className="pt-2">
        <label className="flex items-start gap-3 cursor-pointer select-none group">
          <input type="checkbox" name="termsAccepted" checked={formData.termsAccepted} onChange={handleChange} className="mt-0.5 w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-gymRed focus:ring-gymRed focus:ring-offset-0 focus:ring-0.1 cursor-pointer accent-gymRed"/>
          <span className="text-xs text-zinc-300 leading-snug">
            I agree to the{" "}
            <Link href="/terms" target="_blank" rel="noopener noreferrer" className="text-gymRed hover:text-gymRed-hover underline font-semibold focus:outline-none transition-colors">Terms & Conditions</Link>{" "}
            and confirm I follow{" "}
            <a href="https://www.instagram.com/faceoff.fitness?stkn=NTB3bG9rZmw3Zmhv" target="_blank" rel="noopener noreferrer" className="text-white hover:text-pink-400 font-semibold">@faceoff.fitness</a> on Instagram and shared the challenge post.{" "}
            <span className="text-gymRed">*</span>
          </span>
        </label>
        {fieldErrors.termsAccepted && (
          <p className="text-[11px] text-gymRed mt-1.5 font-medium flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{fieldErrors.termsAccepted}</span>
          </p>
        )}
      </div>

      {/* Submit Button */}
      <div className="pt-2">
        <button type="submit" disabled={loading} className="w-full py-3.5 rounded-xl bg-gymRed hover:bg-gymRed-hover text-white font-bold text-sm tracking-wider uppercase transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Registering...</span>
            </>
          ) : (
            <>
              <span>Get Challenge Pass</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
