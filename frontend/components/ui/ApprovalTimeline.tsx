"use client";

export interface ApprovalEvent {
  id: string;
  action: string;
  actor: string;
  role: string;
  date: string;
  remarks?: string;
}

const actionConfig: Record<string, { color: string; label: string }> = {
  request: { color: "bg-blue-500", label: "Submitted" },
  approve: { color: "bg-emerald-500", label: "Approved" },
  reject: { color: "bg-red-500", label: "Rejected" },
  return: { color: "bg-orange-500", label: "Returned" },
  forwarded: { color: "bg-purple-500", label: "Forwarded" },
};

interface ApprovalTimelineProps {
  events: ApprovalEvent[];
}

export default function ApprovalTimeline({ events }: ApprovalTimelineProps) {
  if (!events || events.length === 0) {
    return (
      <p className="text-sm text-secondary/50 italic">No approval events yet.</p>
    );
  }

  return (
    <ol className="relative border-l border-slate-200 space-y-6 ml-3">
      {events.map((event, i) => {
        const cfg = actionConfig[event.action] ?? { color: "bg-slate-400", label: event.action };
        return (
          <li key={event.id} className="ml-6">
            <span className={`absolute -left-3 flex items-center justify-center w-6 h-6 rounded-full ring-4 ring-white ${cfg.color}`}>
              {i === events.length - 1 ? (
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <div className="w-2 h-2 rounded-full bg-white" />
              )}
            </span>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white ${cfg.color}`}>
                  {cfg.label}
                </span>
                <time className="text-xs text-secondary/50">{event.date}</time>
              </div>
              <p className="text-sm font-semibold text-secondary">{event.actor}</p>
              <p className="text-xs text-secondary/60">{event.role}</p>
              {event.remarks && (
                <p className="mt-1.5 text-xs text-secondary/70 italic border-l-2 border-slate-300 pl-2">
                  {event.remarks}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
