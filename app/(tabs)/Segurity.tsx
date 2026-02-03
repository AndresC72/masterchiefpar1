import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Share,
  Linking
} from "react-native";
import axios from "axios";
import { useSelector } from "react-redux";

const SecurityScreen = ({ route }) => {
  const { booking } = route.params; // Recibir booking de la navegación
  const [reference, setReference] = useState(""); // Estado para la referencia de la reserva
  const [isLoading, setIsLoading] = useState(false); // Estado para manejar la carga
  const user = useSelector((state) => state.auth.user);
  // Función para compartir la ubicación del conductor
  const shareLocation = async () => {
    try {
      const response = await axios.post(
        "https://us-central1-treasupdate.cloudfunctions.net/shareDriverLocation",
        { bookingId: booking.id }
      );

      const { location } = response.data;
      if (location) {
        const dynamicLink = `https://treasapp.page.link/app?screen=ReceiveLocation`; // Link actualizado con bookingId
        const shareMessage = `Ubicación de ${booking.driver_name}: ${dynamicLink}. Con este ID podrás ver mi ubicación en viaje compartido: ${booking.id}`;
        console.log(dynamicLink);

        // Compartir a WhatsApp
        user.backupContacts.forEach(contact => {
          const whatsappUrl = `https://api.whatsapp.com/send?phone=${contact.mobile}&text=${encodeURIComponent(shareMessage)}`;
          Linking.openURL(whatsappUrl); // Abrir WhatsApp con el mensaje
        });

        // Mostrar contactos de respaldo
        user.backupContacts.forEach(contact => {
          const contactMessage = `${contact.firstName} (${contact.mobile}) te ha compartido la ubicación.`;
          Alert.alert("Contacto Compartido", contactMessage);
        });
      } else {
        Alert.alert("Error", "No se encontró la ubicación del conductor");
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo compartir la ubicación");
      console.error("Error al compartir la ubicación:", error);
    }
  };


  return (
    <View style={styles.container}>
      <Text style={styles.title}>Seguridad - Compartir/Recibir Ubicación</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={shareLocation}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? "Cargando..." : "Compartir Ubicación"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// Estilos mejorados
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f7f7",
    padding: 20,
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  label: {
    fontSize: 16,
    color: "#555",
    marginBottom: 10,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: "#fff",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#F20505",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default SecurityScreen;
