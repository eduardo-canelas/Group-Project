import { useEffect } from 'react';
import { useTheme } from './theme-context';

const LIGHT_COLOR = '#e8e6e2';
const DARK_COLOR = '#0a0d12';

export function useAuthStatusBar() {
  const { theme } = useTheme();

  useEffect(() => {
    const color = theme === 'dark' ? DARK_COLOR : LIGHT_COLOR;
    let meta = document.querySelector('meta[name="theme-color"]');
    const created = !meta;
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'theme-color');
      document.head.appendChild(meta);
    }
    const previous = meta.getAttribute('content');
    meta.setAttribute('content', color);

    return () => {
      if (created) {
        meta.remove();
      } else if (previous !== null) {
        meta.setAttribute('content', previous);
      }
    };
  }, [theme]);
}
