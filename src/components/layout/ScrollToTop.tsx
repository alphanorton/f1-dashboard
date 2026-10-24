import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Scrolls the window back to the top of the page on every route change,
 * unless a fragment hash is present (lets in-page anchors still work).
 */
export function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
}
