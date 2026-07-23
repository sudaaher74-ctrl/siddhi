"use client";

import React, { useState, useEffect } from "react";
import TopBar from "@/components/TopBar";
import EquipmentCard from "@/components/EquipmentCard";
import EquipmentModal from "@/components/EquipmentModal";
import { Equipment } from "@/lib/data";
import { Plus } from "lucide-react";
import Cookies from "js-cookie";

export default function EquipmentPage() {
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Equipment | null>(null);

  const fetchEquipment = async () => {
    try {
      const token = Cookies.get("token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
      const res = await fetch(`${apiUrl}/api/equipment`, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        const data = await res.json();
        setEquipmentList(data);
      }
    } catch (error) {
      console.error("Error fetching equipment:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, []);

  const handleSave = async (data: Partial<Equipment>) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
      const url = data._id 
        ? `${apiUrl}/api/equipment/${data._id}`
        : `${apiUrl}/api/equipment`;
        
      const method = data._id ? "PUT" : "POST";
      const token = Cookies.get("token");
      
      const res = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        await fetchEquipment();
      } else {
        console.error("Failed to save equipment");
      }
    } catch (error) {
      console.error("Error saving equipment:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this equipment?")) return;
    
    try {
      const token = Cookies.get("token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
      const res = await fetch(`${apiUrl}/api/equipment/${id}`, {
        method: "DELETE",
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

      if (res.ok) {
        await fetchEquipment();
      } else {
        console.error("Failed to delete equipment");
      }
    } catch (error) {
      console.error("Error deleting equipment:", error);
    }
  };

  const openAddModal = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: Equipment) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  return (
    <>
      <TopBar title="Equipment Setup" />
      
      <div className="flex justify-between items-center mt-6 mb-4">
        <h2 className="text-[15px] font-bold text-text">Your Arsenal</h2>
        <button 
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-white font-semibold text-[13px] rounded-lg hover:bg-accent-hover transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Equipment
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : equipmentList.length === 0 ? (
        <div className="text-center p-12 bg-panel rounded-[14px] border border-border">
          <p className="text-text-dim text-[14px]">No equipment found. Add your first setup!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[12px]">
          {equipmentList.map((item) => (
            <EquipmentCard 
              key={item._id}
              title={item.name} 
              type={item.type}
              status={item.status}
              stats={item.stats}
              onEdit={() => openEditModal(item)}
              onDelete={() => handleDelete(item._id!)}
            />
          ))}
        </div>
      )}

      <EquipmentModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSave} 
        initialData={editingItem}
      />
    </>
  );
}
