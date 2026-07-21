import React from "react";
import { Calendar, MapPin, Trophy } from "lucide-react";

export default function UpcomingEvents() {
  const events = [
    {
      name: "National Ranking Tournament",
      date: "Aug 12 - Aug 15, 2026",
      location: "SAI Range, Sonipat",
      type: "Outdoor 70m",
      status: "Registered"
    },
    {
      name: "State Indoor Championships",
      date: "Nov 05 - Nov 06, 2026",
      location: "Indoor Arena, Delhi",
      type: "Indoor 18m",
      status: "Planning"
    }
  ];

  return (
    <div className="bg-panel border border-border rounded-[14px] p-6">
      <h3 className="text-[15px] font-bold text-text mb-4">Upcoming Events</h3>
      <div className="flex flex-col gap-3">
        {events.map((event, i) => (
          <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-4 bg-black/5 p-4 rounded-xl border border-black/5 hover:border-black/10 transition-colors">
            <div className="flex-1">
              <h4 className="text-[14px] font-semibold text-black mb-1 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-accent" />
                {event.name}
              </h4>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] text-text-dim">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> {event.date}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> {event.location}
                </span>
                <span className="px-2 py-0.5 rounded bg-black/10">{event.type}</span>
              </div>
            </div>
            <div>
              <span className={`text-[12px] font-medium px-3 py-1 rounded-full ${event.status === 'Registered' ? 'bg-accent/20 text-accent border border-accent/30' : 'bg-black/10 text-black/70 border border-black/20'}`}>
                {event.status}
              </span>
            </div>
          </div>
        ))}
      </div>
      <button className="w-full mt-4 py-2 border border-dashed border-black/20 hover:border-black/40 rounded-lg text-[13px] font-medium text-black/70 hover:text-black transition-colors">
        + Add Event
      </button>
    </div>
  );
}
