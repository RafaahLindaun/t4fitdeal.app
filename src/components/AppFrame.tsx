import type { ReactNode } from 'react'

export function AppFrame({ children, noBottomPadding = false }: { children: ReactNode; noBottomPadding?: boolean }) {
  return <main className={noBottomPadding ? 'app-frame no-bottom-padding' : 'app-frame'}>{children}</main>
}
