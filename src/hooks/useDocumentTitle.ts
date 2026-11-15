import { useEffect } from 'react';

export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = title ? `${title} · Korean Learning Journey` : 'Korean Learning Journey';
  }, [title]);
}
