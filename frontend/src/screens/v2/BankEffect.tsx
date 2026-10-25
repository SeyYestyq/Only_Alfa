export function BankEffect() {
  return (
    <>
      <div className="v2-row">
        <div>
          <h1 className="v2-h1">Эффект</h1>
          <p className="v2-lead">Денежных оценок эффекта в кейсе нет — не выдумываем. Ниже то, что измерили в демо-прогоне, и то, что измерим в пилоте.</p>
        </div>
        <span className="v2-pill demo">демо-данные / прогноз</span>
      </div>
      <section className="v2-kpis">
        <article className="v2-card"><div className="v2-kpi-value">38 с</div><div className="v2-kpi-sub">все проверки в прогоне Ростерс · демо</div></article>
        <article className="v2-card"><div className="v2-kpi-value">8 мин</div><div className="v2-kpi-sub">от заявки до решения · демо</div></article>
        <article className="v2-card"><div className="v2-kpi-value">23 мин</div><div className="v2-kpi-sub">от заявки до денег · демо</div></article>
        <article className="v2-card"><div className="v2-kpi-value">2 поля</div><div className="v2-kpi-sub">ввести вручную: сумма и срок</div></article>
      </section>
      <div className="v2-grid-3">
        <section className="v2-card">
          <h2>Для предпринимателя</h2>
          <p className="v2-muted">Банк приходит сам — до кассового разрыва, а не после. Видно, почему такая сумма. Бухгалтер готовит, гендиректор подписывает. После выдачи банк предупреждает о трудном месяце заранее.</p>
        </section>
        <section className="v2-card">
          <h2>Для банка</h2>
          <p className="v2-muted">Все задачи в одной очереди по SLA. Решение на одном экране. Встречное вместо отказа — клиент остаётся с банком. Ранние сигналы до просрочки.</p>
        </section>
        <section className="v2-card">
          <div className="v2-row"><h2>Что измерим в пилоте</h2><span className="v2-pill demo">прогноз</span></div>
          <ul className="v2-muted">
            <li>Конверсия: предложение → заявка → выдача</li>
            <li>Доля решений в зелёном коридоре без инспектора</li>
            <li>Время от заявки до денег, медиана</li>
            <li>Доля встречных, принятых клиентом</li>
            <li>Просрочки 30+ по кредитам из кабинета против обычных</li>
            <li>Доля реструктуризаций до первой просрочки</li>
          </ul>
        </section>
      </div>
    </>
  );
}
