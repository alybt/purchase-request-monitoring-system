"use client";

export default function DashboardPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 min-h-screen bg-slate-50 p-8">
      
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-secondary">Admin Overview</h1>
        <p className="text-secondary/70 text-sm mt-1">Global System Status & Key Metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Total Spent Card - Primary Color Theme */}
        <div className="bg-primary/5 p-6 rounded-2xl border border-primary/20 shadow-sm flex flex-col justify-between transition-all hover:shadow-md hover:border-primary/40">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-primary/80 tracking-wide uppercase">Total Spent</h2>
            <div className="p-2 bg-primary/10 text-primary border border-primary/20 rounded-lg">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
               </svg>
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold text-secondary">₱1.24M</p>
            <p className="text-xs text-primary font-semibold mt-2">+12.5% from last month</p>
          </div>
        </div>

        {/* Bottlenecks Pipeline Card - Gold Color Theme */}
        <div className="bg-gold/5 p-6 rounded-2xl border border-gold/30 shadow-sm flex flex-col justify-between transition-all hover:shadow-md hover:border-gold/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gold tracking-wide uppercase">PR Bottlenecks</h2>
            <div className="p-2 bg-gold/10 text-gold border border-gold/20 rounded-lg">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
               </svg>
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold text-secondary">8</p>
            <p className="text-xs text-gold font-semibold mt-2">Pending over 48 hours</p>
          </div>
        </div>

        {/* Active Users Card - Accent Color Theme */}
        <div className="bg-accent/5 p-6 rounded-2xl border border-accent/30 shadow-sm flex flex-col justify-between transition-all hover:shadow-md hover:border-accent/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-secondary/70 tracking-wide uppercase">Active Users</h2>
            <div className="p-2 bg-accent/20 text-secondary border border-accent/40 rounded-lg">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
               </svg>
            </div>
          </div>
          <div>
            <p className="text-3xl font-bold text-secondary">142</p>
            <p className="text-xs text-secondary/60 font-medium mt-2">Currently in system</p>
          </div>
        </div>
      </div>

      {/* Pipeline Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-secondary">Recent Approval Pipeline</h3>
          <button className="text-sm font-semibold text-primary hover:text-secondary transition-colors">
            View All
          </button>
        </div>
        
        <div className="h-48 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
          <span className="text-sm text-slate-400 font-medium">Pipeline Table Component Placeholder</span>
        </div>
      </div>

    </div>
  );
}