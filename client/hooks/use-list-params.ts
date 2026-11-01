"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

type Changes = Record<string, string | number | null>;

/**
 * List state lives in the URL, so views are shareable and survive refresh. Uses
 * history.replaceState, which Next keeps in sync with useSearchParams without a
 * server round trip. Any change other than `page` itself returns to page one.
 */
export function useListParams() {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const query = useMemo(() => Object.fromEntries(searchParams.entries()), [searchParams]);

  const update = useCallback(
    (changes: Changes) => {
      const next = new URLSearchParams(window.location.search);
      for (const [key, value] of Object.entries(changes)) {
        if (value === null || value === "") next.delete(key);
        else next.set(key, String(value));
      }
      if (!("page" in changes)) next.delete("page");
      const queryString = next.toString();
      window.history.replaceState(null, "", queryString ? `${pathname}?${queryString}` : pathname);
    },
    [pathname],
  );

  return { query, update };
}
