"use client";

interface ActivityItem {
  id: string;
  title: string;
  subtitle: string;
  timestamp: string;
  badge?: string;
  badgeColor?: string;
  initials?: string;
}

interface ActivityFeedProps {
  items: ActivityItem[];
  title?: string;
}

export default function ActivityFeed({ items, title = "Recent Activity" }: ActivityFeedProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <h3 className="text-lg font-bold text-secondary mb-4">{title}</h3>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
              <span className="text-xs font-bold text-primary">
                {item.initials ?? item.title.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-secondary truncate">{item.title}</p>
              <p className="text-xs text-secondary/60 truncate">{item.subtitle}</p>
            </div>
            <div className="shrink-0 text-right">
              {item.badge && (
                <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-1 ${item.badgeColor ?? "bg-slate-100 text-slate-600"}`}>
                  {item.badge}
                </span>
              )}
              <p className="text-xs text-secondary/40">{item.timestamp}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
