import { useNetworkStatus } from '../context/NetworkStatusContext';

export default function OfflineBanner() {
  const { isOnline } = useNetworkStatus();
  if (isOnline) return null;

  return (
    <div className="offline-banner" role="status" aria-live="polite">
      Offline Mode — Viewing cached hardware catalog. Checkout, Sign In & Spec AI are paused.
    </div>
  );
}