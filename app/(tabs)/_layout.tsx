
import React, { useEffect, useState } from "react";
import { LogBox, Platform } from "react-native";
import { Provider, useDispatch, } from "react-redux";
import { supabase } from "@/config/SupabaseConfig";
import AppContainer from "@/app/Navigation/Navigation";
import { registerForPushNotificationsAsync } from "@/common/actions/NotificationService";
import store, { AppDispatch, RootState } from "@/common/store";
import { fetchAndDispatchUserData } from "@/common/actions/userActions";
// Use dynamic import for notifications so we don't trigger auto-registration in Expo Go
import { updatePushToken, updateUserLocation } from "@/common/actions/authactions";
import FirebaseConfig from "@/config/SupabaseConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";
import GetPushToken from "@/components/GetPushToken";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import * as Sentry from "@sentry/react-native";
import { login, logout } from "@/common/reducers/authReducer";
import { checkAppVersion } from "@/hooks/UpdateVersionApp";

// Inicialización de Sentry
Sentry.init({
  dsn: "https://73d67558015f0fd8f8e30c58ed235e99@o4508027327414272.ingest.us.sentry.io/4508042613620736",
 // debug: true,  // Esto muestra logs de depuración en la consola
  tracesSampleRate: 1.0, // Configura qué porcentaje de transacciones deseas rastrear (1.0 es 100%)
  release: 'my-app@1.0.0',
  _experiments: {
    profilesSampleRate: 1.0,
    replaysSessionSampleRate: 1.0,
    replaysOnErrorSampleRate: 1.0,
  }, 
  integrations: [
    Sentry.mobileReplayIntegration({
      maskAllText: true,
      maskAllImages: true,
      maskAllVectors: true,
    }),
  ],
});

const LOCATION_TASK_NAME = 'background-location-task';

// We'll set the notification handler dynamically during initialization.

// Handler para mensajes en segundo plano (solo si está disponible el módulo de messaging)
let _messagingModule = null;
try {
  // intentar requerir el módulo @react-native-firebase/messaging si está instalado
  // lo hacemos en tiempo de ejecución para evitar errores cuando no esté disponible
  // eslint-disable-next-line global-require
  const messagingImport = require('@react-native-firebase/messaging');
  _messagingModule = messagingImport && (typeof messagingImport.default === 'function' ? messagingImport.default : messagingImport);
} catch (e) {
  _messagingModule = null;
}

    if (_messagingModule) {
      try {
        _messagingModule().setBackgroundMessageHandler(async (remoteMessage) => {
          try {
            const { data } = remoteMessage || {};
            if (data) {
              const body = typeof data.body === 'string' ? (JSON.parse(data.body).message || 'Nueva notificación') : 'Nueva notificación';
              try {
                const Notifications = await import('expo-notifications');
                await Notifications.scheduleNotificationAsync({
                  content: { title: data.title || 'Nueva Notificación', body },
                  trigger: null,
                });
              } catch (nerr) {
                console.warn('Could not schedule notification (expo-notifications not available):', nerr);
              }
            }
          } catch (error) {
            console.error('Error manejando el mensaje en segundo plano:', error);
          }
        });
      } catch (err) {
        console.warn('No se pudo configurar setBackgroundMessageHandler:', err);
      }
    } else {
  // Módulo de mensajería no disponible en este entorno (dev client / Expo Go sin plugin)
  // Esto es esperado si no se instaló react-native-firebase/messaging.
}

// Tarea para la captura de ubicación en segundo plano
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data: { locations }, error }) => {
  if (error || !locations?.length) {
    console.error("Error o sin ubicaciones en la tarea de localización:", error);
    return;
  }

  // Check current user via Supabase session
  let user: any = null;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    user = session?.user ?? null;
  } catch (e) {
    user = null;
  }

  if (!user) {
    const isTaskRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
    if (isTaskRegistered) await TaskManager.unregisterTaskAsync(LOCATION_TASK_NAME);
    return;
  }

  const { latitude = 0, longitude = 0 } = locations[locations.length - 1]?.coords || {};
  //console.log(`Ubicación recibida: latitud=${latitude}, longitud=${longitude}`);

  store.dispatch(updateUserLocation(latitude, longitude));
});
//arreglado
const requestPermissions = async () => {
  try {
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    if (foregroundStatus !== 'granted') {
      console.warn("Permiso de localización en primer plano no concedido");
      return false;
    }

    const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
    if (backgroundStatus !== 'granted') {
      console.warn("Permiso de localización en segundo plano no concedido");
      return false;
    }

    //console.log("Permisos concedidos");

    return true;
  } catch (error) {
    console.error("Error al solicitar permisos de localización:", error);
    return false;
  }
};

//solucionado
const startBackgroundLocation = async () => {
  try {
    const hasPermissions = await requestPermissions();
    if (!hasPermissions) return;

    if (!LOCATION_TASK_NAME) {
      console.error("LOCATION_TASK_NAME no está definido.");
      return;
    }

    try {
      const isTaskRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
      if (!isTaskRegistered) {
       // console.log("Iniciando la captura de ubicación en segundo plano...");
        await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
          accuracy: Location.Accuracy.High,
          showsBackgroundLocationIndicator: true,
          activityType: Location.ActivityType.AutomotiveNavigation,
          foregroundService: {
            notificationTitle: 'Servicio de Localización Activo',
            notificationBody: 'La aplicación está rastreando tu ubicación en segundo plano.',
          },
        });
      } else {
       // console.log("La tarea de ubicación en segundo plano ya está registrada.");
      }
    } catch (error) {
      console.error('Error al iniciar la captura de ubicación en segundo plano:', error);
    }
  } catch (error) {
    console.error('Error al solicitar permisos de localización:', error);
  }
};

//arreglado

const startForegroundLocationUpdates = async (dispatch: AppDispatch) => {
  // Verificar que dispatch es una función válida
  if (!dispatch || typeof dispatch !== 'function') {
    console.error("El dispatch proporcionado no es una función válida");
    return;
  }

  let subscription: Location.LocationSubscription | null = null;

  try {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") {
      console.warn("Permiso de ubicación no concedido");
      return;
    }

    // Iniciar la suscripción a las actualizaciones de ubicación
    subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 10000,
        distanceInterval: 50,
      },
      (location) => {
        // Validar que location y location.coords existen
        if (location && location.coords) {
          const { latitude, longitude } = location.coords;

          // Verificar que latitude y longitude son números válidos
          if (
            typeof latitude === "number" &&
            typeof longitude === "number" &&
            !isNaN(latitude) &&
            !isNaN(longitude)
          ) {
            try {
              // Asegurarse de que updateUserLocation está definido
              if (typeof updateUserLocation === "function") {
                dispatch(updateUserLocation(latitude, longitude));
              } else {
                console.error("La función updateUserLocation no está definida");
              }
            } catch (error) {
              console.error("Error al actualizar la ubicación del usuario:", error);
            }
          } else {
            console.warn("Datos de ubicación inválidos recibidos");
          }
        } else {
          console.warn("Objeto de ubicación vacío o inválido recibido");
        }
      }
    );
  } catch (error) {
    console.error("Error al iniciar las actualizaciones de ubicación en primer plano:", error);
  }

  // Retornar la función de limpieza para detener las actualizaciones cuando sea necesario
  return () => {
    if (subscription && typeof subscription.remove === "function") {
      subscription.remove();
    } else {
      console.warn("No se pudo eliminar la suscripción porque es nula o inválida");
    }
  };
};




const RootLayout = () => {
  const [authStateChecked, setAuthStateChecked] = useState(false);
  const dispatch = useDispatch<AppDispatch>();


  useEffect(() => {
    let foregroundSubscription: any = null;
    let backgroundSubscription: any = null;
    let unsubscribeMessage: (() => void) | null = null;

    (async () => {
      try {
        const Notifications = await import('expo-notifications');
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
          }),
        });

        foregroundSubscription = Notifications.addNotificationReceivedListener(() => {});
        backgroundSubscription = Notifications.addNotificationResponseReceivedListener(() => {});

        try {
          if (_messagingModule) {
            const m = typeof _messagingModule === 'function' ? _messagingModule() : _messagingModule;
            if (m && typeof m.onMessage === 'function') {
              unsubscribeMessage = m.onMessage(async (remoteMessage: any) => {
                const { title = 'Nueva Notificación', message = 'Has recibido una nueva notificación' } = remoteMessage.data || {};
                try {
                  await Notifications.scheduleNotificationAsync({ content: { title, body: message }, trigger: null });
                } catch (nerr) {
                  console.warn('Could not schedule notification (expo-notifications not available):', nerr);
                }
              });
            }
          }
        } catch (e) {
          console.warn('Error setting up message listener:', e);
        }
      } catch (e) {
        console.warn('expo-notifications not available; skipping notification listeners', e);
      }
    })();

    return () => {
      try {
        if (foregroundSubscription && typeof foregroundSubscription.remove === 'function') foregroundSubscription.remove();
        if (backgroundSubscription && typeof backgroundSubscription.remove === 'function') backgroundSubscription.remove();
        if (unsubscribeMessage) unsubscribeMessage();
      } catch (err) {
        // ignore cleanup errors
      }
    };
  }, []);

  useEffect(() => {
    // Suppress the verbose expo-notifications Expo Go warning during development.
    // The underlying limitation remains: remote notifications are not available in Expo Go.
    LogBox.ignoreLogs([
      'expo-notifications: Android Push notifications',
      "Couldn't find a screen named 'Home' to use as 'initialRouteName'",
    ]);
    LogBox.ignoreAllLogs(true);

    const initializeApp = async () => {
      try {
        await registerForPushNotificationsAsync();
        if (_messagingModule) {
          const m = typeof _messagingModule === 'function' ? _messagingModule() : _messagingModule;
          if (m && typeof m.onNotificationOpenedApp === 'function') {
            m.onNotificationOpenedApp((remoteMessage: any) => {
              // Manejar la notificación abierta
            });
          }
          if (m && typeof m.getInitialNotification === 'function') {
            const initialNotification = await m.getInitialNotification();
            if (initialNotification) {
              // Manejar la notificación inicial
            }
          }
        }
      } catch (error) {
        console.error('Error initializing app:', error);
      }
    };

    initializeApp();
  }, []);

  useEffect(() => {
    checkAppVersion(dispatch);
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const user = session?.user ?? null;
      if (user) {
        dispatch(login(user));
        try {
          await fetchAndDispatchUserData(user.id, dispatch);
        } catch (e) {
          console.warn('Error fetching user data from Supabase:', e);
        }
        const token = (await GetPushToken()) || "token_error";
        dispatch(updatePushToken(token, Platform.OS === "ios" ? "IOS" : "ANDROID"));
        await startBackgroundLocation();
        await startForegroundLocationUpdates(dispatch);
      } else {
        dispatch(logout());
      }
      setAuthStateChecked(true);
    });

    return () => subscription.unsubscribe();
  }, [dispatch]);
  

  return <AppContainer />;
};

const RootApp: React.FC = () => {
  return (
    <Provider store={store}>
      <RootLayout />
    </Provider>
  );
};

export default RootApp;