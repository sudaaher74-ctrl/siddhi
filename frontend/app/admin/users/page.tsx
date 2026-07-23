"use client";

import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { UserCog, Trash2, Search, Shield, ShieldAlert, ShieldCheck } from "lucide-react";
import { useUser } from "@/hooks/useUser";

interface UserData {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  createdAt: string;
}

export default function AdminUsersPage() {
  const { user: currentUser } = useUser();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      const token = Cookies.get("token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
      const res = await fetch(`${apiUrl}/api/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    const confirmMsg = newRole === 'admin' 
      ? "Are you sure you want to promote this user to Admin?"
      : "Are you sure you want to remove Admin privileges from this user?";
      
    if (!confirm(confirmMsg)) return;
    
    setProcessingId(userId);
    try {
      const token = Cookies.get("token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
      const res = await fetch(`${apiUrl}/api/admin/users/${userId}/role`, {
        method: "PUT",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });

      if (res.ok) {
        await fetchUsers(); // Refresh data
      } else {
        const err = await res.json();
        alert(err.message || "Failed to update role");
      }
    } catch (error) {
      console.error("Error updating role:", error);
      alert("An error occurred");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("CRITICAL WARNING: Are you sure you want to permanently delete this user? ALL of their data (sessions, equipment) will be wiped out. This cannot be undone.")) return;
    
    setProcessingId(userId);
    try {
      const token = Cookies.get("token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
      const res = await fetch(`${apiUrl}/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        setUsers(users.filter(u => u._id !== userId));
      } else {
        const err = await res.json();
        alert(err.message || "Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("An error occurred");
    } finally {
      setProcessingId(null);
    }
  };

  const filteredUsers = users.filter(u => 
    (u.name || "").toLowerCase().includes((searchTerm || "").toLowerCase()) || 
    (u.email || "").toLowerCase().includes((searchTerm || "").toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">User Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage accounts, roles, and access.</p>
        </div>
        
        <div className="relative w-full md:w-[300px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search users..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-[10px] text-[13px] outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-[14px] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[13px]">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No users found matching &quot;{searchTerm}&quot;
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isSelf = currentUser?._id === u._id;
                  const isProcessing = processingId === u._id;
                  return (
                    <tr key={u._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 ${u.role === 'admin' ? 'bg-accent' : 'bg-slate-800'}`}>
                            {u.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{u.name} {isSelf && <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded ml-1">You</span>}</div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">ID: {u._id.substring(u._id.length - 6)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-slate-700">{u.email}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{u.phone}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          u.role === 'admin' 
                            ? 'bg-accent/10 text-accent border border-accent/20' 
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}>
                          {u.role === 'admin' ? <ShieldCheck className="w-3 h-3" /> : <UserCog className="w-3 h-3" />}
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleRoleChange(u._id, u.role)}
                            disabled={isSelf || isProcessing}
                            className={`p-2 rounded-lg border transition-colors ${
                              isSelf ? 'opacity-50 cursor-not-allowed bg-slate-50 border-slate-200 text-slate-400' :
                              u.role === 'admin' 
                                ? 'bg-orange-50 border-orange-200 text-orange-600 hover:bg-orange-100'
                                : 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100'
                            }`}
                            title={u.role === 'admin' ? "Demote to User" : "Promote to Admin"}
                          >
                            {u.role === 'admin' ? <ShieldAlert className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                          </button>
                          
                          <button
                            onClick={() => handleDelete(u._id)}
                            disabled={isSelf || isProcessing}
                            className={`p-2 rounded-lg border transition-colors ${
                              isSelf ? 'opacity-50 cursor-not-allowed bg-slate-50 border-slate-200 text-slate-400' :
                              'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'
                            }`}
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
