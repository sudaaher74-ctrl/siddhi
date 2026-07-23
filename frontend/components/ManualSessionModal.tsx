"use client";

import React, { useState } from "react";
import { Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ManualSessionModal() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: `Practice Session - ${new Date().toLocaleDateString()}`,
    type: "Practice",
    arrows: "36",
    score: "0",
    tens: "0",
    note: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const arrowsNum = parseInt(formData.arrows) || 1;
      const scoreNum = parseInt(formData.score) || 0;
      const avg = (scoreNum / arrowsNum).toFixed(2);
      
      const payload = {
        ...formData,
        avg
      };

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
      const res = await fetch(`${apiUrl}/api/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Failed to save session");
      
      setIsOpen(false);
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Failed to save session.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-accent text-panel font-semibold text-sm rounded-lg hover:bg-accent-hover transition-colors"
      >
        <Plus className="w-4 h-4" />
        Log Manual Session
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-panel w-full max-w-md rounded-[14px] border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b border-black/5">
              <h2 className="text-[15px] font-bold text-text">Log Manual Session</h2>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-text-dim hover:text-text transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-text-dim font-semibold mb-1">Session Name</label>
                <input 
                  type="text" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleChange}
                  className="w-full bg-black/5 border border-black/10 rounded-lg p-2.5 text-[13px] text-text focus:outline-none focus:border-accent"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-text-dim font-semibold mb-1">Type</label>
                  <select 
                    name="type" 
                    value={formData.type} 
                    onChange={handleChange}
                    className="w-full bg-black/5 border border-black/10 rounded-lg p-2.5 text-[13px] text-text focus:outline-none focus:border-accent"
                  >
                    <option value="Practice">Practice</option>
                    <option value="Tournament">Tournament</option>
                    <option value="Blank Bale">Blank Bale</option>
                    <option value="Scoring">Scoring</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-text-dim font-semibold mb-1">Arrows</label>
                  <input 
                    type="number" 
                    name="arrows" 
                    value={formData.arrows} 
                    onChange={handleChange}
                    className="w-full bg-black/5 border border-black/10 rounded-lg p-2.5 text-[13px] text-text font-mono focus:outline-none focus:border-accent"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-text-dim font-semibold mb-1">Total Score</label>
                  <input 
                    type="number" 
                    name="score" 
                    value={formData.score} 
                    onChange={handleChange}
                    className="w-full bg-black/5 border border-black/10 rounded-lg p-2.5 text-[13px] text-text font-mono focus:outline-none focus:border-accent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-text-dim font-semibold mb-1">10s + Xs</label>
                  <input 
                    type="number" 
                    name="tens" 
                    value={formData.tens} 
                    onChange={handleChange}
                    className="w-full bg-black/5 border border-black/10 rounded-lg p-2.5 text-[13px] text-text font-mono focus:outline-none focus:border-accent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-text-dim font-semibold mb-1">Notes</label>
                <textarea 
                  name="note" 
                  value={formData.note} 
                  onChange={handleChange}
                  rows={2}
                  className="w-full bg-black/5 border border-black/10 rounded-lg p-2.5 text-[13px] text-text focus:outline-none focus:border-accent resize-none"
                  placeholder="How did it feel?"
                />
              </div>
              
              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="w-full py-3 bg-accent text-panel font-semibold text-[13px] rounded-lg transition-colors hover:shadow-[0_0_15px_rgba(255,90,78,0.4)] disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save Session"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
