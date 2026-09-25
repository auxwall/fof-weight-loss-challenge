"use client";

import { useState } from "react";
import {
  UserPlus,
  Building2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Pencil,
  Trash2,
  X,
  ShieldAlert,
} from "lucide-react";

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
  currentUserId?: string;
}

export default function StaffManager({ initialStaff, branches, currentUserId }: StaffManagerProps) {
  const [staffList, setStaffList] = useState<StaffMember[]>(initialStaff);
  const [showAddForm, setShowAddForm] = useState(false);

  // Add Form state
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

  // Edit Modal state
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [editFormData, setEditFormData] = useState({
    username: "",
    password: "",
    name: "",
    branchId: "",
    role: "STAFF",
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete Modal state
  const [deletingStaff, setDeletingStaff] = useState<StaffMember | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  const openEditModal = (staff: StaffMember) => {
    setEditingStaff(staff);
    setEditFormData({
      username: staff.username,
      password: "",
      name: staff.name || "",
      branchId: staff.branchId || branches[0]?.id || "",
      role: staff.role,
    });
    setEditError(null);
  };

  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    setEditError(null);
    setEditLoading(true);

    try {
      const payload: any = {
        id: editingStaff.id,
        username: editFormData.username,
        name: editFormData.name,
        branchId: editFormData.branchId || null,
        role: editFormData.role,
      };

      if (editFormData.password.trim().length > 0) {
        payload.password = editFormData.password.trim();
      }

      const res = await fetch("/api/admin/staff", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setEditError(data.error || "Failed to update staff account.");
        setEditLoading(false);
        return;
      }

      setStaffList((prev) =>
        prev.map((s) => (s.id === editingStaff.id ? { ...s, ...data.staff } : s))
      );
      setSuccess(`Staff account '${data.staff.username}' updated successfully!`);
      setEditingStaff(null);
    } catch {
      setEditError("Network error. Please try again.");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteStaff = async () => {
    if (!deletingStaff) return;
    setDeleteError(null);
    setDeleteLoading(true);

    try {
      const res = await fetch(`/api/admin/staff?id=${encodeURIComponent(deletingStaff.id)}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        setDeleteError(data.error || "Failed to delete staff account.");
        setDeleteLoading(false);
        return;
      }

      setStaffList((prev) => prev.filter((s) => s.id !== deletingStaff.id));
      setSuccess(data.message || `Staff account '${deletingStaff.username}' deleted.`);
      setDeletingStaff(null);
    } catch {
      setDeleteError("Network error. Please try again.");
    } finally {
      setDeleteLoading(false);
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
        <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-200 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{success}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccess(null)}
            className="text-emerald-400 hover:text-emerald-200"
          >
            <X className="w-4 h-4" />
          </button>
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

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1">
                Role
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-gymRed"
              >
                <option value="STAFF">Floor Staff</option>
                <option value="SUPER_ADMIN">Super Administrator</option>
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
          <table className="w-full text-left text-xs min-w-[550px] sm:min-w-full">
            <thead className="bg-zinc-900/90 text-zinc-400 uppercase tracking-tight sm:tracking-wider border-b border-surface-border">
              <tr>
                <th className="p-2.5 sm:p-3.5 text-[10px] sm:text-xs font-semibold">Account</th>
                <th className="p-2.5 sm:p-3.5 text-[10px] sm:text-xs font-semibold">Role</th>
                <th className="p-2.5 sm:p-3.5 text-[10px] sm:text-xs font-semibold">Club</th>
                <th className="p-2.5 sm:p-3.5 text-[10px] sm:text-xs font-semibold text-center whitespace-nowrap">
                  <span className="hidden sm:inline">Weigh-Ins Verified</span>
                  <span className="sm:hidden">Verified</span>
                </th>
                <th className="p-2.5 sm:p-3.5 text-[10px] sm:text-xs font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {staffList.map((s) => {
                const isSelf = currentUserId && s.id === currentUserId;

                return (
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
                    <td className="p-2.5 sm:p-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(s)}
                          className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700 flex items-center gap-1 text-[11px] font-medium transition-colors"
                          title="Edit Staff Member"
                        >
                          <Pencil className="w-3.5 h-3.5 text-zinc-300" />
                          <span className="hidden sm:inline">Edit</span>
                        </button>

                        {isSelf ? (
                          <span className="px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-500 text-[10px] font-medium select-none">
                            You
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setDeletingStaff(s);
                              setDeleteError(null);
                            }}
                            className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-red-950/40 hover:bg-gymRed text-red-300 hover:text-white border border-red-800/40 hover:border-gymRed flex items-center gap-1 text-[11px] font-medium transition-colors"
                            title="Delete Staff Member"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Delete</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Staff Modal */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white uppercase flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-gymRed" />
                  Edit Staff Member
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Update account credentials, assigned club, or permissions for <span className="text-white font-semibold">@{editingStaff.username}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingStaff(null)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="p-3 rounded-xl bg-red-950/50 border border-gymRed/40 text-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-gymRed shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateStaff} className="space-y-3.5">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.username}
                    onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-gymRed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    placeholder="e.g. Tariq Staff"
                    className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-gymRed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1">
                    Assigned Club
                  </label>
                  <select
                    value={editFormData.branchId}
                    onChange={(e) => setEditFormData({ ...editFormData, branchId: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-gymRed"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1">
                    Role
                  </label>
                  <select
                    value={editFormData.role}
                    onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-gymRed"
                  >
                    <option value="STAFF">Floor Staff</option>
                    <option value="SUPER_ADMIN">Super Administrator</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1">
                  Change Password <span className="text-zinc-500 font-normal lowercase">(leave blank to keep current)</span>
                </label>
                <input
                  type="password"
                  value={editFormData.password}
                  onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                  placeholder="Enter new password only if changing"
                  className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-gymRed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  disabled={editLoading}
                  className="py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="py-2.5 px-5 rounded-xl bg-gymRed hover:bg-gymRed-hover text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-red-glow flex items-center gap-2 disabled:opacity-50"
                >
                  {editLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Staff Confirmation Modal */}
      {deletingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-950 border border-red-900/40 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-950/60 border border-red-800/60 flex items-center justify-center text-gymRed shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-white uppercase">Delete Staff Member?</h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Are you sure you want to permanently delete the account for{" "}
                  <span className="text-white font-bold">@{deletingStaff.username}</span>
                  {deletingStaff.name ? ` (${deletingStaff.name})` : ""}?
                </p>
                <div className="mt-3 p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 text-[11px] text-zinc-400 leading-normal">
                  <span className="font-semibold text-zinc-300">Safety Guarantee:</span> Any weigh-ins verified by this staff member ({deletingStaff.weighInsCount} weigh-ins) will remain safely intact in audit logs.
                </div>
              </div>
            </div>

            {deleteError && (
              <div className="p-3 rounded-xl bg-red-950/50 border border-gymRed/40 text-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-gymRed shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setDeletingStaff(null)}
                disabled={deleteLoading}
                className="py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteStaff}
                disabled={deleteLoading}
                className="py-2.5 px-5 rounded-xl bg-gymRed hover:bg-gymRed-hover text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-red-glow flex items-center gap-2 disabled:opacity-50"
              >
                {deleteLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Confirm Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
