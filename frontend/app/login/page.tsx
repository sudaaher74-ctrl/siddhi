"use client";

import { useState } from "react";
import Cookies from "js-cookie";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

    try {
      const body = isLogin 
        ? { email, password }
        : { name, phone, email, password };

      const res = await fetch(`${apiUrl}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      Cookies.set("token", data.token, { expires: 30 });
      window.location.href = "/";
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-white">
      {/* LEFT SIDE: Splash Image (Hidden on Mobile) */}
      <div 
        className="hidden lg:flex w-1/2 bg-slate-900 relative overflow-hidden flex-col justify-end p-12"
      >
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 hover:scale-105"
          style={{ backgroundImage: 'url("/img/photos/sporty-bg.png")' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        <div className="relative z-10 max-w-md">
          <div className="w-[32px] h-[32px] rounded-full border-[3px] border-accent flex items-center justify-center mb-6 after:content-[''] after:w-[10px] after:h-[10px] after:rounded-full after:bg-accent" />
          <h1 className="text-4xl font-black text-white uppercase tracking-tight mb-4 leading-tight">
            Elevate Your <br />
            <span className="text-accent">Performance.</span>
          </h1>
          <p className="text-white/80 font-medium text-[15px] leading-relaxed">
            The elite platform for professional archers. Track every session, analyze your groupings, and get AI-powered insights to dominate the target.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE: Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-[420px] flex flex-col gap-8">
          
          <div className="flex flex-col">
            <div className="lg:hidden w-[28px] h-[28px] rounded-full border-[3px] border-accent flex items-center justify-center mb-6 after:content-[''] after:w-[8px] after:h-[8px] after:rounded-full after:bg-accent" />
            <h2 className="text-[28px] font-black text-slate-900 tracking-tight uppercase">
              {isLogin ? "Welcome Back" : "Join ArcherX"}
            </h2>
            <p className="text-[15px] text-slate-500 font-medium mt-1">
              {isLogin ? "Enter your details to access your dashboard." : "Create your athlete profile to get started."}
            </p>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-[13px] font-bold tracking-wide uppercase text-center animate-fadein">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {!isLogin && (
              <>
                <div className="flex flex-col gap-2">
                  <label className="text-[12px] font-bold text-slate-900 uppercase tracking-widest ml-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-transparent hover:border-slate-200 rounded-xl px-4 py-3.5 text-[15px] font-medium text-slate-900 focus:outline-none focus:border-accent focus:bg-white transition-all shadow-sm"
                    placeholder="Siddhi Deshmukh"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[12px] font-bold text-slate-900 uppercase tracking-widest ml-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-transparent hover:border-slate-200 rounded-xl px-4 py-3.5 text-[15px] font-medium text-slate-900 focus:outline-none focus:border-accent focus:bg-white transition-all shadow-sm"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </>
            )}

            <div className="flex flex-col gap-2">
              <label className="text-[12px] font-bold text-slate-900 uppercase tracking-widest ml-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border-2 border-transparent hover:border-slate-200 rounded-xl px-4 py-3.5 text-[15px] font-medium text-slate-900 focus:outline-none focus:border-accent focus:bg-white transition-all shadow-sm"
                placeholder="archer@example.com"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[12px] font-bold text-slate-900 uppercase tracking-widest ml-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border-2 border-transparent hover:border-slate-200 rounded-xl px-4 py-3.5 text-[15px] font-medium text-slate-900 focus:outline-none focus:border-accent focus:bg-white transition-all shadow-sm"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 bg-accent hover:bg-[#E0291D] text-white font-black text-[15px] uppercase tracking-widest rounded-xl px-4 py-4 transition-all disabled:opacity-50 shadow-[0_4px_14px_rgba(255,59,48,0.25)] hover:shadow-[0_6px_20px_rgba(255,59,48,0.3)] transform hover:-translate-y-0.5 flex items-center justify-center active:scale-[0.98]"
            >
              {loading ? "Processing..." : isLogin ? "Sign In" : "Register Profile"}
            </button>
          </form>

          <div className="flex justify-center mt-4">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
              }}
              className="text-slate-500 hover:text-accent font-bold text-[13px] uppercase tracking-wider transition-colors border-b-2 border-transparent hover:border-accent pb-0.5"
            >
              {isLogin
                ? "Create an athlete account"
                : "Already registered? Sign in"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
