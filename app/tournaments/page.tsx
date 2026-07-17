import TopBar from "@/components/TopBar";

export default function TournamentsPage() {
  return (
    <>
      <TopBar title="Tournaments" />
      <div className="flex-1 flex flex-col items-center justify-center bg-panel border border-border rounded-[14px] p-8 text-center mt-4 h-[400px]">
        <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-4">
          <div className="w-8 h-8 rounded-full bg-accent/20 animate-pulse" />
        </div>
        <h2 className="text-xl font-semibold text-text-mid mb-2">Tournaments</h2>
        <p className="text-sm text-text-dim max-w-sm">
          This section is currently under construction. Check back soon for match play data and event history.
        </p>
      </div>
    </>
  );
}
