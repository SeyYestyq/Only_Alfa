/**
 * Подписи и тона аналитики поставщика (Invoice-to-Credit).
 * Вероятность и баллы считает бэкенд; здесь только отображение.
 */

export type SupplierRiskBand = "LOW" | "MEDIUM" | "HIGH";

export const SUPPLIER_RISK_BAND_LABEL: Record<SupplierRiskBand, string> = {
  LOW: "Низкий риск сделки",
  MEDIUM: "Умеренный риск",
  HIGH: "Повышенный риск",
};

export const SUPPLIER_RISK_BAND_TONE: Record<SupplierRiskBand, "good" | "warn" | "risk"> = {
  LOW: "good",
  MEDIUM: "warn",
  HIGH: "risk",
};

export function supplierRiskBandLabel(band: string): string {
  if (band in SUPPLIER_RISK_BAND_LABEL) {
    return SUPPLIER_RISK_BAND_LABEL[band as SupplierRiskBand];
  }
  return band;
}

export function supplierRiskBandTone(band: string): "good" | "warn" | "risk" {
  if (band in SUPPLIER_RISK_BAND_TONE) {
    return SUPPLIER_RISK_BAND_TONE[band as SupplierRiskBand];
  }
  return "warn";
}
