import { registerRootComponent } from 'expo';
import App from './App';
// Configuración de Sentry con DSN y ajustes recomendados
Sentry.init({

  dsn: "https://73d67558015f0fd8f8e30c58ed235e99@o4508027327414272.ingest.us.sentry.io/4508042613620736",
  tracesSampleRate: 1.0,
  environment: __DEV__ ? "development" : "production", // Usar el entorno correcto
  debug: __DEV__, // Activar depuración solo en desarrollo
  _experiments: {
    profilesSampleRate: 1.0, // Tasa de muestreo de perfiles
  },
});

// Captura de errores no manejados
ErrorUtils.setGlobalHandler((error, isFatal) => {
  Sentry.captureException(error); // Enviar error a Sentry
  //console.log(isFatal ? "Fatal error occurred" : "Non-fatal error occurred", error);
});
// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
