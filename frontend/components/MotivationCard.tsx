"use client";

import Card from "@/components/ui/Card";
import { Quote } from "lucide-react";

export default function MotivationCard() {
  return (
    <Card className="bg-gradient-to-r from-accent/10 to-accent/5 border border-accent/20 flex flex-col justify-center items-center text-center py-8">
      <Quote className="w-8 h-8 text-accent/40 mb-4" />
      <p className="text-sm md:text-base font-semibold text-text-mid italic max-w-lg leading-relaxed">
        &quot;Archery does not get easier or hard to understand. It is you who gets better and better.&quot;
      </p>
      <div className="w-8 h-1 bg-accent/30 rounded-full mt-4" />
    </Card>
  );
}
