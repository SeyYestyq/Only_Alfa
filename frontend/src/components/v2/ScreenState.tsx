export function SkeletonLines({ lines = 3 }: { lines?: number }) {
  return (
    <div className="v2-skeleton" aria-busy="true" aria-label="Загрузка">
      {Array.from({ length: lines }, (_, index) => <span key={index} />)}
    </div>
  );
}

export function EmptyState({
  title,
  text,
  action,
  onAction,
}: {
  title: string;
  text: string;
  action: string;
  onAction: () => void;
}) {
  return (
    <div className="v2-empty">
      <h2>{title}</h2>
      <p className="v2-muted">{text}</p>
      <button type="button" className="v2-btn" style={{ marginTop: 16 }} onClick={onAction}>{action}</button>
    </div>
  );
}

export function ErrorState({
  title,
  text,
  onRetry,
}: {
  title: string;
  text: string;
  onRetry: () => void;
}) {
  return (
    <div className="v2-empty">
      <h2>{title}</h2>
      <p className="v2-muted">{text}</p>
      <button type="button" className="v2-btn" style={{ marginTop: 16 }} onClick={onRetry}>Повторить</button>
    </div>
  );
}
