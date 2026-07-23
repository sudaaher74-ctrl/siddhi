import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="flex flex-col lg:flex-row gap-[14px] p-[14px] pb-[80px] lg:pb-[14px] min-h-screen">
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        <main className="flex-1 min-w-0 flex flex-col gap-[12px]">
          {children}
        </main>
      </div>
      <MobileNav />
    </>
  );
}
