import { Slot } from 'expo-router';
import { useEffect } from 'react';
import Constants from 'expo-constants';
import Navigation from './Navigation/Navigation';
import { Provider } from 'react-redux';
import store from '@/common/store';

/**
 * Layout raíz requerido por Expo Router.
 * Debe renderizar <Slot /> en el primer render para que el router monte
 * antes de que las rutas hijas (p. ej. index.tsx) intenten navegar.
 */
export default function RootLayout() {
  useEffect(() => {
    (async () => {
      try {
        // Use dynamic import/require to avoid bundler errors when package is absent
        let AuthSession: any = null;
        try {
          // prefer dynamic import
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          AuthSession = require('expo-auth-session');
        } catch (e) {
          try {
            AuthSession = (await import('expo-auth-session'));
          } catch (ie) {
            console.warn('expo-auth-session not available');
          }
        }

        if (!AuthSession) return;

        const proxyUri = AuthSession.makeRedirectUri({ useProxy: true });
        const directUri = AuthSession.makeRedirectUri({ useProxy: false });
        console.log('Redirect URI (proxy):', proxyUri);
        console.log('Redirect URI (direct):', directUri);
        console.log('App scheme from manifest:', Constants.expoConfig?.scheme || Constants.manifest?.scheme);
      } catch (e) {
        console.warn('Error generating redirect URIs:', e);
      }
    })();
  }, []);

  return <Provider store={store}><Navigation /></Provider>;
}
