"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

    try {
      const res = await fetch(`${apiUrl}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      Cookies.set("token", data.token, { expires: 30 });
      router.push("/");
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
    <div className="min-h-[80vh] flex items-center justify-center bg-transparent">
      <div className="w-full max-w-md p-8 bg-surface border border-border rounded-[24px] shadow-sm relative z-10 flex flex-col gap-6">
        
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-full border-2 border-accent flex items-center justify-center bg-accent/5">
              <div className="w-3 h-3 rounded-full bg-accent" />
            </div>
          </div>
          <h1 className="text-[22px] font-bold text-text mb-1 tracking-tight">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h1>
          <p className="text-[14px] text-text-dim font-medium">
            {isLogin ? "Sign in to view your athlete dashboard" : "Register to start tracking your performance"}
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-[13px] font-medium text-center animate-fadein">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-bold text-text uppercase tracking-wider">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-[14px] text-text focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all shadow-sm"
              placeholder="archer@example.com"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-bold text-text uppercase tracking-wider">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-[14px] text-text focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all shadow-sm"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-accent hover:bg-accent-hover text-white font-bold text-[14px] rounded-xl px-4 py-3.5 transition-colors disabled:opacity-50 shadow-sm flex items-center justify-center"
          >
            {loading ? "Processing..." : isLogin ? "Sign In" : "Register"}
          </button>
        </form>



        <div className="mt-2 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
            }}
            className="text-text-dim hover:text-accent font-semibold text-[13px] transition-colors"
          >
            {isLogin
              ? "Don't have an account? Register"
              : "Already have an account? Sign In"}
          </button>
        </div>

      </div>
    </div>
  );
}
