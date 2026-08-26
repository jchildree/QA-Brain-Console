import { useEffect, useState } from 'react';
import { fetchAlerts, type Alert } from '../api/client';

export function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAlerts()
      .then(setAlerts)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { alerts, loading, error };
}
