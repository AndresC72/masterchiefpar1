import React, { useMemo } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import HomeScreen from "@/app/(tabs)/index";
import ProfileScreen from "@/app/(tabs)/ProfileScreen";
import WalletScreen from "@/app/(tabs)/WalletDetails";
import CustomerMap from "@/app/(tabs)/CustomerMap";
import CarsScreen from "@/app/Vehicle/carScreen";
import ActiveBookingScreen from "@/app/Booking/ActiveBookingScreen";
import { useSelector } from "react-redux";
import { RootState } from "@/common/store";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { Platform, Dimensions, useColorScheme, StyleSheet } from "react-native";
import { colors } from "@/scripts/theme";

const Tab = createBottomTabNavigator();
const { height, width } = Dimensions.get("window");

const useHasNotch = () => {
  return Platform.OS === "ios" &&
    !Platform.isPad &&
    !Platform.isTVOS &&
    [780, 812, 844, 852, 896, 926, 932].some(
      size => height === size || width === size
    );
};

const TabNavigator: React.FC = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const hasNotch = useHasNotch();
  const colorScheme = useColorScheme();

  const tabBarActiveTintColor = "#F20505";
  const tabBarInactiveTintColor = colorScheme === 'dark' ? '#888888' : colors.HEADER;

  const tabBarStyle = {
    backgroundColor: colorScheme === 'dark' ? '#000000' : '#FFFFFF',
    height: hasNotch ? 80 : 55,
  };

  const initialRoute = useMemo(() => {
    if (user?.usertype === "driver") return "Map";
    if (user?.usertype === "customer") return "CustMap";
    return "Home";
  }, [user]);

  const tabScreens = useMemo(() => {
    const screens = [];

    if (user?.usertype === "driver") {
      screens.push(
        {
          name: "Map",
          component: HomeScreen,
          title: "Inicio",
          icon: "map-outline",
        },
        {
          name: "Wallet",
          component: WalletScreen,
          title: "Billetera",
          icon: "card-outline",
        },
        {
          name: "CarsScreen",
          component: CarsScreen,
          title: "Vehiculo",
          icon: "car-outline",
        }
      );
    }

    if (user?.usertype === "customer") {
      screens.push({
        name: "CustMap",
        component: CustomerMap,
        title: "Mapa",
        icon: "map-outline",
      });
    }

    screens.push(
      {
        name: "RideList",
        component: ActiveBookingScreen,
        title: "Historial",
        icon: "book",
        badge: true,
        badgeCount: user?.activeBookings?.length || 0,
      },
      {
        name: "Profile",
        component: ProfileScreen,
        title: "Perfil",
        icon: "person-outline",
      }
    );

    return screens;
  }, [user]);

  return (
    <Tab.Navigator
      initialRouteName={initialRoute}
      screenOptions={({ route }) => {
        const screen = tabScreens.find(s => s.name === route.name);
        return {
          animationEnabled: Platform.OS !== "android",
          tabBarIcon: ({ color, size }) => {
            const iconName = screen?.icon;
            if (iconName) {
              const IconComponent = AntDesign.name === iconName ? AntDesign : Ionicons;
              return <IconComponent name={iconName} size={size} color={color} />;
            }
            return null;
          },
          tabBarActiveTintColor,
          tabBarInactiveTintColor,
          tabBarBadge:
            screen?.badge && screen.badgeCount > 0 ? screen.badgeCount : undefined,
          tabBarBadgeStyle: styles.badge,
          tabBarStyle,
          tabBarLabelStyle: styles.label,
        };
      }}
    >
      {tabScreens.map(screen => (
        <Tab.Screen
          key={screen.name}
          name={screen.name}
          component={screen.component}
          options={{
            headerShown: false,
            title: screen.title,
          }}
        />
      ))}
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  badge: {
    transform: [{ scaleX: 1 }],
  },
  label: {
    fontSize: 14,
    transform: [{ scaleX: 1 }],
  },
});

export default TabNavigator;
