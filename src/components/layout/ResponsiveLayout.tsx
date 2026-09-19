import type { ReactNode } from 'react';
import './ResponsiveLayout.css';

export function ResponsiveLayout({ sidebar, main }: { sidebar: ReactNode; main: ReactNode }) {
  return (
    <div className="app-layout">
      <aside className="app-layout__sidebar">{sidebar}</aside>
      <main className="app-layout__main">{main}</main>
    </div>
  );
}
