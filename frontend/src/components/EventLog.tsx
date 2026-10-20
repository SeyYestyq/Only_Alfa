import type { XrayEvent } from "../api/types";
import { formatDateTime } from "../utils/format";

export function EventLog({ events }: { events: XrayEvent[] }) {
  return (
    <table className="table events-table">
      <thead>
        <tr>
          <th>Время</th>
          <th>Событие</th>
          <th>Роль</th>
          <th>Статус</th>
          <th>Детали</th>
        </tr>
      </thead>
      <tbody>
        {events.map((event) => (
          <tr key={event.id}>
            <td className="faint nowrap">{formatDateTime(event.created_at)}</td>
            <td>
              <span className="event-type">{event.event_type}</span>
            </td>
            <td className="nowrap">{event.actor_role}</td>
            <td className="faint" style={{ fontSize: 11 }}>
              {event.previous_status ? `${event.previous_status} → ` : ""}
              {event.new_status ?? "—"}
            </td>
            <td>{event.details}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
