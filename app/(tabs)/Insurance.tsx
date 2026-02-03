import React from "react";
import {
  StyleSheet,
  View,
  Image,
  Text,
  Button,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import aseguradora from "@/assets/images/Aseguradora.png";
import { AntDesign } from "@expo/vector-icons";
import { useColorScheme } from "react-native";
const Insurance = () => {
  const colorScheme = useColorScheme();
  const navigation = useNavigation(); // Hook para la navegación
  const styles = colorScheme === "dark" ? darkStyles : lightStyles; // Estilos dinámicos

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <AntDesign name="arrowleft" size={24} color={colorScheme === "dark" ? "#FFFFFF" : "black"} />
        </TouchableOpacity>
        <Text style={styles.headerText}>{"Aseguradora Vigente"} </Text>
      </View>
      <View style={styles.imageContainer}>
        <Image source={aseguradora} style={styles.image} />
      </View>

      <Text style={styles.details}>
        Si tu Categoría es TREAS-E, TREAS-Van o TREAS-T esta póliza 000706546795
        cubre todos los servicios con medio de pago Empresarial en caso de
        accidente y cubre a los ocupantes del vehículo incluido el conductor en
        todos los casos siempre y cuando, se encuentren en servicio por medio
        del app y con el servicio Activo.” ”Para el caso de TREAS-X la póliza
        cubrirá cualquier accidente a las personas que se encuentren en el
        momento del servicio y sean afectadas producto del siniestro, incluido
        el conductor, siempre y cuando se encuentren en servicio por medio del
        app y con servicio Activo.
      </Text>
      <Text style={styles.footer}>
        Asegúrate mantener actualizada la información de tu perfil, personal y
        de tu vehículo, para garantizar la cobertura anteriormente detallada,
        dado que la responsabilidad de la idoneidad y correcta actualización de
        la información recae en el Usuario Conductor que presta los servicios
        como proveedor independiente con TREASAPP.
      </Text>
    </View>
  );
};

const lightStyles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: "#F7F7F7",
  },
  image: {
    width: 300,
    height: 300,
    marginBottom: 20,
  },
  imageContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 10,
    color: "#666",
  },
  details: {
    fontSize: 14,
    textAlign: "justify",
    marginBottom: 20,
    color: "#888",
    top: 30,
  },
  footer: {
    fontSize: 14,
    textAlign: "justify",
    color: "#999",
    fontStyle: "italic",
    top: 30,
  },
  button: {
    marginTop: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    top: 10
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
  },
});
const darkStyles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: "#474747",
  },
  image: {
    width: 300,
    height: 300,
    marginBottom: 20,
  },
  imageContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 10,
    color: "#666",
  },
  details: {
    fontSize: 14,
    textAlign: "justify",
    marginBottom: 20,
    color: "#fff",
    top: 30,
  },
  footer: {
    fontSize: 14,
    textAlign: "justify",
    color: "#fff",
    fontStyle: "italic",
    top: 30,
  },
  button: {
    marginTop: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    top: 10
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
});
export default Insurance;
