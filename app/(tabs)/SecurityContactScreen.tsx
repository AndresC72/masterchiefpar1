import { fonts } from "@/scripts/font";
import { colors } from "@/scripts/theme";
import { AntDesign } from "@expo/vector-icons";
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  useColorScheme,
} from "react-native";
import { useSelector } from "react-redux";

const SecurityContactScreen = ({ navigation }) => {
  const handleContactLookup = () => {
    navigation.navigate("UserLookup"); // Navegar a la pantalla de búsqueda de usuario
  };

  const user = useSelector((state) => state.auth.user);
  const backupContacts = user.backupContacts
    ? Object.keys(user.backupContacts).map((key) => ({
        ...user.backupContacts[key],
        id: key, // Incluimos el número del contacto como ID
      }))
    : []; // Asegúrate de que sea un array

  // Detectar si el modo oscuro está activo
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  const renderBackupContact = ({ item }) => (
    <View style={[styles.card, isDarkMode ? styles.cardDark : {}]}>
      <Text style={[styles.cardTitle, isDarkMode ? styles.textDark : {}]}>Contacto #{item.id}</Text>
      <Text style={[styles.cardText, isDarkMode ? styles.textDark : {}]}>Nombre: {item.name}</Text>
      <Text style={[styles.cardText, isDarkMode ? styles.textDark : {}]}>Teléfono: {item.mobile}</Text>
    </View>
  );

  return (
    <View style={[styles.container, isDarkMode ? styles.containerDark : {}]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <AntDesign name="arrowleft" size={24} color={isDarkMode ? "white" : "black"} />
        </TouchableOpacity>
        <Text style={[styles.headerText, isDarkMode ? styles.textDark : {}]}>
          {"Contacto de Seguridad"} 
        </Text>
      </View>
    
      <Text style={[styles.description, isDarkMode ? styles.textDark : {}]}>
        Aquí puedes buscar y gestionar tus contactos de seguridad. Ten en cuenta que para que tu contacto pueda visualizar tu ubicación, debe tener instalada la app de TREASAPP.
      </Text>
      <TouchableOpacity style={styles.button} onPress={handleContactLookup}>
        <Text style={styles.buttonText}>Marcar como Contacto de Respaldo</Text>
      </TouchableOpacity>

      <FlatList
        data={backupContacts}
        renderItem={renderBackupContact}
        keyExtractor={(item) => item.id.toString()}
        style={styles.contactList}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    backgroundColor: "#F7F7F7", // Fondo claro
  },
  containerDark: {
    backgroundColor: "#121212", // Fondo oscuro
  },
  description: {
    fontSize: 16,
    marginBottom: 20,
    color: "#333", // Texto claro
  },
  textDark: {
    color: "#FFF", // Texto oscuro
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
  contactList: {
    marginTop: 20,
  },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  cardDark: {
    backgroundColor: "#1E1E1E",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#333", // Texto claro
  },
  cardText: {
    fontSize: 16,
    color: "#333", // Texto claro
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  headerText: {
    fontSize: 24,
    fontFamily: fonts.Bold,
    color: colors.HEADER, // Depende del tema
  },
});

export default SecurityContactScreen;