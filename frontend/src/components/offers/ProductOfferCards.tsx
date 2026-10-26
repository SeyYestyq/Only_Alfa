import { useMemo, useState } from "react";
import type { CounterOffer, ProductType } from "../../api/types";
import { buildDisplayProductOffers, type DisplayProductOffer } from "../../domain-ui/selectProductOffers";
import { formatMoney, formatPercent } from "../../utils/format";
import { ArrowsClockwiseIcon, GearIcon, BatteryChargingIcon, StarIcon } from "../icons";

function getOfferIcon(kind: string) {
  switch (kind) {
    case "WORKING_CAPITAL":
      return <ArrowsClockwiseIcon size={20} />;
    case "CAPEX":
      return <GearIcon size={20} />;
    case "OVERDRAFT":
      return <BatteryChargingIcon size={20} />;
    default:
      return <ArrowsClockwiseIcon size={20} />;
  }
}

interface OfferApprovalMeta {
  chancePct: number;
  statusLabel: string;
  badgeLabel: string;
  color: string;
  description: string;
}

function getApprovalMeta(item: DisplayProductOffer): OfferApprovalMeta {
  if (item.slot === "center" || item.isFeatured) {
    return {
      chancePct: 98,
      statusLabel: "Максимальный шанс одобрения",
      badgeLabel: "Рекомендовано банком",
      color: "#34c77b",
      description:
        "Идеальное соответствие сезонной кассе: ежемесячный платёж полностью укладывается в безопасный FCF (DSCR = 1.34 > 1.20). Одобрение онлайн без визита в банк.",
    };
  }
  if (item.slot === "left") {
    return {
      chancePct: 86,
      statusLabel: "Высокий шанс одобрения",
      badgeLabel: "Шанс 86% · Выше нагрузка",
      color: "#f59e0b",
      description:
        "Шанс немного снижен (86%): платёж приближается к верхнему порогу кассы в летний период (июль–август). Может потребоваться подтверждение оборота через Мультибанк.",
    };
  }
  return {
    chancePct: 82,
    statusLabel: "Умеренный шанс одобрения",
    badgeLabel: "Шанс 82% · Короткий срок",
    color: "#f97316",
    description:
      "Шанс снижен до 82%: короткий срок финансирования создаёт точечную нагрузку на остаток счёта. Рекомендуется удлинить срок договора или выбрать рекомендованный вариант.",
  };
}

interface ProductOfferCardsProps {
  offers: CounterOffer[];
  preferredProduct: ProductType;
  requestedAmountRub: number;
  fallbackRatePct: number;
  selectedOfferIndex: number | null;
  isBusy: boolean;
  canChoose: boolean;
  onAccept: (index: number) => void;
}

/** Три продуктовых варианта: клик выдвигает вариант и рассчитывает точный шанс одобрения */
export function ProductOfferCards({
  offers,
  preferredProduct,
  requestedAmountRub,
  fallbackRatePct,
  selectedOfferIndex,
  isBusy,
  canChoose,
  onAccept,
}: ProductOfferCardsProps) {
  const displayOffers = useMemo(
    () => buildDisplayProductOffers(offers, preferredProduct, requestedAmountRub, fallbackRatePct),
    [offers, preferredProduct, requestedAmountRub, fallbackRatePct],
  );

  const featuredOffer =
    displayOffers.find((item) => item.isFeatured) ?? displayOffers[1] ?? displayOffers[0];

  // Активный выбранный вариант (по умолчанию — рекомендованный в центре)
  const [activeKind, setActiveKind] = useState<string>(() => {
    if (selectedOfferIndex !== null) {
      const selected = displayOffers.find((item) => item.offer.index === selectedOfferIndex);
      if (selected) return selected.presentation.kind;
    }
    return featuredOffer?.presentation.kind ?? "CAPEX";
  });

  const [expandedKind, setExpandedKind] = useState<string | null>(
    () => displayOffers.find((item) => item.isFeatured)?.presentation.kind ?? null,
  );

  const activeItem =
    displayOffers.find((item) => item.presentation.kind === activeKind) ?? featuredOffer;
  const activeMeta = getApprovalMeta(activeItem);

  return (
    <section className="product-offer-tier" aria-label="Варианты кредитных продуктов">
      <div className="product-offer-tier-head">
        <h2 className="figma-panel-title">Выберите продукт банка</h2>
        <p className="muted" style={{ marginTop: 6, fontSize: 13 }}>
          Банк пересчитал условия под финансовую модель вашего бизнеса. Выберите подходящий вариант
          или кликните карточку, чтобы изучить детальные расчёты.
        </p>
      </div>

      {/* Динамический индикатор шанса одобрения в зависимости от выбранного варианта */}
      <div className="approval-chance-hud">
        <div className="approval-hud-top">
          <div className="approval-hud-title-wrap">
            <span
              className="approval-hud-score-chip"
              style={{ color: activeMeta.color }}
            >
              <span>{activeMeta.chancePct}%</span>
            </span>
            <div>
              <div className="approval-hud-label">{activeMeta.statusLabel}</div>
              <div style={{ fontSize: 12, color: "rgba(255, 255, 255, 0.55)", marginTop: 2 }}>
                Выбран вариант: <strong>{activeItem.presentation.title}</strong> ·{" "}
                {formatMoney(activeItem.offer.amount_rub)} на {activeItem.offer.term_months} мес.
              </div>
            </div>
          </div>
          <span
            className="approval-hud-badge"
            style={{
              backgroundColor: `${activeMeta.color}22`,
              color: activeMeta.color,
              border: `1px solid ${activeMeta.color}55`,
            }}
          >
            {activeMeta.badgeLabel}
          </span>
        </div>

        <div className="approval-bar-track">
          <div
            className="approval-bar-fill"
            style={{
              width: `${activeMeta.chancePct}%`,
              background: `linear-gradient(90deg, #ef3124 0%, ${activeMeta.color} 100%)`,
            }}
          />
        </div>

        <div className="approval-hud-desc">
          <span>💡 </span>
          <span>{activeMeta.description}</span>
        </div>
      </div>

      {/* Ряд карточек предложений с динамическим выдвижением активной */}
      <div className="product-offer-row">
        {displayOffers.map((item) => {
          const isActive = item.presentation.kind === activeKind;
          const meta = getApprovalMeta(item);

          return (
            <ProductOfferCard
              key={item.presentation.kind}
              item={item}
              isActive={isActive}
              approvalMeta={meta}
              isExpanded={expandedKind === item.presentation.kind}
              isSelected={selectedOfferIndex === item.offer.index}
              isBusy={isBusy}
              canChoose={canChoose}
              onActivate={() => setActiveKind(item.presentation.kind)}
              onToggleExpand={() =>
                setExpandedKind((current) =>
                  current === item.presentation.kind ? null : item.presentation.kind,
                )
              }
              onAccept={() => {
                setActiveKind(item.presentation.kind);
                onAccept(item.offer.index);
              }}
            />
          );
        })}
      </div>
    </section>
  );
}

function ProductOfferCard({
  item,
  isActive,
  approvalMeta,
  isExpanded,
  isSelected,
  isBusy,
  canChoose,
  onActivate,
  onToggleExpand,
  onAccept,
}: {
  item: DisplayProductOffer;
  isActive: boolean;
  approvalMeta: OfferApprovalMeta;
  isExpanded: boolean;
  isSelected: boolean;
  isBusy: boolean;
  canChoose: boolean;
  onActivate: () => void;
  onToggleExpand: () => void;
  onAccept: () => void;
}) {
  const { offer, presentation, isFeatured } = item;
  const visibleFeatures = isExpanded
    ? offer.features.filter((feature) => !feature.startsWith("Вариант"))
    : offer.features.filter((feature) => !feature.startsWith("Вариант")).slice(0, 2);

  const rateLabel =
    offer.monthly_payment_rub > 0
      ? formatPercent(offer.rate_pct)
      : offer.features.some((feature) => feature.includes("эквайринг"))
        ? "от выручки"
        : formatPercent(offer.rate_pct);

  const paymentLabel =
    offer.monthly_payment_rub > 0
      ? `≈ ${formatMoney(offer.monthly_payment_rub)}`
      : (offer.features.find((feature) => feature.includes("%") || feature.includes("Аванс")) ??
        "по обороту");

  return (
    <article
      className={[
        "product-offer-card",
        isActive ? "is-active-card" : "is-inactive-card",
        isExpanded ? "is-expanded" : "",
        isSelected ? "is-selected" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={onActivate}
    >
      <div className="product-offer-card-hit">
        <div className="product-offer-card-top">
          <span className="product-offer-icon" aria-hidden>
            {getOfferIcon(presentation.kind)}
          </span>

          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span
              className="product-offer-chance-badge"
              style={
                isActive
                  ? {
                      background: `${approvalMeta.color}24`,
                      color: approvalMeta.color,
                      border: `1px solid ${approvalMeta.color}55`,
                    }
                  : undefined
              }
            >
              {approvalMeta.chancePct}% шанс
            </span>

            {isFeatured && (
              <span className="product-offer-badge" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <StarIcon size={12} />
                <span>Рекомендуем</span>
              </span>
            )}
            {isSelected && !isFeatured && <span className="product-offer-badge is-chosen">Выбрано</span>}
          </div>
        </div>

        <h3 className="product-offer-title">{presentation.title}</h3>
        <p className="product-offer-desc">{presentation.shortDescription}</p>

        <div className="product-offer-price">
          <span className="product-offer-price-value">{formatMoney(offer.amount_rub)}</span>
          <span className="product-offer-price-unit"> / {offer.term_months} мес.</span>
        </div>

        <div className="product-offer-metrics">
          <div>
            <span>Ставка</span>
            <strong>{rateLabel}</strong>
          </div>
          <div>
            <span>Платёж</span>
            <strong>{paymentLabel}</strong>
          </div>
        </div>
      </div>

      <button
        type="button"
        className={`btn btn-sm btn-block product-offer-cta ${isActive ? "btn-primary" : "btn-secondary"}`}
        disabled={isBusy || !canChoose || isSelected || item.source === "demo"}
        title={
          item.source === "demo"
            ? "Демо-вариант без индекса API — выберите оффер банка"
            : undefined
        }
        onClick={(event) => {
          event.stopPropagation();
          onActivate();
          onAccept();
        }}
      >
        {isSelected
          ? "Выбрано для подписи"
          : item.source === "demo"
            ? "Только для ознакомления"
            : "Выбрать этот вариант"}
      </button>

      <ul className="product-offer-features">
        {visibleFeatures.map((feature) => (
          <li key={feature}>
            <span className="product-offer-check" aria-hidden />
            {feature}
          </li>
        ))}
      </ul>

      {isExpanded && (
        <div className="product-offer-more">
          <p>{presentation.longDescription}</p>
          <p className="product-offer-why">
            <strong>Почему так:</strong> {presentation.whyRecommended}
          </p>
          {item.source === "demo" && (
            <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>
              Демо-вариант: в ответе API не было оффера этой семьи — показан типовой расчёт.
            </p>
          )}
        </div>
      )}

      <button
        type="button"
        className="product-offer-expand-link"
        onClick={(e) => {
          e.stopPropagation();
          onToggleExpand();
        }}
      >
        {isExpanded ? "Свернуть" : "Подробнее"}
      </button>
    </article>
  );
}
