import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}

export default function Card({ children, className = "", noPadding = false }: CardProps) {
  return (
    <div 
      className={`
        bg-panel border border-border rounded-2xl 
        shadow-card hover:shadow-card-hover transition-all duration-300
        ${noPadding ? "" : "p-5 sm:p-6"} 
        flex flex-col 
        ${className}
      `}
    >
      {children}
    </div>
  );
}
