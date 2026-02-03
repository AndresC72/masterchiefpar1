import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useSelector } from "react-redux";
import { RootState } from "./../../common/store";
import LoginScreen from "./../login/LoginScreen";
import SignUp from "./../login/SignUp";
import TabNavigator from "@/components/TabNavigator";
import CustomerSupport from "@/app/(tabs)/CustomerSupport";
import WalletDetails from "@/app/(tabs)/WalletDetails";
import Myfamily from "@/app/(tabs)/Myfamily";
import CarnetScreen from "@/app/(tabs)/CarnetScreen";
import SearchScreen from "@/app/(tabs)/SearchScreen"
import EmailVerificationScreen from "@/app/login/EmailVerification"
import BookingScreen from "@/app/(tabs)/BookingScreen"
import carEditScreens from "@/app/Vehicle/CarsEditScreen"
import CarsScreen from "@/app/Vehicle/carScreen";
import Prelogin from "./../login/PreLogin";
import BookingCabScreen from "@/app/Booking/BookingCabScren"
import WebViewLayout from "../(tabs)/WebViewLayout";
import DocumentsScreen from "../(tabs)/DocumentsScreen";
import ImageGalleryComponent from "@/components/ImageGalleryComponent";
import GeneralScreen from "../(tabs)/GeneralScreen";
import ActiveBookingScren from "../Booking/ActiveBookingScreen";
import ComplainScreen from "../(tabs)/ComplainScreen";
import PaymentDetails from "../(tabs)/PaymentDeais";
import DriverRating from "../(tabs)/DriverRating";
import { Platform } from "react-native";
import DriverIncomeScreen from "../(tabs)/DriverIncomeScreen";
import ChatScreen from "../(tabs)/OnlineChat"
import NavigationWebView from "../Booking/NavigationWebView"
import Memberships from "../Subscription/Memberships";
import SubscriptionScreen from "../Subscription/SubscriptionScreen";
import ChosePlan from "../Subscription/ChosePlan";
import DaviplataPayment from "../Daviplata/Daviplata";
import Insurance from "../(tabs)/Insurance";
import Segurity from "../(tabs)/Segurity";
import ReceiveLocationScreen from "../(tabs)/ReceiveLocationScreen";
import SecurityContactScreen from "../(tabs)/SecurityContactScreen";
import UserLookupScreen from "../(tabs)/UserLookupScreen";
import MapScreen from "../(tabs)/mapaSensors";

import UpdatesScreen from '../(tabs)/UpdatesScreen';

const Stack = createStackNavigator();

const Navigation = () => {
  
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );
  
  return (
    <Stack.Navigator
      screenOptions={{
        animationTypeForReplace: 'pop',
        headerShown: false,
        animationEnabled:   Platform.OS == 'android'? false: true,
      }}
    >
      {isAuthenticated ? (
        <Stack.Group screenOptions={{ headerShown: false }}>
          <Stack.Screen name="HomeScreen" component={TabNavigator} />
          <Stack.Screen name="Search" component={SearchScreen} />
          <Stack.Screen name="Soporte" component={CustomerSupport} />
          <Stack.Screen name="Carnet" component={CarnetScreen} />
          <Stack.Screen name="Wallet" component={WalletDetails} />
          <Stack.Screen name="Myfamily" component={Myfamily} />
          <Stack.Screen name="BookingS" component={BookingScreen} />
          <Stack.Screen name="CarsEdit" component={carEditScreens} />
          <Stack.Screen name="CarsScreen" component={CarsScreen} />
          <Stack.Screen name="Booking" component={BookingCabScreen} />
          <Stack.Screen name="NavigationWebView" component={NavigationWebView} />
          <Stack.Screen name="Complain" component={ComplainScreen} />
          <Stack.Screen name="WebViewLayout" component={WebViewLayout} />
          <Stack.Screen name="Docs" component={DocumentsScreen } />
          <Stack.Screen name="ImageGallery" component={ImageGalleryComponent} />
          <Stack.Screen name="Payment" component={PaymentDetails} />
          <Stack.Screen name="General" component={GeneralScreen} />
          <Stack.Screen name="BookingActive" component={ActiveBookingScren} />
          <Stack.Screen name="Rating" component={DriverRating} />
          <Stack.Screen name="MyEarning" component={DriverIncomeScreen} />
          <Stack.Screen name="EmailVerificationScreen" component={EmailVerificationScreen} />
          <Stack.Screen name="Chat" component={ChatScreen} />
          <Stack.Screen name="SubscriptionScreen" component={SubscriptionScreen} />
          <Stack.Screen name="ChosePlan" component={ChosePlan} />
          <Stack.Screen name="Memberships" component={Memberships} />
          <Stack.Screen name="DaviplataPayment" component={DaviplataPayment} />
          <Stack.Screen name="Insurance" component={Insurance} />
          <Stack.Screen name="Segurity" component={Segurity} />
          <Stack.Screen name="ReceiveLocation" component={ReceiveLocationScreen} />
          <Stack.Screen name="SecurityContact" component={SecurityContactScreen} />
          <Stack.Screen name="UserLookup" component={UserLookupScreen} />
          <Stack.Screen name="MapSensors" component={MapScreen} />
          <Stack.Screen name="Updates" component={UpdatesScreen} />
        </Stack.Group>
      ) : (
        <Stack.Group screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Prelogin" component={Prelogin} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignUp" component={SignUp} />
          
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
};

export default Navigation;
