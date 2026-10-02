import type { BracketsViewer } from 'brackets-viewer';

let loading: Promise<BracketsViewer> | undefined;

/**
 * Loads brackets-viewer the first time a bracket is shown. It ships as a ready-made script
 * (it sets `window.bracketsViewer`) and a stylesheet, copied to `vendor/` at build time.
 */
export function loadBracketsViewer(document: Document): Promise<BracketsViewer> {
  loading ??= new Promise<BracketsViewer>((resolve, reject) => {
    const styles = document.createElement('link');
    styles.rel = 'stylesheet';
    styles.href = 'vendor/brackets-viewer/brackets-viewer.min.css';
    document.head.append(styles);

    const script = document.createElement('script');
    script.src = 'vendor/brackets-viewer/brackets-viewer.min.js';
    // The script sets `window.bracketsViewer` (declared by brackets-viewer's own types).
    script.onload = () =>
      'bracketsViewer' in window
        ? resolve(window.bracketsViewer)
        : reject(new Error('brackets-viewer did not start'));
    script.onerror = () => {
      loading = undefined;
      reject(new Error('brackets-viewer could not be loaded'));
    };
    document.head.append(script);
  });
  return loading;
}
