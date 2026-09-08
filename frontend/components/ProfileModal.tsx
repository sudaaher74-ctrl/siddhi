"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  User,
  Mail,
  Phone,
  Calendar,
  ShieldCheck,
  Target,
  Award,
  TrendingUp,
  Crosshair,
  Wrench,
  Edit3,
  Check,
  LogOut,
  ChevronRight,
  Flame,
} from "lucide-react";
import Link from "next/link";
import { useUser } from "@/hooks/useUser";
import { apiFetch, apiPut } from "@/lib/api";
import { Session, Equipment } from "@/lib/data";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user, refreshUser } = useUser();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Stats state
  const [sessions, setSessions] = useState<Session[]>([]);
  const [equipmentCount, setEquipmentCount] = useState<number>(0);
  const [loadingStats, setLoadingStats] = useState(true);

  // Sync form data with user when user loads or modal opens
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        phone: user.phone || "",
      });
    }
  }, [user, isOpen]);

  // Load user's sessions & equipment stats
  useEffect(() => {
    if (!isOpen) return;

    const loadAthleteData = async () => {
      try {
        setLoadingStats(true);
        const [sessData, eqData] = await Promise.allSettled([
          apiFetch<Session[]>("/api/sessions"),
          apiFetch<Equipment[]>("/api/equipment"),
        ]);

        if (sessData.status === "fulfilled" && Array.isArray(sessData.value)) {
          setSessions(sessData.value);
        }
        if (eqData.status === "fulfilled" && Array.isArray(eqData.value)) {
          setEquipmentCount(eqData.value.length);
        }
      } catch (err) {
        console.error("Error loading athlete profile stats:", err);
      } finally {
        setLoadingStats(false);
      }
    };

    loadAthleteData();
  }, [isOpen]);

  if (!isOpen) return null;

  const athleteName = user?.name || "Athlete";
  const initials = athleteName
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase() || "AT";

  // Compute career metrics
  const totalArrows = sessions.reduce((sum, s) => sum + (Number(s.arrows) || 0), 0);
  const totalScore = sessions.reduce((sum, s) => sum + (Number(s.score) || 0), 0);
  const totalTens = sessions.reduce((sum, s) => sum + (Number(s.tens) || 0), 0);
  const overallAvg = totalArrows > 0 ? (totalScore / totalArrows).toFixed(2) : "0.00";

  let personalBest = 0;
  sessions.forEach((s) => {
    const sc = Number(s.score) || 0;
    if (sc > personalBest) personalBest = sc;
  });

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "September 2026";

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMsg("Name cannot be empty");
      return;
    }

    try {
      setIsSaving(true);
      setErrorMsg("");
      await apiPut("/api/auth/profile", {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
      });
      await refreshUser();
      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header Bar */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-accent/10 text-accent">
              <User className="w-4 h-4" />
            </span>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              Athlete Profile & Data
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 sm:p-7 overflow-y-auto flex-1 flex flex-col gap-6">
          {/* Identity Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 via-white to-amber-500/5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-target-red via-[#b71c1c] to-amber-600 text-white font-black text-2xl flex items-center justify-center shadow-md flex-shrink-0 border-2 border-white">
                {initials}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-black text-slate-900 leading-tight">
                    {athleteName}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-md bg-accent/10 text-accent text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1">
                    {user?.role === "admin" && <ShieldCheck className="w-3 h-3 text-accent" />}
                    {user?.role === "admin" ? "Admin" : "Archer"}
                  </span>
                  {user?.hasGoogleAuth && (
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-bold">
                      Google Account
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{user?.email || "No email"}</span>
                </p>
                <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400 mt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Joined {memberSince}
                  </span>
                  {user?.phone && (
                    <span className="flex items-center gap-1 text-slate-600 font-medium">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {user.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="py-2 px-3.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer self-stretch sm:self-auto justify-center"
            >
              <Edit3 className="w-3.5 h-3.5 text-slate-500" />
              <span>{isEditing ? "Cancel Edit" : "Edit Profile"}</span>
            </button>
          </div>

          {/* Success / Error Messages */}
          {saveSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Profile details updated successfully!</span>
            </div>
          )}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold animate-in fade-in">
              {errorMsg}
            </div>
          )}

          {/* Edit Form (if active) */}
          {isEditing && (
            <form
              onSubmit={handleSaveProfile}
              className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-4 animate-in fade-in duration-200"
            >
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
                Edit Personal Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                    placeholder="e.g. Sudarshan Aher"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                    placeholder="e.g. +91 9876543210"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="py-2 px-4 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="py-2 px-5 rounded-xl bg-accent text-white text-xs font-bold hover:bg-accent/90 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          )}

          {/* Archery Performance Data Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                Your Archery Performance & Data
              </h4>
              <span className="text-[11px] text-slate-400 font-medium">
                {loadingStats ? "Calculating..." : `${sessions.length} recorded sessions`}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {/* Total Sessions */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Sessions</span>
                  <Target className="w-3.5 h-3.5 text-blue-500" />
                </div>
                <span className="text-2xl font-black text-slate-900 tracking-tight">
                  {sessions.length}
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5">Completed practices</span>
              </div>

              {/* Total Arrows */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Arrows</span>
                  <Crosshair className="w-3.5 h-3.5 text-indigo-500" />
                </div>
                <span className="text-2xl font-black text-slate-900 tracking-tight">
                  {totalArrows}
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5">Shot at targets</span>
              </div>

              {/* Personal Best */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Best Score</span>
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                </div>
                <span className="text-2xl font-black text-amber-600 tracking-tight">
                  {personalBest || "-"}
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5">out of 360 max</span>
              </div>

              {/* Career Average */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Avg / Arrow</span>
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                <span className="text-2xl font-black text-emerald-600 tracking-tight">
                  {overallAvg}
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5">Career average</span>
              </div>

              {/* 10s Hit */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">10s Hit</span>
                  <Flame className="w-3.5 h-3.5 text-orange-500" />
                </div>
                <span className="text-2xl font-black text-orange-600 tracking-tight">
                  {totalTens}
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5">Bullseye golds</span>
              </div>

              {/* Equipment Items */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Equipment</span>
                  <Wrench className="w-3.5 h-3.5 text-purple-500" />
                </div>
                <span className="text-2xl font-black text-slate-900 tracking-tight">
                  {equipmentCount}
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5">Configured setups</span>
              </div>
            </div>
          </div>

          {/* Quick Shortcuts Navigation */}
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-2.5">
              Quick Shortcuts
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <Link
                href="/scorecard"
                onClick={onClose}
                className="p-3 rounded-xl border border-slate-200 hover:border-accent hover:bg-accent/5 flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <Award className="w-4 h-4 text-accent" />
                  <span className="text-xs font-bold text-slate-800">Official Scorecard</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                href="/monthly-log"
                onClick={onClose}
                className="p-3 rounded-xl border border-slate-200 hover:border-accent hover:bg-accent/5 flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <Calendar className="w-4 h-4 text-accent" />
                  <span className="text-xs font-bold text-slate-800">Monthly Training Journal</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                href="/equipment"
                onClick={onClose}
                className="p-3 rounded-xl border border-slate-200 hover:border-accent hover:bg-accent/5 flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <Wrench className="w-4 h-4 text-accent" />
                  <span className="text-xs font-bold text-slate-800">Bows & Equipment</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                href="/goals"
                onClick={onClose}
                className="p-3 rounded-xl border border-slate-200 hover:border-accent hover:bg-accent/5 flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <Target className="w-4 h-4 text-accent" />
                  <span className="text-xs font-bold text-slate-800">Goals & Targets</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-shrink-0">
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-2 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
