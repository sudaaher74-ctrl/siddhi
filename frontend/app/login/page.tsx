"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Script from "next/script";
import { apiPost } from "@/lib/api";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: "standard" | "icon";
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              text?: "signin_with" | "signup_with" | "continue_with" | "signin";
              shape?: "rectangular" | "pill" | "circle" | "square";
              width?: string | number;
            }
          ) => void;
          prompt: () => void;
        };
      };
    };
  }
}

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleScriptLoaded, setGoogleScriptLoaded] = useState(false);

  const googleButtonRef = useRef<HTMLDivElement>(null);
  const googleClientId = (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "")
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/\.+$/, "");

  const handleGoogleCredentialResponse = useCallback(async (response: { credential: string }) => {
    if (!response?.credential) {
      setError("Google authentication did not return a valid credential");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await apiPost("/api/auth/google", { credential: response.credential });
      window.location.href = "/";
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Google authentication failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize and render Google Identity button when script is ready
  useEffect(() => {
    if (!googleScriptLoaded || !window.google || !googleClientId) return;

    try {
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCredentialResponse,
      });

      if (googleButtonRef.current) {
        googleButtonRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: "outline",
          size: "large",
          text: isLogin ? "signin_with" : "signup_with",
          shape: "rectangular",
          width: "360",
        });
      }
    } catch (err) {
      console.warn("Could not initialize Google Identity Services:", err);
    }
  }, [googleScriptLoaded, googleClientId, isLogin, handleGoogleCredentialResponse]);

  const handleCustomGoogleClick = () => {
    if (!googleClientId) {
      setError(
        "Google Client ID is not configured. Please set NEXT_PUBLIC_GOOGLE_CLIENT_ID in frontend/.env.local and GOOGLE_CLIENT_ID in backend/.env."
      );
      return;
    }

    if (window.google?.accounts?.id) {
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCredentialResponse,
      });
      window.google.accounts.id.prompt();
    } else {
      setError("Google Sign-In is still loading. Please wait a moment or try again.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";

    try {
      const body = isLogin
        ? { email, password }
        : { name, phone, email, password };

      // The route handler stores the token in an httpOnly cookie; the token
      // itself never reaches page scripts.
      await apiPost(endpoint, body);
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
    <>
      {/* Load Google Identity Services script */}
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setGoogleScriptLoaded(true)}
      />

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
          <div className="w-full max-w-[420px] flex flex-col gap-6 sm:gap-7">
            
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
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-[12px] font-semibold text-center animate-fadein leading-snug">
                {error}
              </div>
            )}

            {/* GOOGLE OAUTH SIGN-IN BUTTON */}
            <div className="flex flex-col gap-2">
              {googleClientId && googleScriptLoaded ? (
                <div className="w-full flex justify-center min-h-[44px]">
                  <div ref={googleButtonRef} className="w-full flex justify-center" />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleCustomGoogleClick}
                  disabled={loading}
                  className="w-full h-12 flex items-center justify-center gap-3 bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-slate-300 text-slate-700 font-bold text-[14px] rounded-xl px-4 transition-all shadow-sm active:scale-[0.99]"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>{isLogin ? "Sign in with Google" : "Sign up with Google"}</span>
                </button>
              )}
            </div>

            {/* DIVIDER */}
            <div className="flex items-center my-1">
              <div className="flex-1 border-t border-slate-200" />
              <span className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Or with email
              </span>
              <div className="flex-1 border-t border-slate-200" />
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {!isLogin && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-slate-900 uppercase tracking-widest ml-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-transparent hover:border-slate-200 rounded-xl px-4 py-3 text-[14px] font-medium text-slate-900 focus:outline-none focus:border-accent focus:bg-white transition-all shadow-sm"
                      placeholder="Siddhi Deshmukh"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-slate-900 uppercase tracking-widest ml-1">Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-transparent hover:border-slate-200 rounded-xl px-4 py-3 text-[14px] font-medium text-slate-900 focus:outline-none focus:border-accent focus:bg-white transition-all shadow-sm"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-900 uppercase tracking-widest ml-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-transparent hover:border-slate-200 rounded-xl px-4 py-3 text-[14px] font-medium text-slate-900 focus:outline-none focus:border-accent focus:bg-white transition-all shadow-sm"
                  placeholder="archer@example.com"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-900 uppercase tracking-widest ml-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-transparent hover:border-slate-200 rounded-xl px-4 py-3 text-[14px] font-medium text-slate-900 focus:outline-none focus:border-accent focus:bg-white transition-all shadow-sm"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-accent hover:bg-[#E0291D] text-white font-black text-[14px] uppercase tracking-widest rounded-xl px-4 py-3.5 transition-all disabled:opacity-50 shadow-[0_4px_14px_rgba(255,59,48,0.25)] hover:shadow-[0_6px_20px_rgba(255,59,48,0.3)] transform hover:-translate-y-0.5 flex items-center justify-center active:scale-[0.98]"
              >
                {loading ? "Processing..." : isLogin ? "Sign In" : "Register Profile"}
              </button>
            </form>

            <div className="flex justify-center mt-1">
              <button
                type="button"
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
    </>
  );
}
