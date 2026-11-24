import { createContext, useContext } from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

const NetworkStatusContext = createContext({ isOnline: true });

export function NetworkStatusProvider({ children }) {
  const isOnline = useOnlineStatus();
  return (
    <NetworkStatusContext.Provider value={{ isOnline }}>
      {children}
    </NetworkStatusContext.Provider>
  );
}

export function useNetworkStatus() {
  return useContext(NetworkStatusContext);
}