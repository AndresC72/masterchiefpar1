import React from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ImageBackground,
  Image,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons, AntDesign } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import { RootState } from "@/common/store";
import { useColorScheme } from "react-native";
type Props = NativeStackScreenProps<any>;

const CarnetScreen = ({ navigation }: Props) => {
  const colorScheme = useColorScheme();
  const user = useSelector((state: RootState) => state.auth.user);
  const styles = colorScheme === "dark" ? darkStyles : lightStyles; // Estilos dinámicos


  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <AntDesign name="arrowleft" size={24} color={colorScheme === "dark" ? "#FFFFFF" : "black"} />
        </TouchableOpacity>
        <Text style={styles.headerText}>{"Carnet"} </Text>
        <Ionicons
          name="barcode-outline"
          size={24}
          color="black"
          style={styles.headerIcon}
        />
      </View>
      <ImageBackground
        source={user?.usertype === 'customer' ? require("./../../assets/images/cardid_rider.png") : require("./../../assets/images/cardid_driver.png") }
        resizeMode="cover"
        style={styles.background}
      >
        <View style={styles.container1}>
          <View
            style={{
              width: "100%",
              alignItems: "flex-end",
              right: 22,
              bottom: "5%",
            }}
          >
            <Image
              source={
                user?.profile_image
                  ? { uri: user.profile_image }
                  : require("@/assets/images/profile.png")
              }
              style={styles.profileImage}
            />
          </View>

          <View style={{ left: 30, bottom: "10%" }}>
            <Text style={styles.profileName}>
              {user?.firstName || "Nombre no disponible"}{" "}
              {user?.lastName || "Apellido no disponible"}
            </Text>
            <Text style={styles.profileName}>
              {user?.email || "Email no disponible"}
            </Text>
            <Text style={styles.profileName}>
              {user?.mobile || "Móvil no disponible"}
            </Text>
            <Text style={styles.profileName}>
              Codigo de Referido:{" "}
              <Text style={styles.referralId}>
                {user?.referralId || "ID de referencia no disponible"}
              </Text>
            </Text>
            <Text style={styles.profileName}>
              {user?.docType || "Tipo de documento no disponible"}{" "}
              {user?.verifyId || "ID no verificado"}
            </Text>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
};
const lightStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    padding: 20,
  },
  headerTitleStyle: {
    color: "#FFF",
    fontFamily: "SpaceMono",
    fontSize: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
  },
  headerIcon: {
    backgroundColor: "#E0E0E0",
    borderRadius: 12,
    padding: 4,
  },
  background: {
    flex: 1,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 100,
    marginBottom: 20,
    marginHorizontal: 10,
  },
  container1: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
  },
  profileName: {
    fontSize: 20,
    fontWeight: "bold",
  },
  referralId: {
    fontSize: 18,
    color: "#F20505",
  },
});
const darkStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#474747",
    padding: 20,
  },
  headerTitleStyle: {
    color: "#FFF",
    fontFamily: "SpaceMono",
    fontSize: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  headerIcon: {
    backgroundColor: "#E0E0E0",
    borderRadius: 12,
    padding: 4,
  },
  background: {
    flex: 1,
    borderRadius: 10,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 100,
    marginBottom: 20,
    marginHorizontal: 10,
  },
  container1: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
  },
  profileName: {
    fontSize: 20,
    fontWeight: "bold",
  },
  referralId: {
    fontSize: 18,
    color: "#F20505",
  },
});


export default CarnetScreen;
