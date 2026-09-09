import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import { ProfileProvider } from "@/context/ProfileContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProfileProvider>
      <div className="flex flex-col lg:flex-row gap-[14px] p-[14px] pb-[80px] lg:pb-[14px] min-h-screen print:p-0 print:m-0 print:gap-0 print:min-h-0 print:block">
        <div className="hidden lg:block print:hidden">
          <Sidebar />
        </div>
        <main className="flex-1 min-w-0 flex flex-col gap-[12px] print:p-0 print:m-0 print:gap-0 print:w-full">
          {children}
        </main>
      </div>
      <div className="print:hidden">
        <MobileNav />
      </div>
    </ProfileProvider>
  );
}

