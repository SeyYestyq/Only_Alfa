import type { CounterOffer, ProductType } from "../api/types";
import {
  type CreditProductKind,
  type CreditProductPresentation,
  CREDIT_PRODUCT_CATALOG,
  demoCounterOfferForKind,
  kindForProductType,
  presentationForKind,
} from "./creditProductCatalog";

export type OfferSlot = "left" | "center" | "right";

export interface DisplayProductOffer {
  offer: CounterOffer;
  presentation: CreditProductPresentation;
  slot: OfferSlot;
  isFeatured: boolean;
  /** Источник: API встречного предложения или демо-фолбэк */
  source: "api" | "demo";
}

const SLOT_ORDER: OfferSlot[] = ["left", "center", "right"];

/**
 * Берёт встречные офферы API и собирает ровно 3 карточки:
 * центр — рекомендованная семья продукта, боковые — остальные.
 */
export function buildDisplayProductOffers(
  offers: CounterOffer[],
  preferredProduct: ProductType,
  requestedAmountRub: number,
  fallbackRatePct: number,
): DisplayProductOffer[] {
  const featuredKind = kindForProductType(preferredProduct);
  const byKind = pickBestOfferPerKind(offers);

  const kindsInDisplayOrder = orderKindsWithFeaturedCenter(featuredKind);
  let nextDemoIndex = 100;

  return kindsInDisplayOrder.map((kind, position) => {
    const slot = SLOT_ORDER[position];
    const apiOffer = byKind.get(kind);
    const offer =
      apiOffer ??
      demoCounterOfferForKind(kind, requestedAmountRub, fallbackRatePct, nextDemoIndex++);
    return {
      offer,
      presentation: presentationForKind(kind),
      slot,
      isFeatured: slot === "center",
      source: apiOffer ? "api" : "demo",
    };
  });
}

function pickBestOfferPerKind(offers: CounterOffer[]): Map<CreditProductKind, CounterOffer> {
  const map = new Map<CreditProductKind, CounterOffer>();
  for (const offer of offers) {
    const kind = kindForProductType(offer.product_type);
    const existing = map.get(kind);
    if (!existing) {
      map.set(kind, offer);
      continue;
    }
    // Предпочитаем более «полную» сумму в семье (залог / исходный запрос)
    if (offer.amount_rub > existing.amount_rub) {
      map.set(kind, offer);
    }
  }
  return map;
}

/** Центр = featured; слева/справа — остальные семьи в порядке каталога. */
function orderKindsWithFeaturedCenter(featured: CreditProductKind): CreditProductKind[] {
  const others = CREDIT_PRODUCT_CATALOG.map((item) => item.kind).filter((kind) => kind !== featured);
  if (others.length !== 2) {
    return ["WORKING_CAPITAL", featured, "OVERDRAFT"].filter(
      (kind, index, all) => all.indexOf(kind) === index,
    ) as CreditProductKind[];
  }
  return [others[0], featured, others[1]];
}
