"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle2, Circle, Target, Plus, X, Edit3, Trash2 } from "lucide-react";
import { apiFetch, apiPost, apiPut, apiDelete } from "@/lib/api";

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
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    target: "",
    current: "0",
    deadline: "",
    progress: "0"
  });

  const fetchGoals = async () => {
    try {
      setGoals(await apiFetch<Goal[]>("/api/goals"));
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

  const handleOpenAdd = () => {
    setEditingGoal(null);
    setFormData({
      title: "",
      target: "",
      current: "0",
      deadline: "",
      progress: "0"
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setFormData({
      title: goal.title,
      target: goal.target,
      current: goal.current || "0",
      deadline: goal.deadline || "",
      progress: goal.progress !== undefined ? String(goal.progress) : "0"
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (goalId: string, title?: string) => {
    if (!goalId) return;
    const confirmMsg = title
      ? `Are you sure you want to delete goal "${title}"?`
      : "Are you sure you want to delete this goal?";
    if (!confirm(confirmMsg)) return;

    setIsDeleting(true);
    try {
      await apiDelete(`/api/goals/${goalId}`);
      setGoals((prev) => prev.filter((g) => g._id !== goalId));
      if (isModalOpen && editingGoal?._id === goalId) {
        setIsModalOpen(false);
        setEditingGoal(null);
      }
      fetchGoals();
    } catch (err) {
      console.error("Failed to delete goal", err);
      alert(err instanceof Error ? err.message : "Failed to delete goal.");
    } finally {
      setIsDeleting(false);
    }
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

      if (editingGoal?._id) {
        await apiPut(`/api/goals/${editingGoal._id}`, payload);
      } else {
        await apiPost("/api/goals", payload);
      }

      setIsModalOpen(false);
      setEditingGoal(null);
      setFormData({ title: "", target: "", current: "0", deadline: "", progress: "0" });
      fetchGoals();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Failed to save goal.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-panel border border-border rounded-[14px] p-6 relative">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-[15px] font-bold text-text">Season Goals</h3>
        <button 
          onClick={handleOpenAdd}
          className="px-3 py-1.5 bg-accent/10 hover:bg-accent/20 text-accent rounded-lg text-[12px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
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
            <div key={goal._id || i} className={`group flex flex-col gap-2 p-4 rounded-xl border transition-colors ${goal.completed ? 'bg-accent/5 border-accent/20' : 'bg-black/5 border-black/5'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {goal.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-black/30 flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <h4 className={`text-[14px] font-semibold truncate ${goal.completed ? 'text-black line-through opacity-70' : 'text-black'}`}>
                      {goal.title}
                    </h4>
                    <div className="text-[12px] text-text-dim flex items-center gap-2 mt-0.5">
                      <Target className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">Target: {goal.target} (Current: {goal.current}) • By {goal.deadline}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="text-[13px] font-bold text-black/70">
                    {goal.progress}%
                  </div>
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(goal)}
                      className="p-1 text-slate-400 hover:text-slate-700 hover:bg-black/5 rounded-md transition-colors cursor-pointer"
                      title="Edit goal"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    {goal._id && (
                      <button
                        type="button"
                        onClick={() => handleDelete(goal._id!, goal.title)}
                        disabled={isDeleting}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer disabled:opacity-50"
                        title="Delete goal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
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

      {/* Goal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-panel w-full max-w-md rounded-[14px] border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b border-black/5">
              <h2 className="text-[15px] font-bold text-text">
                {editingGoal ? "Edit Goal" : "Add New Goal"}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-text-dim hover:text-text transition-colors cursor-pointer"
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
              
              <div className="pt-2 flex items-center gap-2">
                {editingGoal && editingGoal._id && (
                  <button
                    type="button"
                    onClick={() => handleDelete(editingGoal._id!, editingGoal.title)}
                    disabled={isDeleting}
                    className="py-3 px-4 bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold text-[13px] rounded-lg transition-colors border border-rose-200 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    title="Delete goal"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-black/5 hover:bg-black/10 text-text font-semibold text-[13px] rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="flex-1 py-3 bg-accent text-panel font-semibold text-[13px] rounded-lg transition-colors hover:shadow-[0_0_15px_rgba(255,90,78,0.4)] disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? "Saving..." : editingGoal ? "Save Changes" : "Add Goal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
