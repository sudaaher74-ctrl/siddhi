"use client";

import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { Users, Crosshair, TrendingUp } from "lucide-react";

interface AdminStats {
  totalUsers: number;
  totalSessions: number;
  newUsersLastWeek: number;
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = Cookies.get("token");
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
        const res = await fetch(`${apiUrl}/api/admin/stats`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (res.ok) {
          const data = await res.json();
          setStats(data);
        } else {
          console.error("Failed to fetch admin stats");
        }
      } catch (error) {
        console.error("Error fetching admin stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Overview</h1>
        <p className="text-sm text-slate-500 mt-1">Platform statistics and activity</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-[14px] p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[12px] font-semibold text-slate-500 uppercase tracking-wider">Total Users</p>
            <p className="text-2xl font-bold text-slate-900 leading-none mt-1">{stats?.totalUsers || 0}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-[14px] p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
            <Crosshair className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[12px] font-semibold text-slate-500 uppercase tracking-wider">Total Sessions</p>
            <p className="text-2xl font-bold text-slate-900 leading-none mt-1">{stats?.totalSessions || 0}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-[14px] p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[12px] font-semibold text-slate-500 uppercase tracking-wider">New Users (7d)</p>
            <p className="text-2xl font-bold text-slate-900 leading-none mt-1">{stats?.newUsersLastWeek || 0}</p>
          </div>
        </div>
      </div>
      
      <div className="mt-8 bg-white border border-slate-200 rounded-[14px] shadow-sm p-6 overflow-hidden relative min-h-[200px] flex flex-col items-center justify-center text-center">
         <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
         <h2 className="text-xl font-bold text-slate-900 mb-2 relative z-10">Welcome to the Admin Dashboard</h2>
         <p className="text-sm text-slate-500 max-w-md relative z-10">Use the navigation menu to manage users, monitor platform health, and moderate content.</p>
      </div>
    </div>
  );
}
