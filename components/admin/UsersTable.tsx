"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Eye,
  EyeOff,
  Camera,
  PenLine,
} from "lucide-react";
import Link from "next/link";
import PhotoProofModal from "@/components/staff/PhotoProofModal";
import { formatDateOnlyDubai } from "@/lib/dayjs";

interface Branch {
  id: string;
  name: string;
  label: string;
}

interface Participant {
  id: string;
  name: string;
  rawEmiratesId: string;
  maskedEmiratesId: string;
  mobile: string;
  email: string;
  gender: string;
  dob?: string | null;
  branchId: string;
  branchLabel: string;
  status: "REGISTERED" | "ACTIVE" | "COMPLETED" | "DISQUALIFIED";
  day1Date: string | null;
  day1Weight: number | null;
  day1PhotoUrl?: string | null;
  day1SignatureUrl?: string | null;
  finalDate: string | null;
  finalWeight: number | null;
  finalPhotoUrl?: string | null;
  finalSignatureUrl?: string | null;
  kgLost: number | null;
  deadlineDate: string | null;
  daysRemaining: { daysLeft: number; isExpired: boolean; label: string } | null;
  createdAt: string;
}

interface UsersTableProps {
  initialUsers: Participant[];
  branches: Branch[];
}

export default function UsersTable({ initialUsers, branches }: UsersTableProps) {
  const [users, setUsers] = useState<Participant[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [genderFilter, setGenderFilter] = useState("ALL");
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});
  const [proofModal, setProofModal] = useState<{
    isOpen: boolean;
    url: string | null;
    title: string;
    subtitle?: string;
  }>({
    isOpen: false,
    url: null,
    title: "",
  });

  const toggleReveal = (userId: string) => {
    setRevealedIds((prev) => ({ ...prev, [userId]: !prev[userId] }));
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        search === "" ||
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.rawEmiratesId.toLowerCase().includes(search.toLowerCase()) ||
        u.mobile.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.id.toLowerCase().includes(search.toLowerCase());

      const matchesBranch = branchFilter === "ALL" || u.branchId === branchFilter;
      const matchesStatus = statusFilter === "ALL" || u.status === statusFilter;
      const matchesGender = genderFilter === "ALL" || u.gender === genderFilter;

      return matchesSearch && matchesBranch && matchesStatus && matchesGender;
    });
  }, [users, search, branchFilter, statusFilter, genderFilter]);

  const getStatusPill = (status: string) => {
    switch (status) {
      case "REGISTERED":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/30">
            Registered
          </span>
        );
      case "ACTIVE":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse">
            Active
          </span>
        );
      case "COMPLETED":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            Completed
          </span>
        );
      case "DISQUALIFIED":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/30">
            Disqualified
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Controls */}
      <div className="gym-card rounded-2xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Live Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Name, Emirates ID, Mobile, or User ID..."
              className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-gymRed"
            />
          </div>

          {/* Branch Dropdown */}
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-gymRed"
          >
            <option value="ALL">All Clubs ({users.length})</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.label}
              </option>
            ))}
          </select>

          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-gymRed"
          >
            <option value="ALL">All Statuses</option>
            <option value="REGISTERED">Registered (Pending Day-1)</option>
            <option value="ACTIVE">Active in Challenge</option>
            <option value="COMPLETED">Completed Finishers</option>
            <option value="DISQUALIFIED">Disqualified</option>
          </select>

          {/* Gender Dropdown */}
          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
            className="bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-gymRed"
          >
            <option value="ALL">All Genders</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </select>
        </div>

        <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
          <span>
            Showing <strong className="text-white">{filteredUsers.length}</strong> of {users.length} participants
          </span>
          <span className="text-[10px] text-zinc-500">
            Emirates IDs masked by default · Click 👁 to reveal
          </span>
        </div>
      </div>

      {/* Participants Table */}
      <div className="gym-card rounded-2xl overflow-hidden border-surface-border shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-900/90 text-zinc-400 uppercase tracking-wider border-b border-surface-border">
              <tr>
                <th className="p-3.5 font-semibold">Participant</th>
                <th className="p-3.5 font-semibold">Emirates ID</th>
                <th className="p-3.5 font-semibold">Contact</th>
                <th className="p-3.5 font-semibold">Club</th>
                <th className="p-3.5 font-semibold">Status</th>
                <th className="p-3.5 font-semibold text-center">Day-1</th>
                <th className="p-3.5 font-semibold text-center">Final</th>
                <th className="p-3.5 font-semibold text-center">Lost</th>
                <th className="p-3.5 font-semibold">Window</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-zinc-500 text-xs">
                    No participants found matching current filters.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isRevealed = revealedIds[u.id];
                  return (
                    <tr key={u.id} className="hover:bg-surface-hover/50 transition-colors">
                      {/* Name & ID */}
                      <td className="p-3.5">
                        <Link
                          href={`/staff/checkin/${u.id}`}
                          className="font-bold text-white hover:text-gymRed transition-colors"
                        >
                          {u.name}
                        </Link>
                        <div className="font-mono text-[10px] text-zinc-500">ID: {u.id}</div>
                        {u.dob && (
                          <div className="text-[10px] text-zinc-400">DOB: {formatDateOnlyDubai(u.dob)}</div>
                        )}
                      </td>

                      {/* Emirates ID Masked / Revealed */}
                      <td className="p-3.5 font-mono">
                        <div className="flex items-center gap-1.5 text-zinc-300">
                          <span>{isRevealed ? u.rawEmiratesId : u.maskedEmiratesId}</span>
                          <button
                            type="button"
                            onClick={() => toggleReveal(u.id)}
                            className="text-zinc-500 hover:text-white transition-colors"
                            title={isRevealed ? "Hide" : "Reveal full Emirates ID"}
                          >
                            {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="p-3.5 text-zinc-300">
                        <div>{u.mobile}</div>
                        <div className="text-[10px] text-zinc-500">{u.email}</div>
                      </td>

                      {/* Branch */}
                      <td className="p-3.5 font-medium text-zinc-300 whitespace-nowrap">
                        {u.branchLabel}
                      </td>

                      {/* Status */}
                      <td className="p-3.5 whitespace-nowrap">{getStatusPill(u.status)}</td>

                      {/* Day 1 Weight */}
                      <td className="p-3.5 text-center font-mono text-zinc-200">
                        {u.day1Weight !== null ? (
                          <div className="flex flex-col items-center gap-1">
                            <span className="font-semibold">{Number(u.day1Weight).toFixed(3)} kg</span>
                            <div className="flex items-center gap-1">
                              {u.day1PhotoUrl && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setProofModal({
                                      isOpen: true,
                                      url: u.day1PhotoUrl || null,
                                      title: `${u.name} · Day-1 Scale Photo`,
                                      subtitle: `Initial Weight: ${Number(u.day1Weight).toFixed(3)} kg`,
                                    })
                                  }
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-sans font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors border border-zinc-700/60"
                                  title="View Day-1 Scale Photo"
                                >
                                  <Camera className="w-3 h-3 text-gymRed" />
                                  <span>Scale</span>
                                </button>
                              )}
                              {u.day1SignatureUrl && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setProofModal({
                                      isOpen: true,
                                      url: u.day1SignatureUrl || null,
                                      title: `${u.name} · Day-1 Digital Signature`,
                                      subtitle: "Participant Sign-off at Day-1 Weigh-in",
                                    })
                                  }
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-sans font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors border border-zinc-700/60"
                                  title="View Day-1 Digital Signature"
                                >
                                  <PenLine className="w-3 h-3 text-amber-400" />
                                  <span>Sign</span>
                                </button>
                              )}
                            </div>
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>

                      {/* Final Weight */}
                      <td className="p-3.5 text-center font-mono text-zinc-200">
                        {u.finalWeight !== null ? (
                          <div className="flex flex-col items-center gap-1">
                            <span className="font-semibold">{Number(u.finalWeight).toFixed(3)} kg</span>
                            <div className="flex items-center gap-1">
                              {u.finalPhotoUrl && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setProofModal({
                                      isOpen: true,
                                      url: u.finalPhotoUrl || null,
                                      title: `${u.name} · Final Scale Photo`,
                                      subtitle: `Final Weight: ${Number(u.finalWeight).toFixed(3)} kg`,
                                    })
                                  }
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-sans font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors border border-zinc-700/60"
                                  title="View Final Scale Photo Photo"
                                >
                                  <Camera className="w-3 h-3 text-gymRed" />
                                  <span>Scale</span>
                                </button>
                              )}
                              {u.finalSignatureUrl && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setProofModal({
                                      isOpen: true,
                                      url: u.finalSignatureUrl || null,
                                      title: `${u.name} · Digital Signature`,
                                      subtitle: "Participant Sign-off at Final Weigh-in",
                                    })
                                  }
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-sans font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors border border-zinc-700/60"
                                  title="View Digital Signature"
                                >
                                  <PenLine className="w-3 h-3 text-amber-400" />
                                  <span>Sign</span>
                                </button>
                              )}
                            </div>
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>

                      {/* Kg Lost */}
                      <td className="p-3.5 text-center font-mono font-bold whitespace-nowrap">
                        {u.kgLost !== null ? (
                          <span className={u.kgLost > 0 ? "text-gymRed font-black" : "text-zinc-400"}>
                            {u.kgLost > 0 ? `-${Number(u.kgLost).toFixed(3)} kg` : `${Number(u.kgLost).toFixed(3)} kg`}
                          </span>
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )}
                      </td>

                      {/* Days Remaining / Deadline */}
                      <td className="p-3.5 whitespace-nowrap">
                        {u.daysRemaining ? (
                          <span
                            className={`text-[11px] font-semibold ${
                              u.daysRemaining.isExpired ? "text-red-400" : "text-amber-400"
                            }`}
                          >
                            {u.daysRemaining.label}
                          </span>
                        ) : (
                          <span className="text-zinc-500 text-[11px]">Not started</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Proof Lightbox Modal */}
      <PhotoProofModal
        isOpen={proofModal.isOpen}
        onClose={() => setProofModal((prev) => ({ ...prev, isOpen: false }))}
        imageUrl={proofModal.url}
        title={proofModal.title}
        subtitle={proofModal.subtitle}
      />
    </div>
  );
}
