import { Slot } from 'expo-router';

/**
 * Layout raíz requerido por Expo Router.
 * Debe renderizar <Slot /> en el primer render para que el router monte
 * antes de que las rutas hijas (p. ej. index.tsx) intenten navegar.
 */
export default function RootLayout() {
  return <Slot />;
}
