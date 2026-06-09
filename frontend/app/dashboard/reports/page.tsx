"use client";

// Future imports will go here:
// import SpendTrendChart from "@/features/reports/components/SpendTrendChart";
// import DepartmentPieChart from "@/features/reports/components/DepartmentPieChart";

export default function ReportsPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 min-h-screen bg-slate-50 p-8">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary">Report Analytics</h1>
          <p className="text-secondary/70 text-sm mt-1">Visualize system performance and expenditure trends.</p>
        </div>
        
        {/* Date Range Picker Placeholder */}
        <button className="border border-slate-200 text-secondary bg-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2">
          <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          <span>This Month</span>
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </button>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart Area 1 */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 transition-shadow hover:shadow-md">
           <div className="flex justify-between items-center mb-6">
             <h3 className="text-lg font-bold text-secondary">Monthly Expenditure</h3>
             <button className="text-slate-400 hover:text-primary transition-colors">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
             </button>
           </div>
           
           {/* <SpendTrendChart /> */}
           <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
              <svg className="w-8 h-8 text-primary/40 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
             <span className="text-sm text-slate-400 font-medium">Bar Chart Component Placeholder</span>
           </div>
        </div>

        {/* Chart Area 2 */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 transition-shadow hover:shadow-md">
           <div className="flex justify-between items-center mb-6">
             <h3 className="text-lg font-bold text-secondary">Requests by Department</h3>
             <button className="text-slate-400 hover:text-primary transition-colors">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
             </button>
           </div>

           {/* <DepartmentPieChart /> */}
           <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
             <svg className="w-8 h-8 text-gold/40 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>
             <span className="text-sm text-slate-400 font-medium">Pie Chart Component Placeholder</span>
           </div>
        </div>

      </div>
    </div>
  );
}