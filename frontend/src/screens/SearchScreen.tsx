import { SmartSearchPanel } from "../components/SmartSearchPanel";

/**
 * Бизнес-поисковик Альфа-Банка для подбора оборудования, сырья, контрагентов и рыночных цен.
 * Поисковая активность фиксируется в цифровом следе клиента для ранней превентивной аналитики банка.
 */
export function SearchScreen() {
  return (
    <div className="grok-search-view">
      <SmartSearchPanel />
    </div>
  );
}
