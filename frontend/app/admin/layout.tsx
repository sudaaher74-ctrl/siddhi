"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, ArrowLeft, ShieldCheck } from "lucide-react";
import { useUser } from "@/hooks/useUser";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();
  const { loading } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!loading) {
      setIsAdmin(true);
    }
  }, [loading]);

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const navItems = [
    { label: "Overview", href: "/admin", icon: LayoutDashboard },
    { label: "Users", href: "/admin/users", icon: Users },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-accent/20 flex flex-col md:flex-row">
      
      {/* Sidebar */}
      <aside className="w-full md:w-[260px] md:h-screen md:sticky top-0 bg-white border-r border-slate-200 p-4 flex flex-col z-40 shadow-sm flex-shrink-0 hidden md:flex">
        <div className="flex items-center gap-2 px-2 py-4 mb-6">
          <div className="w-8 h-8 rounded-[10px] bg-accent text-white flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-[16px] tracking-tight text-slate-900 leading-none">Admin Panel</h1>
            <span className="text-[11px] text-slate-500 font-medium">Siddhi Jurnal</span>
          </div>
        </div>

        <nav className="flex flex-col gap-1.5 flex-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-[10px] font-semibold text-[13px] transition-all duration-200 ${
                  isActive 
                    ? 'bg-accent text-white shadow-sm' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'opacity-100' : 'opacity-70'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-4 border-t border-slate-200">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-[10px] font-semibold text-[13px] text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4 opacity-70" />
            Back to App
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen relative max-w-full overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
           <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[10px] bg-accent text-white flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-[16px] tracking-tight text-slate-900 leading-none">Admin Panel</h1>
            </div>
          </div>
          <Link href="/" className="text-[12px] font-semibold text-accent flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> App
          </Link>
        </div>

        {/* Mobile Nav */}
        <div className="md:hidden flex bg-white border-b border-slate-200 px-2 sticky top-[65px] z-40 shadow-sm">
          {navItems.map((item) => {
             const isActive = pathname === item.href;
             return (
               <Link
                key={item.label}
                href={item.href}
                className={`flex-1 py-3 text-center text-[13px] font-semibold border-b-2 transition-colors ${
                  isActive ? 'border-accent text-accent' : 'border-transparent text-slate-500'
                }`}
               >
                 {item.label}
               </Link>
             )
          })}
        </div>

        {/* Content Padding */}
        <div className="p-4 md:p-8 flex-1 w-full max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
