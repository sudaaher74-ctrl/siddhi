import { Calendar, ChevronRight, Trophy } from "lucide-react";
import Link from "next/link";
import Card from "./ui/Card";

export default function UpcomingEvents() {
  // Mock event
  const event = {
    name: "National Ranking Tournament",
    date: "Aug 12, 2026",
    daysLeft: 14,
    readiness: 82
  };

  return (
    <Card className="flex flex-col h-full bg-surface border-border">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 bg-accent/10 rounded-lg text-accent">
          <Calendar className="w-4 h-4" />
        </div>
        <h2 className="text-[13px] font-semibold text-text-mid uppercase tracking-wider">Upcoming Event</h2>
      </div>

      <div className="flex flex-col gap-4 flex-1">
        <div className="flex flex-col gap-1">
          <h3 className="text-base font-bold text-text flex items-center gap-2">
            <Trophy className="w-4 h-4 text-accent" />
            {event.name}
          </h3>
          <p className="text-xs text-text-dim">{event.date}</p>
        </div>

        <div className="flex items-center justify-between p-3 bg-background border border-border rounded-xl">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-text-dim uppercase">Starts In</span>
            <span className="font-mono text-lg font-bold text-text">{event.daysLeft} <span className="text-[10px] text-text-dim">days</span></span>
          </div>
          <div className="w-[1px] h-8 bg-border" />
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold text-text-dim uppercase">Readiness</span>
            <span className="font-mono text-lg font-bold text-emerald-500">{event.readiness}%</span>
          </div>
        </div>
      </div>

      <Link 
        href="/tournaments" 
        className="mt-4 flex items-center justify-center gap-1.5 px-4 py-2 bg-background border border-border hover:bg-black/5 text-text-mid hover:text-text font-semibold text-xs rounded-xl transition-colors"
      >
        View Details
        <ChevronRight className="w-3.5 h-3.5" />
      </Link>
    </Card>
  );
}
