import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import axios from 'axios';

export async function registerForPushNotificationsAsync() {
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }

    const token = (await Notifications.getExpoPushTokenAsync()).data;
    ////console.log('Token de expo ' + token);
    return token;
  } else {
    alert('Must use physical device for Push Notifications');
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('customSound', {
      name: 'Custom Sound Channel',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      sound: 'horn.wav',  // Nombre del archivo de sonido
    });
  }
}

// Configure how the notification will be displayed when the app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});



export async function sendPushNotification(token, title, body) {
  try {
    //console.log('Sending push notification:', { token, title, body });

    const response = await axios.post('https://us-central1-treasupdate.cloudfunctions.net/sendNotification', {
      token,
      title,
      body,
      sound: 'default', // Añade otros parámetros si los necesitas
    });

    if (response.status === 200) {
      //console.log('Notification sent successfully');
    } else {
      console.error('Error sending notification:', response.data);
    }
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}