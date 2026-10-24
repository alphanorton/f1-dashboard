import React from 'react';
import { useLocation } from 'react-router-dom';

/** Fades/slides the routed page in on navigation. Keyed on pathname only (not hash/search). */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  return (
    <div key={pathname} className="page-enter">
      {children}
    </div>
  );
}
