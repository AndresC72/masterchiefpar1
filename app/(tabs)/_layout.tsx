
import React, { useEffect, useState } from "react";
import { LogBox, Platform } from "react-native";
import { Provider, useDispatch, } from "react-redux";
import messaging from "@react-native-firebase/messaging";
import { onAuthStateChanged, getAuth } from "firebase/auth";
import AppContainer from "@/app/Navigation/Navigation";
import { registerForPushNotificationsAsync } from "@/common/actions/NotificationService";
import store, { AppDispatch, RootState } from "@/common/store";
import { fetchAndDispatchUserData } from "@/common/actions/userActions";
import * as Notifications from 'expo-notifications';
import { updatePushToken, updateUserLocation } from "@/common/actions/authactions";
import FirebaseConfig from "@/config/SupabaseConfig";
import { FirebaseProvider, initializeFirebaseApp } from "@/config/configureFirebase";
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

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Handler para mensajes en segundo plano
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  try {
    const { data } = remoteMessage;
    if (data) {
      const body = typeof data.body === 'string' ? JSON.parse(data.body).message || 'Nueva notificación' : 'Nueva notificación';
      await Notifications.scheduleNotificationAsync({
        content: { title: data.title || 'Nueva Notificación', body },
        trigger: null,
      });
    }
  } catch (error) {
    console.error('Error manejando el mensaje en segundo plano:', error);
  }
});

// Tarea para la captura de ubicación en segundo plano
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data: { locations }, error }) => {
  if (error || !locations?.length) {
    console.error("Error o sin ubicaciones en la tarea de localización:", error);
    return;
  }

  const auth = getAuth();
  const user = auth.currentUser;
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
    const foregroundSubscription = Notifications.addNotificationReceivedListener(notification => {});
    const backgroundSubscription = Notifications.addNotificationResponseReceivedListener(response => {});
    const messageSubscription = messaging().onMessage(async (remoteMessage) => {
      const { title = 'Nueva Notificación', message = 'Has recibido una nueva notificación' } = remoteMessage.data || {};
      await Notifications.scheduleNotificationAsync({ content: { title, body: message }, trigger: null });
    });

    return () => {
      foregroundSubscription.remove();
      backgroundSubscription.remove();
      messageSubscription();
    };
  }, []);

  useEffect(() => {
    LogBox.ignoreAllLogs(true);

    const initializeApp = async () => {
      try {
        await registerForPushNotificationsAsync();
        messaging().onNotificationOpenedApp((remoteMessage) => {
          // Manejar la notificación abierta
        });
        const initialNotification = await messaging().getInitialNotification();
        if (initialNotification) {
          // Manejar la notificación inicial
        }
      } catch (error) {
        console.error('Error initializing app:', error);
        // Considerar reportar este error a Sentry
      }
    };

    initializeApp();
  }, []);

  useEffect(() => {
    checkAppVersion(dispatch);
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        dispatch(login(user)); // Actualiza el estado de autenticación
        await fetchAndDispatchUserData(user.uid, dispatch);
        const token = (await GetPushToken()) || "token_error";
        dispatch(updatePushToken(token, Platform.OS === "ios" ? "IOS" : "ANDROID"));
        await startBackgroundLocation();
        await startForegroundLocationUpdates(dispatch);
      } else {
        dispatch(logout()); // Maneja el caso donde no hay usuario autenticado
      }
      setAuthStateChecked(true);
    });
  
    return () => unsubscribe();
  }, [dispatch]);
  

  return <AppContainer />;
};

const RootApp: React.FC = () => {

  useEffect(() => {
    initializeFirebaseApp();
  }, []);

  return (
    <Provider store={store}>
      <FirebaseProvider config={FirebaseConfig} AsyncStorage={AsyncStorage}>
        <RootLayout />
      </FirebaseProvider>
    </Provider>
  );
};

export default RootApp;