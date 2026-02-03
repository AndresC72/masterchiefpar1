import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import { AppConfig } from '@/config/AppConfig';
import messaging from '@react-native-firebase/messaging';

export default async function GetPushToken() {

  let token;
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      return;
    }
    const ref = { projectId: AppConfig.expo_project_id };
    token = (await Notifications.getExpoPushTokenAsync(ref)).data;
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('messages', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor:'#F20505',
      sound: 'default'
    });
    Notifications.setNotificationChannelAsync('bookings', {
      name: 'Booking notifications',
      sound: 'horn.wav',
    });
    Notifications.setNotificationChannelAsync('bookings-repeat', {
      name: 'Booking long notifications',
      sound: 'repeat.wav',
    });
  }
  return token;
}


export async function registerForPushNotificationsAsync() {
  await messaging().requestPermission();
  const token = await messaging().getToken();
  //console.log("FCM Token:", token);
  return token;
}