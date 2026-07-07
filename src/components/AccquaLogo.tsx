export function AccquaLogo({ small = false }: { small?: boolean }) {
  return (
    <div className={small ? 'accqua-logo accqua-logo--small' : 'accqua-logo'} aria-label="Accqua Sports Academia">
      <div className="logo-line" />
      <div className="logo-main">ACCQUA<br />SPORTS</div>
      {!small && <div className="logo-sub">A C A D E M I A</div>}
      <div className="logo-line" />
    </div>
  )
}
