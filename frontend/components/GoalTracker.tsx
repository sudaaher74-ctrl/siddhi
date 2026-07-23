"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle2, Circle, Target, Plus, X } from "lucide-react";
import Cookies from "js-cookie";

interface Goal {
  _id?: string;
  title: string;
  target: string;
  current: string;
  deadline: string;
  progress: number;
  completed: boolean;
}

export default function GoalTracker() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    target: "",
    current: "0",
    deadline: "",
    progress: "0"
  });

  const fetchGoals = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
      const token = Cookies.get("token");
      const res = await fetch(`${apiUrl}/api/goals`, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        const data = await res.json();
        setGoals(data);
      }
    } catch (err) {
      console.error("Failed to fetch goals", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const payload = {
        ...formData,
        progress: parseInt(formData.progress) || 0,
        completed: parseInt(formData.progress) >= 100
      };

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
      const token = Cookies.get("token");
      const res = await fetch(`${apiUrl}/api/goals`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Failed to save goal");
      
      setIsOpen(false);
      setFormData({ title: "", target: "", current: "0", deadline: "", progress: "0" });
      fetchGoals();
    } catch (err) {
      console.error(err);
      alert("Failed to save goal.");
    } finally {
      setIsSaving(false);
    }
  };
  
  const setIsOpen = (open: boolean) => {
    setIsModalOpen(open);
  }

  return (
    <div className="bg-panel border border-border rounded-[14px] p-6 relative">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-[15px] font-bold text-text">Season Goals</h3>
        <button 
          onClick={() => setIsOpen(true)}
          className="px-3 py-1.5 bg-accent/10 hover:bg-accent/20 text-accent rounded-lg text-[12px] font-semibold transition-colors flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Goal
        </button>
      </div>
      
      {loading ? (
        <div className="text-sm text-text-dim py-4 text-center">Loading goals...</div>
      ) : goals.length === 0 ? (
        <div className="text-sm text-text-dim py-8 text-center bg-black/5 rounded-xl border border-dashed border-black/10">
          No goals added yet. Click &quot;Add Goal&quot; to get started!
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {goals.map((goal, i) => (
            <div key={goal._id || i} className={`flex flex-col gap-2 p-4 rounded-xl border transition-colors ${goal.completed ? 'bg-accent/5 border-accent/20' : 'bg-black/5 border-black/5'}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {goal.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-black/30 flex-shrink-0" />
                  )}
                  <div>
                    <h4 className={`text-[14px] font-semibold ${goal.completed ? 'text-black line-through opacity-70' : 'text-black'}`}>
                      {goal.title}
                    </h4>
                    <div className="text-[12px] text-text-dim flex items-center gap-2 mt-0.5">
                      <Target className="w-3.5 h-3.5" />
                      Target: {goal.target} (Current: {goal.current}) • By {goal.deadline}
                    </div>
                  </div>
                </div>
                <div className="text-[13px] font-bold text-black/70">
                  {goal.progress}%
                </div>
              </div>
              
              <div className="w-full h-1.5 bg-white/40 rounded-full mt-2 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${goal.completed ? 'bg-accent' : 'bg-gradient-to-r from-accent to-accent-soft'}`}
                  style={{ width: `${goal.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Goal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-panel w-full max-w-md rounded-[14px] border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b border-black/5">
              <h2 className="text-[15px] font-bold text-text">Add New Goal</h2>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-text-dim hover:text-text transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-text-dim font-semibold mb-1">Goal Title</label>
                <input 
                  type="text" 
                  name="title" 
                  value={formData.title} 
                  onChange={handleChange}
                  placeholder="e.g. Shoot 10,000 Arrows"
                  className="w-full bg-black/5 border border-black/10 rounded-lg p-2.5 text-[13px] text-text focus:outline-none focus:border-accent"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-text-dim font-semibold mb-1">Target Value</label>
                  <input 
                    type="text" 
                    name="target" 
                    value={formData.target} 
                    onChange={handleChange}
                    placeholder="e.g. 10k"
                    className="w-full bg-black/5 border border-black/10 rounded-lg p-2.5 text-[13px] text-text focus:outline-none focus:border-accent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-text-dim font-semibold mb-1">Current Value</label>
                  <input 
                    type="text" 
                    name="current" 
                    value={formData.current} 
                    onChange={handleChange}
                    placeholder="e.g. 0"
                    className="w-full bg-black/5 border border-black/10 rounded-lg p-2.5 text-[13px] text-text focus:outline-none focus:border-accent"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-text-dim font-semibold mb-1">Progress (%)</label>
                  <input 
                    type="number" 
                    name="progress" 
                    value={formData.progress} 
                    onChange={handleChange}
                    min="0"
                    max="100"
                    className="w-full bg-black/5 border border-black/10 rounded-lg p-2.5 text-[13px] text-text font-mono focus:outline-none focus:border-accent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-text-dim font-semibold mb-1">Deadline</label>
                  <input 
                    type="text" 
                    name="deadline" 
                    value={formData.deadline} 
                    onChange={handleChange}
                    placeholder="e.g. Dec 2026"
                    className="w-full bg-black/5 border border-black/10 rounded-lg p-2.5 text-[13px] text-text focus:outline-none focus:border-accent"
                    required
                  />
                </div>
              </div>
              
              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="w-full py-3 bg-accent text-panel font-semibold text-[13px] rounded-lg transition-colors hover:shadow-[0_0_15px_rgba(255,90,78,0.4)] disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Add Goal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
