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

/** Три продуктовых варианта: рекомендованный — в центре, клик раскрывает детали. */
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

  const [expandedKind, setExpandedKind] = useState<string | null>(
    () => displayOffers.find((item) => item.isFeatured)?.presentation.kind ?? null,
  );

  return (
    <section className="product-offer-tier" aria-label="Варианты кредитных продуктов">
      <div className="product-offer-tier-head">
        <h2 className="figma-panel-title">Выберите продукт банка</h2>
        <p className="muted" style={{ marginTop: 6, fontSize: 13 }}>
          Три варианта поверх исходной заявки. В центре — рекомендация под ваш профиль. Нажмите
          карточку, чтобы прочитать подробности.
        </p>
      </div>

      <div className="product-offer-row">
        {displayOffers.map((item) => (
          <ProductOfferCard
            key={item.presentation.kind}
            item={item}
            isExpanded={expandedKind === item.presentation.kind}
            isSelected={selectedOfferIndex === item.offer.index}
            isBusy={isBusy}
            canChoose={canChoose}
            onToggleExpand={() =>
              setExpandedKind((current) =>
                current === item.presentation.kind ? null : item.presentation.kind,
              )
            }
            onAccept={() => onAccept(item.offer.index)}
          />
        ))}
      </div>
    </section>
  );
}

function ProductOfferCard({
  item,
  isExpanded,
  isSelected,
  isBusy,
  canChoose,
  onToggleExpand,
  onAccept,
}: {
  item: DisplayProductOffer;
  isExpanded: boolean;
  isSelected: boolean;
  isBusy: boolean;
  canChoose: boolean;
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
        isFeatured ? "is-featured" : "is-side",
        isExpanded ? "is-expanded" : "",
        isSelected ? "is-selected" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <button
        type="button"
        className="product-offer-card-hit"
        aria-expanded={isExpanded}
        onClick={onToggleExpand}
      >
        <div className="product-offer-card-top">
          <span className="product-offer-icon" aria-hidden>
            {getOfferIcon(presentation.kind)}
          </span>
          {isFeatured && (
            <span className="product-offer-badge" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <StarIcon size={12} />
              <span>Рекомендуем</span>
            </span>
          )}
          {isSelected && !isFeatured && <span className="product-offer-badge is-chosen">Выбрано</span>}
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
      </button>

      <button
        type="button"
        className={`btn btn-sm btn-block product-offer-cta ${isFeatured ? "btn-primary" : "btn-secondary"}`}
        disabled={isBusy || !canChoose || isSelected || item.source === "demo"}
        title={
          item.source === "demo"
            ? "Демо-вариант без индекса API — выберите оффер банка"
            : undefined
        }
        onClick={(event) => {
          event.stopPropagation();
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

      <button type="button" className="product-offer-expand-link" onClick={onToggleExpand}>
        {isExpanded ? "Свернуть" : "Подробнее"}
      </button>
    </article>
  );
}
