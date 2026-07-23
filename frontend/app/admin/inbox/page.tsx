"use client";

import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { MessageSquare, Inbox, Search, Trash2, CheckCircle2, Loader2, ArrowRight } from "lucide-react";

interface Feedback {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  type: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
}

export default function AdminInboxPage() {
  const [tickets, setTickets] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchTickets = async () => {
    try {
      const token = Cookies.get("token");
      const res = await fetch("http://localhost:5001/api/admin/feedback", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to load feedback tickets");
      const data = await res.json();
      setTickets(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const token = Cookies.get("token");
      const res = await fetch(`http://localhost:5001/api/admin/feedback/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      
      // Update local state
      setTickets(tickets.map(t => t._id === id ? { ...t, status: newStatus } : t));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const deleteTicket = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this ticket?")) return;
    
    try {
      const token = Cookies.get("token");
      const res = await fetch(`http://localhost:5001/api/admin/feedback/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to delete ticket");
      
      setTickets(tickets.filter(t => t._id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredTickets = tickets.filter(t => 
    (t.subject || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
    (t.user?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.user?.email || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-[10px] bg-accent text-white flex items-center justify-center">
              <Inbox className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">Support Inbox</h1>
          </div>
          <p className="text-[13px] text-slate-500 font-medium">Manage feedback and support requests from athletes.</p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search tickets..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-[250px] h-10 bg-white border border-slate-200 rounded-[10px] pl-9 pr-4 text-[13px] font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all shadow-sm"
          />
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-50 text-rose-600 rounded-xl text-[13px] font-semibold border border-rose-100">
          {error}
        </div>
      )}

      {/* Tickets List */}
      <div className="space-y-4">
        {filteredTickets.length === 0 ? (
          <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl border-dashed">
            <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-[15px] font-bold text-slate-900">Inbox Zero!</h3>
            <p className="text-[13px] text-slate-500 mt-1">You have no pending feedback or support tickets.</p>
          </div>
        ) : (
          filteredTickets.map(ticket => (
            <div key={ticket._id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              {/* Status Indicator */}
              <div className={`absolute top-0 left-0 w-1 h-full ${
                ticket.status === 'New' ? 'bg-rose-500' : 
                ticket.status === 'In Progress' ? 'bg-amber-500' : 'bg-emerald-500'
              }`} />
              
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                
                {/* Meta & User */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      ticket.status === 'New' ? 'bg-rose-50 text-rose-600' : 
                      ticket.status === 'In Progress' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                    }`}>
                      {ticket.status}
                    </span>
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold uppercase tracking-wider">
                      {ticket.type}
                    </span>
                    <span className="text-[11px] font-medium text-slate-400 ml-auto md:ml-2">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <h3 className="text-[16px] font-bold text-slate-900 mb-1 leading-tight">{ticket.subject}</h3>
                  
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-600">
                      {(ticket.user?.name || "U").substring(0, 2).toUpperCase()}
                    </div>
                    <div className="text-[12px]">
                      <span className="font-semibold text-slate-900">{ticket.user?.name || "Unknown User"}</span>
                      <span className="text-slate-500 ml-1">({ticket.user?.email || "No email"})</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-4 bg-slate-50 rounded-xl text-[13px] text-slate-700 font-medium leading-relaxed border border-slate-100 whitespace-pre-wrap">
                    {ticket.message}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-row md:flex-col items-center gap-2 md:w-32 flex-shrink-0 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                  {ticket.status !== 'Resolved' && (
                    <button 
                      onClick={() => updateStatus(ticket._id, 'Resolved')}
                      className="w-full py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Resolve
                    </button>
                  )}
                  {ticket.status === 'New' && (
                    <button 
                      onClick={() => updateStatus(ticket._id, 'In Progress')}
                      className="w-full py-2 bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <ArrowRight className="w-3.5 h-3.5" /> Start Work
                    </button>
                  )}
                  
                  <button 
                    onClick={() => deleteTicket(ticket._id)}
                    className="w-full py-2 bg-slate-50 text-slate-500 hover:bg-rose-50 hover:text-rose-600 border border-slate-200 hover:border-rose-200 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors mt-auto"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>

              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
