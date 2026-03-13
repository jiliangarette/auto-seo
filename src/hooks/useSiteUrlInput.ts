import { useState, useEffect } from 'react';
import { useSiteUrl } from '@/contexts/SiteContext';

/**
 * Hook that provides a URL input state initialized from SiteContext.
 * When the context URL changes and local is empty, it syncs automatically.
 */
export function useSiteUrlInput(): [string, (url: string) => void] {
  const { siteUrl } = useSiteUrl();
  const [url, setUrl] = useState(siteUrl);

  useEffect(() => {
    if (!url && siteUrl) {
      setUrl(siteUrl);
    }
  }, [siteUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  return [url, setUrl];
}
