import TopBar from "@/components/TopBar";
import UpcomingEvents from "@/components/UpcomingEvents";
import SessionsTable from "@/components/SessionsTable";

export default function TournamentsPage() {
  return (
    <>
      <TopBar title="Tournaments" />
      
      <div className="mt-4 mb-6">
        <UpcomingEvents />
      </div>

      <div>
        <h3 className="text-[15px] font-bold text-text mb-4 px-1">Tournament History</h3>
        <SessionsTable />
      </div>
    </>
  );
}
