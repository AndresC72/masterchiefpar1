import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  FlatList,
} from "react-native";
import { database } from "../../config/SupabaseConfig"; 
import { ref, get } from "firebase/database"; 
import { useDispatch, useSelector } from "react-redux"; 
import { updateProfile } from "@/common/actions/authactions"; 

const UserLookupScreen = () => {
  const dispatch = useDispatch();
  const [phoneNumber, setPhoneNumber] = useState("+57");
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [backupContacts, setBackupContacts] = useState([]); // Nuevo estado para contactos de respaldo
 const user = useSelector((state) => state.auth.user);
  useEffect(() => {
    if (userData) {
      // Obtener los contactos de respaldo cuando hay datos de usuario
      fetchBackupContacts();
    }
  }, [userData]);

  const lookupUser = async () => {
    if (phoneNumber.trim() === "" || phoneNumber.length < 10) {
      Alert.alert("Error", "Por favor, ingresa un número de teléfono válido.");
      return;
    }

    setIsLoading(true);
    try {
      const formattedPhoneNumber = phoneNumber.replace("+57", "").trim();
      const usersRef = ref(database, "users");
      const snapshot = await get(usersRef);

      let foundUser = null;

      snapshot.forEach((childSnapshot) => {
        const userData = childSnapshot.val();
        if (userData.mobile === `+57${formattedPhoneNumber}`) {
          foundUser = {
            id: childSnapshot.key,
            mobile: userData.mobile,
            firstName: userData.firstName,
          };
        }
      });

      if (!foundUser) {
        Alert.alert("Usuario no encontrado", "El número de teléfono ingresado no corresponde a ningún usuario.");
      } else {
        setUserData(foundUser);
      }
    } catch (error) {
      Alert.alert("Error", "Ocurrió un problema al consultar el usuario. Inténtalo nuevamente.");
      console.error("Error al consultar el usuario:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBackupContacts = async () => {
    if (!userData) return;

    const userProfileRef = ref(database, `users/${userData.id}/backupContacts`);
    const snapshot = await get(userProfileRef);

    if (snapshot.exists()) {
      const contacts = snapshot.val();
      const contactsArray = Object.keys(contacts).map((key) => ({
        ...contacts[key],
        id: key, // Incluimos el número del contacto como ID
      }));
      setBackupContacts(contactsArray);
    } else {
      setBackupContacts([]);
    }
  };

  const renderBackupContact = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Contacto #{item.id}</Text>
      <Text style={styles.cardText}>Nombre: {item.name}</Text>
      <Text style={styles.cardText}>Teléfono: {item.mobile}</Text>
    </View>
  );

  const saveAsBackupContact = async () => {
    if (!userData) {
      Alert.alert("Error", "No hay datos de usuario para guardar como contacto de respaldo.");
      return;
    }

    const { id, mobile, firstName } = userData;

    try {
      const userProfileRef = ref(database, `users/${id}/backupContacts`);
      const snapshot = await get(userProfileRef);

      let nextContactNumber = 1;
      let existingBackupContacts = {};

      if (snapshot.exists()) {
        existingBackupContacts = snapshot.val();
        nextContactNumber = Object.keys(existingBackupContacts).length + 1;
      }

      const newBackupContact = {
        uid: id,
        mobile: mobile,
        name: firstName,
      };

      existingBackupContacts[nextContactNumber] = newBackupContact;

      dispatch(updateProfile({ backupContacts: existingBackupContacts }));
      fetchBackupContacts(); // Actualizar la lista de contactos después de guardar

      Alert.alert("Éxito", `Contacto de respaldo #${nextContactNumber} guardado correctamente.`);
    } catch (error) {
      console.error("Error al guardar el contacto de respaldo:", error);
      Alert.alert("Error", "Ocurrió un problema al guardar el contacto de respaldo.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Consultar Usuario</Text>

      <TextInput
        style={styles.input}
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        keyboardType="numeric"
        placeholder="Ingresa el número de teléfono"
      />

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={lookupUser}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Consultar Usuario</Text>
        )}
      </TouchableOpacity>

      {userData && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultText}>Nombre: {userData.firstName}</Text>
          <Text style={styles.resultText}>Teléfono: {userData.mobile}</Text>
          <TouchableOpacity
            style={styles.backupButton}
            onPress={saveAsBackupContact}
          >
            <Text style={styles.backupButtonText}>
              Marcar como Contacto de Respaldo
            </Text>
          </TouchableOpacity>
        </View>
      )}

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
    backgroundColor: "#f7f7f7",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: "#fff",
  },
  button: {
    backgroundColor: "#F20505",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  buttonDisabled: {
    backgroundColor: "#d3d3d3",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  resultContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  resultText: {
    fontSize: 18,
    marginBottom: 10,
    color: "#333",
  },
  backupButton: {
    backgroundColor: "#F20505",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  backupButtonText: {
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
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  cardText: {
    fontSize: 16,
    color: "#333",
  },
});

export default UserLookupScreen;