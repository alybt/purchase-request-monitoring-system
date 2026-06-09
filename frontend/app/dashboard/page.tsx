import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden">
      {/* Sidebar is isolated to the dashboard and handles its own hover state */}
      <Sidebar />
      
      {/* Main Content Area: Automatically fills remaining space alongside the sidebar */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        
        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-auto p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}