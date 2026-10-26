import type { XrayEvent } from "../api/types";
import { formatDateTime } from "../utils/format";
import { GearIcon, UserIcon, BankIcon, ArrowsDownUpIcon } from "./icons";

export function EventLog({ events }: { events: XrayEvent[] }) {
  if (!events || events.length === 0) {
    return <p className="muted" style={{ padding: 12 }}>Событий аудита пока нет.</p>;
  }

  return (
    <div className="desk-timeline">
      {events.map((event) => {
        const actorIcon =
          event.actor_role === "SCORING_ENGINE" || event.actor_role === "SYSTEM" ? (
            <GearIcon size={14} />
          ) : event.actor_role === "UNDERWRITER" ? (
            <UserIcon size={14} />
          ) : event.actor_role === "CLIENT" ? (
            <BankIcon size={14} />
          ) : (
            <ArrowsDownUpIcon size={14} />
          );

        const isGood =
          event.new_status === "APPROVED" ||
          event.new_status === "FUNDED" ||
          event.event_type.includes("APPROV");
        const isRisk =
          event.new_status === "REJECTED" ||
          event.event_type.includes("REJECT") ||
          event.event_type.includes("STOP");

        return (
          <div key={event.id} className="desk-timeline-item">
            <div className="desk-timeline-left">
              <div className="desk-timeline-event">
                <span>{actorIcon}</span>
                <span>{event.event_type}</span>
                <span
                  className={`status-tag ${
                    isGood ? "is-good" : isRisk ? "is-risk" : "is-warn"
                  }`}
                  style={{ fontSize: 10, padding: "2px 6px" }}
                >
                  {event.previous_status ? `${event.previous_status} → ` : ""}
                  {event.new_status ?? event.actor_role}
                </span>
              </div>
              <div className="desk-timeline-desc">{event.details}</div>
            </div>
            <div className="desk-timeline-right">
              <span className="desk-timeline-time">{formatDateTime(event.created_at)}</span>
              <span className="faint" style={{ fontSize: 10, fontFamily: "monospace" }}>
                SHA-256 #{event.id.slice(0, 8)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

