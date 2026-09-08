"use client";

import React, { createContext, useContext, useState } from "react";
import ProfileModal from "@/components/ProfileModal";

interface ProfileContextType {
  openProfile: () => void;
  closeProfile: () => void;
  isProfileOpen: boolean;
}

const ProfileContext = createContext<ProfileContextType>({
  openProfile: () => {},
  closeProfile: () => {},
  isProfileOpen: false,
});

export const useProfile = () => useContext(ProfileContext);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <ProfileContext.Provider
      value={{
        openProfile: () => setIsOpen(true),
        closeProfile: () => setIsOpen(false),
        isProfileOpen: isOpen,
      }}
    >
      {children}
      <ProfileModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </ProfileContext.Provider>
  );
}
