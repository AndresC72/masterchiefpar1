
import * as Notifications from "expo-notifications";
import messaging from "@react-native-firebase/messaging";

export const setupNotificationHandler = () => {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
};

export const registerForPushNotificationsAsync = async () => {
  try {
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    return token;
  } catch (error) {
    console.error("Error getting push token", error);
    return null;
  }
};

export const handleNotificationEvents = () => {
  messaging().onNotificationOpenedApp((remoteMessage) => {
    //console.log(
      "Notification caused app to open from background state:",
      remoteMessage.notification
    );
  });

  messaging()
    .getInitialNotification()
    .then((initialNotification) => {
      if (initialNotification) {
        //console.log(
          "Notification caused app to open from quit state:",
          initialNotification.notification
        );
      }
    });

  messaging().onMessage(async (remoteMessage) => {
    //console.log("A new FCM message arrived!", remoteMessage);
  });
};
