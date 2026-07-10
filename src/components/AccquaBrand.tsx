export function AccquaBrand({ subtitle = "ACADEMIA" }: { subtitle?: string }) {
  return (
    <div className="brand-mark">
      <span className="brand-line" />
      <div className="brand-name">ACCQUA<br />SPORTS</div>
      <div className="brand-sub">{subtitle}</div>
      <span className="brand-line" />
    </div>
  );
}
