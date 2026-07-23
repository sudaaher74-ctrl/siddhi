"use client";

import React, { useState } from "react";
import Cookies from "js-cookie";
import { MessageSquare, Send, CheckCircle2 } from "lucide-react";

export default function FeedbackPage() {
  const [type, setType] = useState("Feature Request");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const token = Cookies.get("token");
      const res = await fetch("http://localhost:5001/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type, subject, message }),
      });

      if (!res.ok) {
        throw new Error("Failed to submit feedback");
      }

      setSuccess(true);
      setSubject("");
      setMessage("");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex-1 overflow-auto bg-[#F8FAFC]">
        <div className="max-w-2xl mx-auto px-4 md:px-8 py-8 md:py-12">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Feedback Sent!</h2>
            <p className="text-slate-600 mb-6">
              Thank you for helping us improve Siddhi Jurnal. We&apos;ve received your message.
            </p>
            <button
              onClick={() => setSuccess(false)}
              className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
            >
              Send Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-[#F8FAFC]">
      <div className="max-w-2xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Help & Feedback</h1>
          </div>
          <p className="text-slate-500 font-medium">Send us a bug report, feature request, or just say hello!</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          {error && (
            <div className="mb-6 p-4 bg-rose-50 text-rose-600 rounded-xl text-[13px] font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[12px] font-bold text-slate-900 uppercase tracking-wider mb-2">Category</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-[14px] font-medium text-slate-900 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
              >
                <option value="Feature Request">Feature Request</option>
                <option value="Bug Report">Bug Report</option>
                <option value="General Support">General Support</option>
              </select>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-slate-900 uppercase tracking-wider mb-2">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief summary..."
                className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-[14px] font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-[12px] font-bold text-slate-900 uppercase tracking-wider mb-2">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us exactly what's on your mind..."
                className="w-full h-32 bg-slate-50 border border-slate-200 rounded-xl p-4 text-[14px] font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all resize-none"
                required
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-accent text-white rounded-xl font-bold text-[14px] flex items-center justify-center gap-2 hover:bg-accent/90 transition-colors disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Send Feedback
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
