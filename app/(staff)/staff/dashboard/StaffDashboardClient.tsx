"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import { QrCode, Search, LogOut, MapPin, Eye, EyeOff, ArrowRight, UserCheck, Loader2, ShieldCheck, ChevronLeft, ChevronRight} from "lucide-react";

interface Branch {
  id: string;
  name: string;
  label: string;
}

interface UserSummary {
  id: string;
  name: string;
  maskedEmiratesId: string;
  rawEmiratesId: string;
  mobile: string;
  email: string;
  gender: string;
  branchLabel: string;
  branchId: string;
  status: "REGISTERED" | "ACTIVE" | "COMPLETED" | "DISQUALIFIED";
  day1Weight: number | null;
  finalWeight: number | null;
  daysRemaining: { daysLeft: number; isExpired: boolean; label: string } | null;
}

interface StaffDashboardClientProps {
  staffName: string;
  branchLabel: string;
  role: string;
  branches: Branch[];
}

export default function StaffDashboardClient({
  staffName,
  branchLabel,
  role,
  branches,
}: StaffDashboardClientProps) {
  const router = useRouter();

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [branchFilter, setBranchFilter] = useState("ALL");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Data & UI states
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});

  // Fetch users with pagination and filters
  const fetchUsers = useCallback(
    async (page = 1, query = "", status = "ALL", branch = "ALL", limit = 10) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          q: query,
          status,
          branchId: branch,
        });

        const res = await fetch(`/api/staff/search?${params.toString()}`);
        const data = await res.json();

        if (res.ok && data.users) {
          setUsers(data.users);
          setTotalCount(data.total || 0);
          setTotalPages(data.totalPages || 1);
          setCurrentPage(data.page || 1);
        }
      } catch (e) {
        console.error("Failed to load participants:", e);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Initial fetch
  useEffect(() => {
    fetchUsers(currentPage, searchQuery, statusFilter, branchFilter, pageSize);
  }, [fetchUsers, currentPage, statusFilter, branchFilter, pageSize]);

  // Handle Search Submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers(1, searchQuery, statusFilter, branchFilter, pageSize);
  };

  // Reset to page 1 on filter changes
  const handleStatusChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    setCurrentPage(1);
  };

  const handleBranchChange = (newBranch: string) => {
    setBranchFilter(newBranch);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const handleLogout = async () => {
    await fetch("/api/staff/logout", { method: "POST" });
    router.push("/staff/login");
    router.refresh();
  };

  const toggleReveal = (userId: string) => {
    setRevealedIds((prev) => ({ ...prev, [userId]: !prev[userId] }));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "REGISTERED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/30 whitespace-nowrap">
            Registered (Needs Day-1)
          </span>
        );
      case "ACTIVE":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse whitespace-nowrap">
            Active in Challenge
          </span>
        );
      case "COMPLETED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
            Completed 🏆
          </span>
        );
      case "DISQUALIFIED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/30 whitespace-nowrap">
            Disqualified
          </span>
        );
      default:
        return null;
    }
  };

  // Pagination bounds calculation
  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between pb-12">
      {/* Top Staff App Header */}
      <header className="border-b border-surface-border bg-surface/90 backdrop-blur sticky top-0 z-30 px-4 sm:px-6 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo size="sm" showText={false} />
            <div className="hidden sm:flex flex-col">
              <span className="font-black text-sm uppercase tracking-wider text-white">CLUB FLOOR <span className="text-gymRed">CHECK-IN</span></span>
              <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold">Participant Registry</span>
            </div>
            {role === "SUPER_ADMIN" && (
              <Link
                href="/admin/dashboard"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gymRed/15 border border-gymRed/40 text-gymRed hover:bg-gymRed hover:text-white text-[10px] font-bold uppercase tracking-wider transition-all ml-1"
                title="Open Admin Console"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin Console</span>
              </Link>
            )}
          </div>

          <div className="flex items-center gap-3 text-right">
            <div>
              <div className="text-xs font-bold text-white leading-tight">{staffName}</div>
              <div className="text-[10px] text-zinc-400 flex items-center justify-end gap-1">
                <MapPin className="w-2.5 h-2.5 text-gymRed shrink-0" />
                <span className="truncate max-w-[120px] sm:max-w-none">{branchLabel}</span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-2 rounded-xl bg-surface-card border border-surface-border hover:bg-surface-hover text-zinc-400 hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 pt-6 flex-1 space-y-5">
        {/* Quick QR Scanner & Action Header */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface-card p-4 rounded-2xl border border-surface-border shadow-sm">
          <div>
            <h1 className="text-lg sm:text-xl font-black uppercase text-white tracking-tight">
              PARTICIPANT DASHBOARD
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Search by name, Emirates ID, mobile, or scan participant pass to log weigh-ins.
            </p>
          </div>

          <Link
            href="/staff/scan"
            className="py-3 px-5 rounded-xl bg-gradient-to-r from-gymRed to-red-600 hover:from-red-600 hover:to-gymRed text-white font-bold text-xs tracking-wider uppercase shadow-red-glow flex items-center justify-center gap-2.5 transition-all transform active:scale-98 shrink-0"
          >
            <QrCode className="w-4 h-4 text-white" />
            <span>Scan QR Pass</span>
          </Link>
        </div>

        {/* Filter & Search Bar */}
        <div className="gym-card rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            {/* Search Input */}
            <form
              onSubmit={handleSearchSubmit}
              className="sm:col-span-6 md:col-span-6 relative"
            >
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Name, Emirates ID, Mobile, or User ID..."
                className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl pl-10 pr-20 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-gymRed transition-all"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold transition-colors"
              >
                Search
              </button>
            </form>

            {/* Status Dropdown */}
            <div className="sm:col-span-3 md:col-span-3">
              <select
                value={statusFilter}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-gymRed"
              >
                <option value="ALL">All Statuses</option>
                <option value="REGISTERED">Registered (Needs Day-1)</option>
                <option value="ACTIVE">Active in Challenge</option>
                <option value="COMPLETED">Completed</option>
                <option value="DISQUALIFIED">Disqualified</option>
              </select>
            </div>

            {/* Branch Dropdown */}
            <div className="sm:col-span-3 md:col-span-3">
              <select
                value={branchFilter}
                onChange={(e) => handleBranchChange(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-gymRed"
              >
                <option value="ALL">All Clubs</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Table Summary Bar */}
          <div className="flex flex-wrap items-center justify-between text-xs text-zinc-400 pt-1 border-t border-zinc-800/80 gap-2">
            <div className="flex items-center gap-2">
              <span>
                Showing <strong className="text-white">{startItem}</strong>-
                <strong className="text-white">{endItem}</strong> of{" "}
                <strong className="text-white">{totalCount}</strong> participants
              </span>
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-gymRed ml-1" />}
            </div>

            {/* Rows Per Page Selector */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[11px] text-zinc-400">Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-gymRed"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>

        {/* Mobile Horizontal Scroll Hint */}
        <div className="md:hidden flex items-center justify-between text-[11px] text-zinc-400 px-1">
          <span className="flex items-center gap-1 text-zinc-400">
            <span>←</span>
            <span>Scroll table horizontally to view all columns</span>
            <span>→</span>
          </span>
          <span className="text-[10px] text-zinc-500 font-mono">
            {users.length} shown
          </span>
        </div>

        {/* ========================================================================= */}
        {/* RESPONSIVE TABLE VIEW (Visible on both Mobile and Desktop)                */}
        {/* ========================================================================= */}
        <div className="gym-card rounded-2xl overflow-hidden border-surface-border shadow-xl">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-left text-xs min-w-[750px]">
              <thead className="bg-zinc-900/95 text-zinc-400 uppercase tracking-wider border-b border-surface-border">
                <tr>
                  <th className="p-3 sm:p-3.5 font-semibold">Participant</th>
                  <th className="p-3 sm:p-3.5 font-semibold">Emirates ID</th>
                  <th className="p-3 sm:p-3.5 font-semibold">Mobile & Email</th>
                  <th className="p-3 sm:p-3.5 font-semibold">Club</th>
                  <th className="p-3 sm:p-3.5 font-semibold">Status</th>
                  <th className="p-3 sm:p-3.5 font-semibold text-center">Day-1 Weight</th>
                  <th className="p-3 sm:p-3.5 font-semibold text-center">Final Weight</th>
                  <th className="p-3 sm:p-3.5 font-semibold">Window</th>
                  <th className="p-3 sm:p-3.5 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80">
                {users.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={9} className="p-10 text-center text-zinc-500 text-xs">
                      <UserCheck className="w-8 h-8 mx-auto mb-2 text-zinc-600" />
                      <p>No participants found matching current filters.</p>
                      <p className="text-[10px] text-zinc-400 mt-1">
                        Try searching by a different name, mobile, or Emirates ID.
                      </p>
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const isRevealed = revealedIds[u.id];
                    return (
                      <tr
                        key={u.id}
                        className="hover:bg-surface-hover/50 transition-colors group"
                      >
                        {/* Name & ID */}
                        <td className="p-3 sm:p-3.5">
                          <Link
                            href={`/staff/checkin/${u.id}`}
                            className="font-bold text-white hover:text-gymRed transition-colors block text-sm"
                          >
                            {u.name}
                          </Link>
                          <span className="font-mono text-[10px] text-zinc-400">
                            ID: {u.id}
                          </span>
                        </td>

                        {/* Emirates ID */}
                        <td className="p-3 sm:p-3.5 font-mono whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-zinc-300">
                            <span>{isRevealed ? u.rawEmiratesId : u.maskedEmiratesId}</span>
                            <button
                              type="button"
                              onClick={() => toggleReveal(u.id)}
                              className="text-zinc-400 hover:text-white transition-colors p-1"
                              title={isRevealed ? "Hide Emirates ID" : "Reveal Emirates ID"}
                            >
                              {isRevealed ? (
                                <EyeOff className="w-3.5 h-3.5" />
                              ) : (
                                <Eye className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="p-3 sm:p-3.5 text-zinc-300">
                          <div className="font-mono">{u.mobile}</div>
                          <div className="text-[10px] text-zinc-400 truncate max-w-[140px]">
                            {u.email}
                          </div>
                        </td>

                        {/* Branch */}
                        <td className="p-3 sm:p-3.5 font-medium text-zinc-300 whitespace-nowrap">
                          {u.branchLabel}
                        </td>

                        {/* Status */}
                        <td className="p-3 sm:p-3.5 whitespace-nowrap">{getStatusBadge(u.status)}</td>

                        {/* Day-1 Weight */}
                        <td className="p-3 sm:p-3.5 text-center font-mono font-semibold text-zinc-200">
                          {u.day1Weight !== null ? `${Number(u.day1Weight).toFixed(3)} kg` : "—"}
                        </td>

                        {/* Final Weight */}
                        <td className="p-3 sm:p-3.5 text-center font-mono font-semibold text-zinc-200">
                          {u.finalWeight !== null ? `${Number(u.finalWeight).toFixed(3)} kg` : "—"}
                        </td>

                        {/* Window / Days Remaining */}
                        <td className="p-3 sm:p-3.5 whitespace-nowrap">
                          {u.daysRemaining ? (
                            <span
                              className={`text-[11px] font-semibold ${
                                u.daysRemaining.isExpired
                                  ? "text-red-400"
                                  : "text-amber-400"
                              }`}
                            >
                              {u.daysRemaining.label}
                            </span>
                          ) : (
                            <span className="text-zinc-400 text-[11px]">Not started</span>
                          )}
                        </td>

                        {/* Action Link Button */}
                        <td className="p-3 sm:p-3.5 text-right whitespace-nowrap">
                          <Link
                            href={`/staff/checkin/${u.id}`}
                            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-sm ${
                              u.status === "REGISTERED"
                                ? "bg-gymRed hover:bg-gymRed-hover text-white"
                                : u.status === "ACTIVE"
                                ? "bg-gymRed hover:bg-gymRed-hover text-white"
                                : "bg-surface-card border border-surface-border hover:bg-surface-hover text-zinc-300"
                            }`}
                          >
                            <span>
                              {u.status === "REGISTERED"
                                ? "Log Day-1"
                                : u.status === "ACTIVE"
                                ? "Log Final"
                                : "View Summary"}
                            </span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RESPONSIVE PAGINATION BAR (Desktop & Mobile)                              */}
        {/* ========================================================================= */}
        <div className="gym-card rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-surface-border shadow-sm">
          {/* Status info */}
          <div className="text-xs text-zinc-400 text-center sm:text-left">
            Page <strong className="text-white">{currentPage}</strong> of{" "}
            <strong className="text-white">{totalPages}</strong> ({totalCount} total
            records)
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-1.5">
            {/* First / Prev */}
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1 || loading}
              className="py-2 px-3 rounded-xl bg-surface-card border border-surface-border hover:bg-surface-hover text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>

            {/* Page Pill Buttons */}
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => {
                  // Show current, +/- 1, first, last
                  return (
                    p === 1 ||
                    p === totalPages ||
                    Math.abs(p - currentPage) <= 1
                  );
                })
                .map((p, idx, arr) => {
                  const prev = arr[idx - 1];
                  const showEllipsis = prev && p - prev > 1;

                  return (
                    <div key={p} className="flex items-center gap-1">
                      {showEllipsis && (
                        <span className="text-zinc-500 text-xs px-1">...</span>
                      )}
                      <button
                        type="button"
                        onClick={() => setCurrentPage(p)}
                        className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                          currentPage === p
                            ? "bg-gymRed text-white shadow-sm"
                            : "bg-surface-card border border-surface-border hover:bg-surface-hover text-zinc-300"
                        }`}
                      >
                        {p}
                      </button>
                    </div>
                  );
                })}
            </div>

            {/* Next */}
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages || loading}
              className="py-2 px-3 rounded-xl bg-surface-card border border-surface-border hover:bg-surface-hover text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </main>

      <footer className="text-center text-[11px] text-zinc-400 mt-6">
        Staff Floor Management Console · Optimized for Mobile & Desktop Floor Access
      </footer>
    </div>
  );
}
