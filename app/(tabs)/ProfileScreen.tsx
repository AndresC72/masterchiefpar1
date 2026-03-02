import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Share,
  Linking,
  Alert,
  useColorScheme,
  ScrollView,
} from "react-native";
import {
  Ionicons,
  AntDesign,
  FontAwesome5, 
  MaterialIcons,
} from "@expo/vector-icons";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/common/store";
import supabase from '@/config/SupabaseConfig';
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { settings } from "@/scripts/settings";
import { logout } from "@/common/reducers/authReducer";
import { AppConfig } from '@/config/AppConfig';
import * as Updates from 'expo-updates';
import UpdatesScreen from './UpdatesScreen';
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';

type Props = NativeStackScreenProps<any>;

const ProfileScreen = ({ navigation }: Props) => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!session) {
        navigation.navigate("Login");
      }
    });
    checkAppVersion();
    return () => subscription.unsubscribe();
  }, [navigation]);

  const handleLogout = async () => {
    try {
      setLoading(true);
      console.log("Iniciando logout...");
      
      // Detener ubicación en background si es conductor
      if ((user as any)?.usertype === "driver") {
        console.log("Deteniendo ubicación en background...");
        await StopBackgroundLocation();
      }
      
      // Limpiar estado de Redux primero
      console.log("Limpiando estado de Redux...");
      dispatch(logout());
      
      // Cerrar sesión en Supabase
      console.log("Cerrando sesión en Supabase...");
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error en Supabase logout:", error.message);
        throw error;
      }
      
      console.log("Sesión cerrada exitosamente");
      
      // Navegar directamente a Login
      setLoading(false);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
      
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      Alert.alert("Error", `No se pudo cerrar sesión: ${errorMessage}`);
      setLoading(false);
    }
  };

  const StopBackgroundLocation = async () => {
    const tasks = await TaskManager.getRegisteredTasksAsync();
    tasks.forEach((task) => {
      if (task.taskName === "background-location-task") {
        Location.stopLocationUpdatesAsync("background-location-task");
      }
    });
  };

  const refer = () => {
    const message = settings.bonus > 0
      ? `${(user as any).firstName} ya se mueve con T+Plus y te invita a que seas parte de este cambio para la movilidad. Descarga, regístrate y disfruta de este bono en tu próximo servicio. ${settings.code} ${settings.bonus}.\nCódigo :${(user as any).referralId}\n ${settings.DinamikLink}`
      : `share_msg_no_bonus\napp_link${Platform.OS === "ios" ? settings.AppleStoreLink : settings.PlayStoreLink}`;
    Share.share({ message });
  };

  const sos = () => {
    Alert.alert('SOS', '¿Desea llamar a emergencia?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'ok', onPress: () => {
          const call_link = Platform.OS === 'android' ? `tel:${settings.panic}` : `telprompt:${settings.panic}`;
          Linking.openURL(call_link);
        }
      }
    ]);
  };

  const benefits = () => Linking.openURL("https://treasapp.com/beneficios").catch(console.error);

  const handleDrivers = () => Linking.openURL("https://wa.me/message/7V3R76HEVVVYL1").catch(console.error);

  const checkAppVersion = async () => {
    const currentVersion = AppConfig.ios_app_version;
    // AppVersion ya se actualiza en el servidor
  };

  const dynamicStyles = styles(isDarkMode);

  return (
    <View style={dynamicStyles.container}>
      <View style={dynamicStyles.profileContainer}>
        <Image
          source={(user as any)?.profile_image ? { uri: (user as any).profile_image } : require("@/assets/images/profile.png")}
          style={dynamicStyles.profileImage}
        />
        <View>
          <Text style={dynamicStyles.profileName}>{(user as any)?.firstName} {(user as any)?.lastName}</Text>
          <Text style={dynamicStyles.profileSubtitle}>{(user as any)?.CompanyName}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={dynamicStyles.menuContainer}>
          <TouchableOpacity style={dynamicStyles.menuItem} onPress={() => navigation.navigate("Docs")}>
            <AntDesign name="idcard" size={24} color="#F20505" />
            <Text style={dynamicStyles.menuText}>Configuración de perfil</Text>
            <Ionicons name="chevron-forward-outline" size={24} color="#F20505" />
          </TouchableOpacity>

          {(user as any)?.usertype === "customer" ? (
            <TouchableOpacity style={dynamicStyles.menuItem} onPress={() => navigation.navigate("Search")}>
              <FontAwesome5 name="search-location" size={24} color="#F20505" />
              <Text style={dynamicStyles.menuText}>Mis lugares</Text>
              <Ionicons name="chevron-forward-outline" size={24} color="#F20505" />
            </TouchableOpacity>
          ) : null}
   {/* 
   <TouchableOpacity style={dynamicStyles.menuItem} onPress={() => navigation.navigate("MyEarning")}>
              <MaterialIcons name="attach-money" size={24} color="red" />
              <Text style={dynamicStyles.menuText}>Mis Ganancias</Text>
              <Ionicons name="chevron-forward-outline" size={24} color="#F20505" />
            </TouchableOpacity>
   */}
          <TouchableOpacity style={dynamicStyles.menuItem} onPress={() => navigation.navigate("Carnet")}>
            <AntDesign name="idcard" size={24} color="#F20505" />
            <Text style={dynamicStyles.menuText}>Carnet</Text>
            <Ionicons name="chevron-forward-outline" size={24} color="#F20505" />
          </TouchableOpacity>

          <TouchableOpacity style={dynamicStyles.menuItem} onPress={() => navigation.navigate('SecurityContact')}>
            <AntDesign name="contacts" size={24} color="#F20505" />
            <Text style={dynamicStyles.menuText}>Contacto de seguridad</Text>
            <Ionicons name="chevron-forward-outline" size={24} color="#F20505" />
          </TouchableOpacity>

          <TouchableOpacity style={dynamicStyles.menuItem} onPress={() => navigation.navigate("ReceiveLocation")}>
            <MaterialIcons name="share-location" size={24} color="#F20505" />
            <Text style={dynamicStyles.menuText}>Viaje Compartido</Text>
            <Ionicons name="chevron-forward-outline" size={23} color="#F20505" />
          </TouchableOpacity>

          <TouchableOpacity style={dynamicStyles.menuItem} onPress={() => navigation.navigate("Soporte")}>
            <Ionicons name="chatbubble-ellipses-outline" size={24} color="#F20505" />
            <Text style={dynamicStyles.menuText}>Chat con TREAS</Text>
            <Ionicons name="chevron-forward-outline" size={24} color="#F20505" />
          </TouchableOpacity>

          <TouchableOpacity style={dynamicStyles.menuItem} onPress={benefits}>
            <Ionicons name="log-out-outline" size={24} color="#F20505" />
            <Text style={dynamicStyles.menuText}>Beneficios</Text>
            <Ionicons name="chevron-forward-outline" size={24} color="#F20505" />
          </TouchableOpacity>

          <TouchableOpacity style={dynamicStyles.menuItem} onPress={refer}>
            <AntDesign name="share-alt" size={24} color="#F20505" />
            <Text style={dynamicStyles.menuText}>Comparte y gana</Text>
            <Ionicons name="chevron-forward-outline" size={24} color="#F20505" />
          </TouchableOpacity>

          <TouchableOpacity style={dynamicStyles.menuItem} onPress={sos}>
            <MaterialIcons name="sos" size={24} color="#F20505" />
            <Text style={dynamicStyles.menuText}>SOS</Text>
            <Ionicons name="chevron-forward-outline" size={23} color="#F20505" />
          </TouchableOpacity>

          {(user as any)?.usertype === "driver" && (
            <>
              <TouchableOpacity style={dynamicStyles.menuItem} onPress={() => navigation.navigate("Insurance")}>
                <MaterialIcons name="security" size={24} color="#F20505" />
                <Text style={dynamicStyles.menuText}>Aseguradora</Text>
                <Ionicons name="chevron-forward-outline" size={23} color="#F20505" />
              </TouchableOpacity>

              <TouchableOpacity style={dynamicStyles.menuItem} onPress={handleDrivers}>
                <Image
                  source={require("@/assets/images/iconos3d/DriversClub.png")}
                  style={{ height: 30, width: 30, borderRadius: 50 }}
                />
                <Text style={dynamicStyles.menuText}>Pertenece a Drivers Club</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity style={dynamicStyles.menuItem} onPress={() => navigation.navigate("Complain")}>
            <Ionicons name="help-buoy-outline" size={24} color="#F20505" />
            <Text style={dynamicStyles.menuText}>Quejas</Text>
            <Ionicons name="chevron-forward-outline" size={23} color="#F20505" />
          </TouchableOpacity>
          
  
          <TouchableOpacity style={dynamicStyles.menuItem} onPress={handleLogout} disabled={loading}>
            <Ionicons name="log-out-outline" size={24} color="#F20505" />
            <Text style={dynamicStyles.menuText}>{loading ? "Cerrando..." : "Cerrar Sesión"}</Text>
            <Ionicons name="chevron-forward-outline" size={24} color="#F20505" />
          </TouchableOpacity>

          <TouchableOpacity style={dynamicStyles.menuItem} onPress={() => navigation.navigate("Updates")}>
            <Text style={dynamicStyles.menuText}>Ver Actualizaciones</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <Text style={dynamicStyles.version}>RT {AppConfig.runtime_Version} V {AppConfig.ios_app_version}  B {AppConfig.android_app_version}</Text>

    </View>
  );
};

// Función para crear estilos dinámicos
const styles = (isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDarkMode ? "#121212" : "white",
    paddingTop: 40,
  },
  profileContainer: {
    flexDirection: "row",
    margin: 20,
    borderBottomWidth: 0.2,
    borderBottomColor: isDarkMode ? "#444" : "#ddd",
    alignItems: "center",
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 20,
    marginRight: 10,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "bold",
    width: 240,
    color: isDarkMode ? "#fff" : "#000",
  },
  profileSubtitle: {
    color: isDarkMode ? "#aaa" : "gray",
  },
  menuContainer: {
    marginHorizontal: 20,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    borderBottomColor: isDarkMode ? "#444" : "#ddd",
    borderBottomWidth: 1,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 10,
    fontWeight: "bold",
    color: isDarkMode ? "#fff" : "#000",
  },
  version: {
    textAlign: "center",
    color: isDarkMode ? "#aaa" : "gray",
    marginTop: 20,
    fontSize: 16,
  },
});



export default ProfileScreen;
