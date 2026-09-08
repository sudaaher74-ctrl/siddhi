"use client";

import React, { useState } from "react";
import { Send, Bot, Sparkles } from "lucide-react";
import { useUser } from "@/hooks/useUser";

interface Message {
  sender: "user" | "bot";
  text: string;
  drill?: string;
}

export default function AIChat() {
  const { user } = useUser();
  const athleteName = user?.name ? user.name.split(" ")[0] : "Archer";
  const initials = user?.name
    ? user.name
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "ME";

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const quickPrompts = [
    "How do I prevent dropping my bow arm?",
    "Tips for smooth clicker expansion",
    "How to shoot consistently in windy conditions",
    "Pre-shot routine for competition focus",
  ];

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text) return;

    const newMessages: Message[] = [...messages, { sender: "user", text }];
    setMessages(newMessages);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      let reply = "";
      let drill: string | undefined;

      const lower = text.toLowerCase();
      if (lower.includes("bow arm") || lower.includes("dropping")) {
        reply =
          "Dropping the bow arm usually happens when you anticipate the shot or drop the arm early to watch the arrow flight. Keep your bow shoulder depressed, maintain push-pull pressure into the target through the follow-through, and hold your bow up until the arrow hits.";
        drill = "Bow Arm Freeze Hold Drill (Hold posture for 2 seconds after each arrow)";
      } else if (lower.includes("clicker") || lower.includes("expansion")) {
        reply =
          "Smooth clicker expansion requires continuous back-tension and rhomboid engagement rather than pulling with your hand or fingers. Ensure your anchor under the jaw remains static while your drawing elbow rotates subtly around your spine.";
        drill = "Blank Bale Clicker Progression (30 arrows at 5m focused only on back expansion)";
      } else if (lower.includes("wind")) {
        reply =
          "In windy conditions, widen your stance slightly and center your gravity. Aim with your torso and hips rather than steering the bow with your wrists. Trust your float—never stop expanding to fight the wind.";
        drill = "Rhythm Shooting under Time (Shoot ends within 25 seconds per arrow)";
      } else if (lower.includes("routine") || lower.includes("mental") || lower.includes("focus")) {
        reply =
          "A solid pre-shot routine builds consistency under pressure: 1) Stance & foot placement, 2) Deep cleansing breath, 3) Hook & grip check, 4) Visualizing the center 10-ring, 5) Smooth draw and continuous commit. Never start a shot with doubt.";
        drill = "Box Breathing & 3-Step Anchor Check Routine";
      } else {
        reply = `Great question! Focus on a rock-solid foundation: keep your posture tall, anchor consistent, and follow-through fluid. Remember that archery is 80% mental discipline and 20% mechanics.`;
        drill = "Consistency Check (Shoot 3 ends of 6 arrows focusing exclusively on clean releases)";
      }

      setMessages([...newMessages, { sender: "bot", text: reply, drill }]);
      setIsTyping(false);
    }, 600);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-210px)] lg:h-[calc(100vh-140px)] bg-panel border border-border rounded-[14px] overflow-hidden">
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto flex flex-col gap-6">
        {/* Welcome Coach Greeting */}
        <div className="flex gap-3 sm:gap-4 max-w-[90%] sm:max-w-[80%]">
          <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/30 flex-shrink-0 flex items-center justify-center text-accent">
            <Bot className="w-4 h-4" />
          </div>
          <div className="bg-accent/5 rounded-2xl rounded-tl-sm p-4 text-[13px] text-black/90 border border-accent/10">
            <p className="font-bold text-accent mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>ArcherX AI Coach</span>
            </p>
            <p className="mb-2">
              Hello {athleteName}! I am your personal AI Archery Coach. Ask me anything about form correction, arrow grouping, equipment tuning, clicker timing, or mental preparation.
            </p>
            <p className="text-xs text-text-dim">
              Select a topic below or type your question:
            </p>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {quickPrompts.map((prompt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSend(prompt)}
                  className="text-[11px] font-semibold bg-white/60 hover:bg-white text-slate-700 px-2.5 py-1 rounded-lg border border-black/5 hover:border-accent/40 transition-colors text-left cursor-pointer"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Dynamic Chat Messages */}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 sm:gap-4 ${
              msg.sender === "user"
                ? "self-end max-w-[90%] sm:max-w-[80%]"
                : "max-w-[90%] sm:max-w-[80%]"
            }`}
          >
            {msg.sender === "bot" && (
              <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/30 flex-shrink-0 flex items-center justify-center text-accent">
                <Bot className="w-4 h-4" />
              </div>
            )}
            <div
              className={`rounded-2xl p-3 sm:p-4 text-[13px] ${
                msg.sender === "user"
                  ? "bg-black/5 rounded-tr-sm text-black/90 border border-black/5"
                  : "bg-accent/5 rounded-tl-sm text-black/90 border border-accent/10"
              }`}
            >
              <p>{msg.text}</p>
              {msg.drill && (
                <div className="mt-3 p-3 bg-white/40 rounded-lg border border-black/5">
                  <div className="text-[11px] text-text-dim mb-0.5 font-bold uppercase tracking-wider">
                    Recommended Drill
                  </div>
                  <div className="text-[12px] font-semibold text-accent">
                    {msg.drill}
                  </div>
                </div>
              )}
            </div>
            {msg.sender === "user" && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-[#b71c1c] flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">
                {initials}
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3 sm:gap-4 max-w-[90%] sm:max-w-[80%]">
            <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/30 flex-shrink-0 flex items-center justify-center text-accent">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-accent/5 rounded-2xl rounded-tl-sm p-3 text-xs text-text-dim italic flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce [animation-delay:0.4s]" />
              <span>Analyzing...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-3 sm:p-4 bg-black/5 border-t border-black/5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-3 bg-white/60 rounded-full px-4 py-2 border border-black/10 focus-within:border-accent/50 focus-within:bg-white transition-colors"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your coach anything about archery..."
            className="flex-1 bg-transparent border-none outline-none text-[13px] text-black placeholder:text-black/40"
          />
          <button
            type="submit"
            className="p-2 rounded-full bg-accent text-white hover:bg-accent-hover active:scale-95 transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
