export default function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "accqua-logo compact" : "accqua-logo"}>
      <span>ACCQUA</span>
      <span>SPORTS</span>
      {!compact && <small>ACADEMIA</small>}
    </div>
  );
}
