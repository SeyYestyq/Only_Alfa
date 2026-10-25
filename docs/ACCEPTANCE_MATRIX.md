# Матрица приёмки (задание Дамира)

Статусы: **OK** — проверено; **FIX** — исправлено в рамках строгой приёмки; **PARTIAL** — ограничение демо.

| ID | Требование | Реализация | Проверка | Статус |
|----|------------|------------|----------|--------|
| R0 | Фронт не считает баллы/статусы | API `ApplicationSchema`, UI только отображение | `npm run build`, ревью экранов | OK |
| R0 | Скоринг ≠ Decision Engine, FSM на бэке | `risk_score.py`, `decision_engine.py`, `application_fsm.py` | `test_scoring.py` | OK |
| R0 | Пороги в `core/constants.py` | `FACTOR_POINTS`, `DOC_*`, `SUPPLEMENT_SCORE_*` | `test_supplement_scoring.py` | FIX |
| R0 | Домен без FastAPI/SQLAlchemy | `domain/enrichment/*`, `domain/scoring/*` | импорты | OK |
| 1 | Три блока статуса для клиента | `client_brief`, `ApplicationBriefPanel` | `test_acceptance_profiles.py`, браузер | OK |
| 1 | Без внутренних кодов в UI | `status_label`, brief тексты | grep + приёмка | OK |
| 1 | Предупреждения до решения / письмо после | `pre_decision_warnings`, `decision_letter` | pytest + К4 | OK |
| 2 | Письмо к офферу (факторы, срок, бездействие) | `build_offer_letter`, `offer_letters` | браузер, пилот | OK |
| 2 | Письмо в заявке **и** в переписке | `correspondence` + `MessagesScreen` + `bankMessagesStore.sync` | браузер, чат банка | FIX |
| 2 | Пилот открывает письмо в 1 клик | `PilotClientRequestCard` → чат | браузер | FIX |
| 3 | Встречный запрос другого продукта | `client-product-request` API, UI панель | API + браузер | OK |
| 4 | Вердикт пилоту до чата | `PilotClientRequestCard`, `client_request` | bank-xray | OK |
| 4 | Дозапрос + доменный пересчёт | `supplement_factors.py`, `upload-supplement` | `test_supplement_scoring.py` | FIX |
| 4 | Было/стало у клиента и пилота | `score_changes` | UI | OK |
| 5 | Проактив поставщик / план CAPEX | `proactive.py`, `system_actions` | dashboard Ростерс/Смирнов | OK |
| 5 | Пилот: правило, стоп, открытие, ответ | `SystemDecidedFeed`, `open`/`respond` API | браузер + NewsFeed | FIX |
| 5 | Переход из уведомления в сценарий | `news.meta.target_screen`, `NewsFeed` | клик по CTA | FIX |
| 6 | Подписант = CEO / IP_OWNER | FSM + `SigningPanel` | скриншоты ролей | OK |
| 6 | Бухгалтер без чата | убраны кнопки чата | signing-accountant.png | OK |
| 6 | Бухгалтер видит «деньги зачислены» | `FUNDED` + notice для всех ролей | `demoStore` + signing | FIX |
| 7 | Единый figma-стиль затронутых экранов | `figma-panel` на новых блоках, NewsFeed | скриншоты laptop/narrow | OK |
| P1 | Одобрение + письмо у пилота | см. блоки 1–2 | Смирнов / Ростерс | OK |
| P2 | Отказ читаемый | `decision_letter.next_steps` | Бодрость pytest | OK |
| P3 | Промежуточные статусы | `_STATUS_WHERE/NEXT` | ручной обзор | OK |
| P4 | Овердрафт встречный запрос | `evaluate_client_product_request` | API | OK |
| P5 | Дозапрос выписки | multibank + supplement | verify-multibank / supplement | OK |
| P6 | Повод системы | NEARBY_SUPPLIER | лента пилота | OK |
| P7 | План покупки | EQUIPMENT_INTENT | уведомление + дозапрос | OK |
| P8 | Подпись | уведомления `signingAuthorityOnly` | браузер | OK |
| P9 | Стиль responsive | figma CSS | narrow screenshots | OK |
| P10 | Регрессия pytest 5 профилей | `test_scoring` + `test_acceptance_profiles` | CI локально | OK |

## Финальный критерий

| Критерий | Статус |
|----------|--------|
| Предприниматель понимает статус и причины | OK |
| Может запросить другой продукт | OK |
| Подписант получает уведомление на подпись | OK |
| Пилот видит запрос и проактив за ~30 с | OK |
