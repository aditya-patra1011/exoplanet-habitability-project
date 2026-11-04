import { useEffect, useState } from "react";

/** Fetches a JSON file from /public and tracks failures, so they don't look like empty charts. */
export function useJson<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`${url} returned ${r.status}`);
        return r.json();
      })
      .then((json: T) => {
        if (!cancelled) setData(json);
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  return { data, failed };
}
