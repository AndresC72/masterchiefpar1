// src/utils/NotificationFunctions.ts
import { app } from "@/config/SupabaseConfig";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// Obtener la instancia de Firebase Messaging
const messaging = getMessaging(app);

export const sendNotification = async (token: string, title: string, body: string) => {
  const message = {
    notification: {
      title,
      body,
    },
    to: token,
  };

  try {
    await fetch("https://fcm.googleapis.com/fcm/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `key=${process.env.FIREBASE_SERVER_KEY}`,
      },
      body: JSON.stringify(message),
    });
    //console.log("Notificación enviada con éxito");
  } catch (error) {
    console.error("Error al enviar la notificación:", error);
  }
};

// Función para obtener el token de notificación
export const getNotificationToken = async () => {
  try {
    const token = await getToken(messaging, { vapidKey: process.env.FIREBASE_VAPID_KEY });
    if (token) {
      //console.log("Token de notificación obtenido:", token);
      return token;
    } else {
      //console.log("No se pudo obtener el token de notificación.");
      return null;
    }
  } catch (error) {
    console.error("Error al obtener el token de notificación:", error);
    return null;
  }
};

// Función para escuchar mensajes en primer plano
export const onMessageListener = () => {
  onMessage(messaging, (payload) => {
    //console.log("Mensaje recibido en primer plano:", payload);
    // Aquí puedes manejar el mensaje como desees
  });
};



export const sendRideShareNotification = async (userId, rideData) => {
  const payload = {
    notification: {
      title: "Viaje Compartido",
      body: `Tienes un viaje compartido disponible. ¿Aceptar?`,
    },
    data: {
      bookingId: rideData.bookingId,
      driverLocation: JSON.stringify(rideData.driverLocation),
    },
  };

  // Obtener el token de notificación del usuario
  const userToken = await getUserPushToken(userId);
  await admin.messaging().sendToDevice(userToken, payload);
};