import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  useColorScheme
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import axios from "axios";
import carIcon from "@/assets/images/track_Car.png";
import { AntDesign } from "@expo/vector-icons";
const ReceiveLocationScreen = ({ navigation }) => {
  const [reference, setReference] = useState(""); // Referencia de la reserva
  const [location, setLocation] = useState(null); // Ubicación recibida
  const [isLoading, setIsLoading] = useState(false); // Estado de carga
  const colorScheme = useColorScheme();
  const styles = colorScheme === "dark" ? darkStyles : lightStyles; // Estilos dinámicos

  // Función para obtener la ubicación compartida desde la API
  const getSharedLocation = async () => {
    if (!reference) {
      Alert.alert("Error", "Por favor ingresa una referencia de reserva");
      return;
    }

    setIsLoading(true); // Iniciar el estado de carga

    try {
      const response = await axios.post(
        "https://us-central1-treasupdate.cloudfunctions.net/shareDriverLocation",
        {
          bookingId: reference.trim(), // Usar el bookingId ingresado
        }
      );

      const { location } = response.data;

      if (location) {
        setLocation(location); // Guardar la ubicación recibida
      } else {
        Alert.alert("Error", "No se encontró la ubicación");
      }
    } catch (error) {
      if (error.response) {
        // La solicitud se realizó y el servidor respondió con un código de estado
        // que no está en el rango de 2xx
        console.error("Error de respuesta:", error.response.data);
        Alert.alert(
          "Error",
          error.response.data.error || "No se pudo obtener la ubicación"
        );
      } else if (error.request) {
        // La solicitud se realizó pero no se recibió respuesta
        console.error("Error de solicitud:", error.request);
        Alert.alert("Error", "No se recibió respuesta del servidor");
      } else {
        // Algo sucedió al configurar la solicitud que provocó un error
        console.error("Error:", error.message);
        Alert.alert("Error", "Error al configurar la solicitud");
      }
    } finally {
      setIsLoading(false); // Terminar el estado de carga
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <AntDesign name="arrowleft" size={24} color={colorScheme === 'dark' ? '#fff' : '#000'} />
        </TouchableOpacity>
        <Text style={styles.headerText}>{"Recibir Ubicación Compartida"} </Text>
      </View>

      {/* Input para ingresar la referencia de la reserva */}
      <TextInput
        style={styles.input}
        value={reference}
        onChangeText={setReference}
        placeholder="Introduce la referencia de la reserva"
        placeholderTextColor="#aaa"
      />

      {/* Botón para obtener la ubicación */}
      <TouchableOpacity
        style={styles.button}
        onPress={getSharedLocation}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? "Cargando..." : "Obtener Ubicación"}
        </Text>
      </TouchableOpacity>

      {/* Mostrar estado de carga */}
      {isLoading && (
        <ActivityIndicator size="large" color="#F30505" style={styles.loader} />
      )}

      {/* Mapa para mostrar la ubicación recibida */}
      {location && (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: location.lat,
            longitude: location.lng,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          <Marker
            coordinate={{ latitude: location.lat, longitude: location.lng }}
            title="Ubicación del Conductor"
            image={carIcon}
          />
        </MapView>
      )}
    </View>
  );
};

// Estilos mejorados para una mejor experiencia visual
const lightStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    //justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  headerText: {
    fontSize: 24,
    fontWeight: "600",
    color: "#333",
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: "#fff",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },

  button: {
    backgroundColor: "#F30505",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  loader: {
    marginVertical: 20,
    alignSelf: "center",
  },
  map: {
    marginTop: 20,
    height: 300,
    borderRadius: 10,
    overflow: "hidden",
  },
});
const darkStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#474747",
    //justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  headerText: {
    fontSize: 24,
    fontWeight: "600",
    color: "#fff",
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: "#333",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    color:'#fff'
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },

  button: {
    backgroundColor: "#F30505",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  loader: {
    marginVertical: 20,
    alignSelf: "center",
  },
  map: {
    marginTop: 20,
    height: 300,
    borderRadius: 10,
    overflow: "hidden",
  },
});

export default ReceiveLocationScreen;
