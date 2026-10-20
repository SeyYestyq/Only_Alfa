import type { Xray } from "../api/types";

export function GeoPanel({ xray }: { xray: Xray }) {
  const { geo, bank_value } = xray;
  return (
    <div className="geo-grid">
      <div>
        <div className="card-subtitle" style={{ marginBottom: 6 }}>
          Локация и рейтинг заказчика · {geo.business_model}
        </div>
        <div className="map-frame">
          <iframe
            title="Карта OpenStreetMap"
            src={geo.map_url}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
        <div className="geo-stats section-gap">
          <div className="geo-stat">
            <span>GeoScore</span>
            <span>{geo.geo_score}</span>
          </div>
          <div className="geo-stat">
            <span>BuyerScore</span>
            <span>{geo.buyer_score}</span>
          </div>
          <div className="geo-stat">
            <span>Конкурентов 300 м</span>
            <span>{geo.competitors_count}</span>
          </div>
          <div className="geo-stat">
            <span>Адрес</span>
            <span style={{ fontSize: 11.5 }}>
              {geo.city}, {geo.address}
            </span>
          </div>
        </div>
        {geo.anchor_buyer && (
          <p className="muted" style={{ fontSize: 11.5, marginTop: 8 }}>
            Якорный заказчик: {geo.anchor_buyer}
          </p>
        )}
      </div>

      <div>
        <div className="card-subtitle" style={{ marginBottom: 6 }}>
          {bank_value.title}
        </div>
        <div className="alert alert-info">
          <ul className="checklist" style={{ marginTop: 0 }}>
            {bank_value.points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </div>
        <div className="card-subtitle" style={{ margin: "12px 0 6px" }}>
          Ценность PDF-счёта
        </div>
        <div className="alert alert-good" style={{ padding: 10 }}>
          <ul className="checklist" style={{ marginTop: 0 }}>
            {bank_value.pdf_value.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </div>
        <div className="card-subtitle" style={{ margin: "12px 0 6px" }}>
          Ценность прогноза кассы
        </div>
        <div className="alert alert-warn" style={{ padding: 10 }}>
          <ul className="checklist" style={{ marginTop: 0 }}>
            {bank_value.cash_forecast_value.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
