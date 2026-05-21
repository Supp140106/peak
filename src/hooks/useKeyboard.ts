import { useEffect, useCallback } from 'react';

type KeyCombo = {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
};

export function useKeyboardShortcut(
  combo: KeyCombo,
  callback: (e: KeyboardEvent) => void,
  disabled = false
) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (disabled) return;
      
      const keyMatch = e.key.toLowerCase() === combo.key.toLowerCase();
      const ctrlMatch = combo.ctrl ? e.ctrlKey : true;
      const metaMatch = combo.meta ? e.metaKey : true;
      const shiftMatch = combo.shift ? e.shiftKey : true;
      const altMatch = combo.alt ? e.altKey : true;

      if (keyMatch && ctrlMatch && metaMatch && shiftMatch && altMatch) {
        e.preventDefault();
        callback(e);
      }
    },
    [combo, callback, disabled]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
