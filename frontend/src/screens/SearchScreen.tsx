import { SmartSearchPanel } from "../components/SmartSearchPanel";

/**
 * Бизнес-поисковик в стиле Grok Business (Search-to-Credit AI)
 * Без боковой панели, с капсульным поиском, 3-колоночной телеметрией активности/лимитов/запросов
 * и коммерческими моками, выгодными Альфа-Банку.
 */
export function SearchScreen() {
  return (
    <div className="grok-search-view">
      <SmartSearchPanel />
    </div>
  );
}
