import type { ReactNode } from "react";
import clsx from "clsx";

export default function StaffPageLayout({ header, children, className }: { header?: ReactNode; children: ReactNode; className?: string; }) {
  return (
    <main className={clsx("staff-page-layout", className)}>
      {header ? <div className="staff-page-layout-header">{header}</div> : null}
      <div className="staff-page-layout-scroll">{children}</div>
    </main>
  );
}
