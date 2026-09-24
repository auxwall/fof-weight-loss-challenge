"use client";

import { useState } from "react";
import { UserPlus, Shield, User, Lock, Building2, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface Branch {
  id: string;
  name: string;
  label: string;
}

interface StaffMember {
  id: string;
  username: string;
  name: string | null;
  role: string;
  branchId: string | null;
  branchLabel: string;
  weighInsCount: number;
  createdAt: string;
}

interface StaffManagerProps {
  initialStaff: StaffMember[];
  branches: Branch[];
}

export default function StaffManager({ initialStaff, branches }: StaffManagerProps) {
  const [staffList, setStaffList] = useState<StaffMember[]>(initialStaff);
  const [showAddForm, setShowAddForm] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    name: "",
    branchId: branches[0]?.id || "",
    role: "STAFF",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create staff account.");
        setLoading(false);
        return;
      }

      setSuccess(`Staff account '${formData.username}' created successfully!`);
      setStaffList((prev) => [
        {
          id: data.staff.id,
          username: data.staff.username,
          name: data.staff.name,
          role: data.staff.role,
          branchId: formData.branchId,
          branchLabel: data.staff.branchLabel,
          weighInsCount: 0,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);

      setFormData({
        username: "",
        password: "",
        name: "",
        branchId: branches[0]?.id || "",
        role: "STAFF",
      });
      setShowAddForm(false);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-xs sm:text-sm font-bold uppercase tracking-tight sm:tracking-wider text-zinc-400 whitespace-nowrap">
            REGISTERED ACCOUNTS ({staffList.length})
          </h2>
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="py-2 px-3 sm:py-2.5 sm:px-4 rounded-xl bg-gymRed hover:bg-gymRed-hover text-white text-[11px] sm:text-xs font-bold uppercase tracking-tight sm:tracking-wider shadow-red-glow flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
        >
          <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span>{showAddForm ? "Cancel" : "Create Staff Account"}</span>
        </button>
      </div>

      {success && (
        <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Add Staff Drawer / Card */}
      {showAddForm && (
        <form
          onSubmit={handleAddStaff}
          className="gym-card rounded-2xl p-5 sm:p-6 border-gymRed/40 shadow-xl space-y-4"
        >
          <div className="border-b border-surface-border pb-3">
            <h3 className="text-sm font-bold text-white uppercase">New Staff Member Credentials</h3>
            <p className="text-xs text-zinc-400">Staff will log in at /staff/login using this username & password.</p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-950/50 border border-gymRed/40 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-gymRed shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1">
                Username
              </label>
              <input
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="e.g. staff.alnahda"
                className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-gymRed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••••••"
                className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-gymRed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1">
                Display Name (Optional)
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Tariq Staff"
                className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-gymRed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1">
                Assigned Club
              </label>
              <select
                value={formData.branchId}
                onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-gymRed"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="py-2.5 px-5 rounded-xl bg-gymRed hover:bg-gymRed-hover text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-red-glow flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Save Staff Member</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Staff Table */}
      <div className="gym-card rounded-2xl overflow-hidden border-surface-border shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[420px] sm:min-w-full">
            <thead className="bg-zinc-900/90 text-zinc-400 uppercase tracking-tight sm:tracking-wider border-b border-surface-border">
              <tr>
                <th className="p-2.5 sm:p-3.5 text-[10px] sm:text-xs font-semibold">Account</th>
                <th className="p-2.5 sm:p-3.5 text-[10px] sm:text-xs font-semibold">Role</th>
                <th className="p-2.5 sm:p-3.5 text-[10px] sm:text-xs font-semibold">Club</th>
                <th className="p-2.5 sm:p-3.5 text-[10px] sm:text-xs font-semibold text-center whitespace-nowrap">
                  <span className="hidden sm:inline">Weigh-Ins Verified</span>
                  <span className="sm:hidden">Verified</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {staffList.map((s) => (
                <tr key={s.id} className="hover:bg-surface-hover/50 transition-colors">
                  <td className="p-2.5 sm:p-3.5">
                    <div className="font-bold text-white text-xs sm:text-sm">{s.username}</div>
                    {s.name && <div className="text-[10px] sm:text-[11px] text-zinc-400">{s.name}</div>}
                  </td>
                  <td className="p-2.5 sm:p-3.5">
                    {s.role === "SUPER_ADMIN" ? (
                      <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-gymRed/20 text-gymRed border border-gymRed/40 whitespace-nowrap">
                        SuperAdmin
                      </span>
                    ) : (
                      <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider bg-zinc-800 text-zinc-300 border border-zinc-700 whitespace-nowrap">
                        Staff
                      </span>
                    )}
                  </td>
                  <td className="p-2.5 sm:p-3.5 font-medium text-zinc-300">
                    <div className="flex items-center gap-1 sm:gap-1.5 whitespace-nowrap text-xs">
                      <Building2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gymRed shrink-0" />
                      <span>{s.branchLabel}</span>
                    </div>
                  </td>
                  <td className="p-2.5 sm:p-3.5 text-center font-mono font-bold text-xs sm:text-sm text-zinc-200">
                    {s.weighInsCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
