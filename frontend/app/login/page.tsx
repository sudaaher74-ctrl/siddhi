"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { GoogleLogin } from "@react-oauth/google";

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
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

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

      // Save token to cookie
      Cookies.set("token", data.token, { expires: 30 });
      
      // Redirect to dashboard
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

  const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
    setError("");
    setLoading(true);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

    try {
      const res = await fetch(`${apiUrl}/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: credentialResponse.credential }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Google authentication failed");
      }

      // Save token to cookie
      Cookies.set("token", data.token, { expires: 30 });
      
      // Redirect to dashboard
      router.push("/");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-end px-6 md:pr-24 lg:pr-40 bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: 'url("/img/photos/login.jpeg")' }}
    >
      {/* Very faint overlay so background is clearly visible */}
      <div className="absolute inset-0 bg-black/10"></div>

      <div className="w-full max-w-sm p-6 bg-black/20 border border-white/20 rounded-2xl shadow-2xl backdrop-blur-md relative z-10 transform transition-all duration-500 hover:border-white/30">
        <div className="text-center mb-6">
          <p className="text-white text-lg font-medium tracking-wide drop-shadow-md">
            {isLogin ? "Welcome back, Archer." : "Begin your journey."}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center animate-pulse">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="group">
            <label className="block text-gray-400 text-xs uppercase tracking-wider mb-2 group-focus-within:text-gold transition-colors duration-300">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all duration-300 shadow-inner"
              placeholder="archer@example.com"
            />
          </div>

          <div className="group">
            <label className="block text-gray-400 text-xs uppercase tracking-wider mb-2 group-focus-within:text-gold transition-colors duration-300">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all duration-300 shadow-inner"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gold hover:bg-yellow-400 text-black font-bold uppercase tracking-wider text-sm rounded-lg px-4 py-4 transition-all duration-300 disabled:opacity-50 hover:shadow-[0_0_15px_rgba(255,215,0,0.4)] transform hover:-translate-y-0.5"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : isLogin ? "Sign In" : "Register"}
          </button>
          
          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-gray-600"></div>
            <span className="flex-shrink-0 mx-4 text-gray-400 text-xs uppercase tracking-wider">Or</span>
            <div className="flex-grow border-t border-gray-600"></div>
          </div>
          
          <div className="flex justify-center mt-2">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError("Google Login was unsuccessful")}
              theme="filled_black"
              shape="pill"
              text="continue_with"
              width="300"
            />
          </div>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-gray-400 hover:text-white text-sm transition-colors duration-300 underline-offset-4 hover:underline"
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
