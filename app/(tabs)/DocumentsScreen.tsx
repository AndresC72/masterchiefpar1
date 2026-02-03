import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  Animated,
  Alert,
  Platform,
  useColorScheme,
} from "react-native";
import { Ionicons, AntDesign, MaterialIcons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/common/store";
import { Picker } from "@react-native-picker/picker";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { updateProfile } from "@/common/actions/authactions";
import * as ImagePicker from "expo-image-picker";
import defaultProfileImage from "./../../assets/images/Avatar/1.png"; // Cambia la ruta según la ubicación de tu imagen
import { getUserVerification } from "@/common/topus-integration";
import axios from "axios";
type Props = NativeStackScreenProps<any>;
import {
  listenToSettingsChanges,
  selectSettings,
} from "@/common/reducers/settingsSlice";
import RNPickerSelect from "react-native-picker-select";

const DocumentsScreen = ({ navigation }: Props) => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch();

  // Estado para manejar los inputs
  const [name, setName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [bankAccount, setBankAccount] = useState(user?.bankAccount || "");
  const [consulToken, setConsulToken] = useState(user?.consulToken || "");
  const [addres, setAddress] = useState(`${user?.addres}`);
  const [docNumber, setDocNumber] = useState(user?.verifyId || "");
  const [city, setCity] = useState(user?.city || "");
  const [docType, setDocType] = useState(user?.docType || "");
  const [email, setEmail] = useState(`${user?.email}`);
  const [imageUriVehicle, setimageUriVehicle] = useState<string | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0)); // Animación de fade
  const settings = useSelector(selectSettings);

  //  console.log(settings,"-----------------")
  const [cities] = useState([
    "Bogotá",
    "Medellín",
    "Cali",
    "Barranquilla",
    "Cartagena",
    "Cúcuta",
    "Bucaramanga",
    "Pereira",
    "Santa Marta",
    "Ibagué",
  ]);
  const [docTypes] = useState(["CC", "Pasaporte", "CE"]);

  const verifyUserInTopus = async (data) => {
    Alert.alert(
      "Consulta de antecedentes en proceso",
      "stamos verificando tu cuenta para asegurarnos de que todo esté en orden y así protegerte a ti y a los demás usuarios. Este proceso solo tomará unos 5 minutos. Es muy importante para nosotros garantizar la seguridad de todos. Agradecemos tu paciencia."
    );
    return await getUserVerification({
      doc_type: data.docType,
      identification: data.verifyId,
      name: data.firstName,
    });
  };
  useEffect(() => {
    // Start listening to settings changes
    dispatch(listenToSettingsChanges());
  }, [dispatch]);

  const handleUpdate = async () => {
    // Datos actualizados del perfil
    const updatedData = {
      firstName: name,
      lastName,
      bankAccount,
      consulToken,
      addres,
      verifyId: docNumber,
      city,
      docType,
      email,
    };
    const actualSecurityData = user?.securityData || [];
    console.log("entro o no ");
    // Verificación de antecedentes solo si el documento ha sido actualizado
    if (
      (updatedData.docType &&
        updatedData.verifyId &&
        user?.verifyId !== updatedData.verifyId) ||
      !user?.securityData
    ) {
      try {
        const dateRequest = new Date().getTime();
        let results;
        console.log("entro o no 2");
        if (updatedData.consulToken) {
          const response = await axios.post(
            "https://us-central1-treasupdate.cloudfunctions.net/getuserdata",
            {
              data: updatedData.consulToken,
            }
          );

          results = response.data;

          // setData(results);

          // Procesar los resultados para verificar entidades con paso = '2' excepto 'simit'
          let blockedTopus = false;
          let blockedReasonTopus = [];

          results.forEach((item) => {
            if (item.entidad !== "simit" && item.paso === "2") {
              blockedTopus = true;
              blockedReasonTopus.push(item.entidad);
            }
          });

          /*   // Actualizar filteredData con los nuevos campos
          filteredData = {
            ...filteredData,
            blockedTopus: blockedTopus,
            blockedReasonTopus: blockedReasonTopus,
            securityData: {
              "0": {
                antecedents: results,
                date: Date.now(),
                verifyId: updatedData.verifyId,
                doc_type: updatedData.docType,
                firstName: updatedData.firstName,
                lastName: updatedData.lastName,
              },
              consulToken: updatedData.consulToken,
            },
          };

          */
          dispatch(
            updateProfile({
              securityData: [
                {
                  date: dateRequest,
                  verifyId: updatedData.verifyId,
                  firstName: user?.firstName,
                  lastName: user?.lastName,
                  docType: updatedData.docType,
                  antecedents: results,
                },
                ...actualSecurityData,
              ],
              verifyId: updatedData.verifyId,
              docType: updatedData.docType,
            })
          );
        } else {
          results = await verifyUserInTopus(updatedData); // Llamada a la verificación en Topus
        }

        // Actualiza el perfil con los resultados de la verificación de antecedentes
        dispatch(
          updateProfile({
            securityData: [
              {
                date: dateRequest,
                verifyId: updatedData.verifyId,
                firstName: user?.firstName,
                lastName: user?.lastName,
                docType: updatedData.docType,
                antecedents: results,
              },
              ...actualSecurityData,
            ],
            verifyId: updatedData.verifyId,
            docType: updatedData.docType,
          })
        );

        // Comprobar si hay antecedentes
        const hasAntecedents = results.some((result) => {
          if (result?.entidad === "policia") {
            return (
              result?.respuesta?.mensaje.trim().toLowerCase() !==
              "no tiene asuntos pendientes con las autoridades judiciales"
            );
          } else if (result?.entidad === "simit") {
            return (
              result?.respuesta?.Simit.trim().toLowerCase() !==
              "el ciudadano no presenta multas ni comparendos en el simit."
            );
          } else if (result?.entidad === "contraloria") {
            return (
              result?.respuesta?.Resultado.trim().toLowerCase() !==
              "no se encuentra reportado como responsable fiscal"
            );
          } else if (result?.entidad === "ofac") {
            return !result?.respuesta?.archivo_respuesta
              .trim()
              .toLowerCase()
              .includes("no registra en la ofac.");
          } else if (result?.entidad === "interpol") {
            return (
              result?.respuesta?.Resultado.trim().toLowerCase() !==
              "la persona no presenta cargos ante el interpol."
            );
          } else if (result?.entidad === "onu") {
            return (
              result?.respuesta?.Resultado.trim().toLowerCase() !==
              "la persona no registra en la onu :"
            );
          } else {
            return false;
          }
        });

        // Resultado de la verificación de antecedentes
        if (hasAntecedents) {
          Alert.alert(
            "Consulta de antecedentes",
            "Su cuenta ha sido aprobada. ¡Bienvenido a TREASAPP!"
          );
          dispatch(updateProfile({ blocked: false }));
        } else {
          Alert.alert(
            "Consulta de antecedentes",
            "Su cuenta no fue aprobada, por favor comuníquese con soporte para resolver su caso."
          );
          dispatch(updateProfile({ blocked: true }));
          return; // Si no se aprueba, termina la función
        }
      } catch (error) {
        Alert.alert(
          "Error",
          error.message ||
            "Ha ocurrido un error en la consulta de antecedentes, intentelo de nuevo"
        );
        return;
      }
    }

    // Continúa con el proceso original de actualización si no hay antecedentes o si no se cambió el documento
    const profileUpdateData = { ...updatedData };
    if (settings.driver_approval) {
      profileUpdateData.approved = true;
    }
    dispatch(updateProfile(profileUpdateData, imageUriVehicle));

    // Mostrar el modal de éxito con animación
    setSuccessModalVisible(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Cerrar el modal después de 2 segundos
    setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => setSuccessModalVisible(false));
    }, 2000);
  };

  const selectImage = async (fromCamera) => {
    let result;
    if (fromCamera) {
      result = await ImagePicker.launchCameraAsync();
    } else {
      result = await ImagePicker.launchImageLibraryAsync();
    }

    if (!result.canceled) {
      const uri = result.assets[0].uri; // Acceder al primer elemento del array de assets
      setimageUriVehicle(uri);
    }

    setModalVisible(false);
  };

  const styles = createStyles(isDarkMode);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <AntDesign name="arrowleft" size={24} color={isDarkMode ? "#fff" : "#000"} />
        </TouchableOpacity>
        <Text style={styles.headerText}>{"Datos Personales"} </Text>
        <Ionicons
          name="barcode-outline"
          size={24}
          color={isDarkMode ? "#fff" : "#000"}
          style={styles.headerIcon}
        />
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity
          style={styles.profileContainer}
          onPress={() => setModalVisible(true)}
        >
          {imageUriVehicle ? (
            <Image
              source={{ uri: imageUriVehicle }}
              style={styles.profileImage}
            />
          ) : (
            <Image
              source={
                user?.profile_image
                  ? { uri: user.profile_image }
                  : defaultProfileImage
              }
              style={styles.profileImage}
            />
          )}
          <View style={styles.cameraIcon}>
            <Text style={styles.cameraIconText}>📷</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.documentsButton}
            onPress={() => navigation.navigate("ImageGallery")}
          >
            <AntDesign name="idcard" size={24} color="red" />
            <Text style={styles.buttonText}>Documentos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.updateButton} onPress={handleUpdate}>
            <Text style={styles.updateButtonText}>Actualizar Ahora</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.label}>Nombres</Text>
          <TextInput
            editable={true}
            selectTextOnFocus={true}
            style={styles.inputNone}
            value={name}
            onChangeText={setName}
            placeholder="Ingrese sus nombres"
            placeholderTextColor={isDarkMode ? "#ccc" : "#888"}
          />
          <Text style={styles.label}>Apellidos</Text>
          <TextInput
            editable={true}
            selectTextOnFocus={true}
            style={styles.inputNone}
            value={lastName}
            onChangeText={setLastName}
            placeholder="Ingrese sus apellidos"
            placeholderTextColor={isDarkMode ? "#ccc" : "#888"}
          />

          <Text style={styles.label}>Número Daviplata</Text>
          <TextInput
            style={styles.input}
            value={bankAccount}
            onChangeText={setBankAccount}
          />
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>Ciudad</Text>
          <View style={styles.pickerContainer}>
            {Platform.OS === "android" ? (
              <Picker
                selectedValue={city}
                style={styles.picker}
                onValueChange={(itemValue) => setCity(itemValue)}
              >
                {cities.map((cityName, index) => (
                  <Picker.Item key={index} label={cityName} value={cityName} />
                ))}
              </Picker>
            ) : (
              <RNPickerSelect
                onValueChange={(itemValue) => setCity(itemValue)}
                items={cities.map((cityName, index) => ({
                  label: cityName,
                  value: cityName,
                }))}
                placeholder={{ label: "Seleccione una ciudad", value: null }}
                style={{
                  inputIOS: {
                    color: "black",
                    fontSize: 16,
                    paddingHorizontal: 10,
                    paddingVertical: 8,
                    //borderWidth: 1,
                    borderColor: "#a1a3a6",
                    borderRadius: 10,
                    backgroundColor: colorScheme === "dark" ? "#313131" : "#fff",
                  },
                }}
              />
            )}
          </View>

          <Text style={styles.label}>Dirección de Residencia</Text>
          <TextInput
            style={styles.input}
            value={addres}
            onChangeText={setAddress}
          />

          <Text style={styles.label}>Tipo de Documento</Text>
          <View style={styles.pickerContainer}>
            {Platform.OS === "android" ? (
              <Picker
                selectedValue={docType}
                style={styles.picker}
                onValueChange={(itemValue) => setDocType(itemValue)}
              >
                {docTypes.map((docName, index) => (
                  <Picker.Item key={index} label={docName} value={docName} />
                ))}
              </Picker>
            ) : (
              <RNPickerSelect
                onValueChange={(itemValue) => setDocType(itemValue)}
                items={docTypes.map((docName, index) => ({
                  label: docName,
                  value: docName,
                }))}
                placeholder={{
                  label: "Seleccione un tipo de documento",
                  value: null,
                }}
                placeholderTextColor="#000"
                style={{
                  inputIOS: {
                    color: "black",
                    fontSize: 16,
                    paddingHorizontal: 10,
                    paddingVertical: 8,
                    borderColor: "#a1a3a6",
                    borderRadius: 10,
                    backgroundColor: colorScheme === "dark" ? "#313131" : "#313131",
                  },
                }}
              />
            )}
          </View>

          <Text style={styles.label}>Número de Documento</Text>
          <TextInput
            style={styles.input}
            value={docNumber || ""}
            onChangeText={setDocNumber}
          />
        </View>
      </ScrollView>

      {/* Modal de selección de imagen */}
      <Modal
        transparent={true}
        animationType="slide"
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>Selecciona una opción</Text>
            <TouchableOpacity
              style={styles.botonCamera}
              onPress={() => selectImage(true)}
            >
              <Ionicons name="camera" size={24} color="white" />
              <Text style={styles.modalButtonText}>Tomar Foto</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.botonGallery}
              onPress={() => selectImage(false)}
            >
              <Ionicons name="images" size={24} color="white" />
              <Text style={styles.modalButtonText}>
                Cargar desde Dispositivo
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setModalVisible(false)}
            >
              <MaterialIcons name="cancel" size={24} color="#f20505" />
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de éxito con animación */}
      <Modal
        transparent={true}
        visible={successModalVisible}
        animationType="fade"
        onRequestClose={() => setSuccessModalVisible(false)}
      >
        <View style={styles.successModalContainer}>
          <Animated.View
            style={[styles.successModalView, { opacity: fadeAnim }]}
          >
            <Ionicons name="checkmark-circle" size={48} color="#fff" />
            <Text style={styles.successModalText}>Actualizado con éxito</Text>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

const createStyles = (isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? "#121212" : "#F5F5F5",
      padding: 20,
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
      color: isDarkMode ? "#fff" : "#000",
    },
    headerIcon: {
      backgroundColor: isDarkMode ? "#333" : "#E0E0E0",
      borderRadius: 12,
      padding: 4,
    },
    profileContainer: {
      alignItems: "center",
      marginBottom: 20,
    },
    profileImage: {
      width: 100,
      height: 100,
      borderRadius: 50,
    },
    cameraIcon: {
      position: "absolute",
      bottom: 0,
      right: "35%",
      backgroundColor: "#fff",
      padding: 5,
      borderRadius: 20,
    },
    cameraIconText: {
      fontSize: 18,
      color: "#0d0d0d",
    },
    buttonContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginVertical: 20,
    },
    updateButton: {
      backgroundColor: "#f20505",
      padding: 15,
      borderRadius: 23,
      alignItems: "center",
      flex: 1,
      marginHorizontal: 5,
    },
    updateButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "bold",
    },
    documentsButton: {
      backgroundColor: isDarkMode ? "#1e1e1e" : "#ffff",
      padding: 15,
      borderRadius: 23,
      alignItems: "center",
      flexDirection: "row",
      flex: 1,
      marginHorizontal: 5,
      elevation: 5,
      borderWidth: 1,
      borderColor: "#f20505",
    },
    buttonText: {
      color: "red",
      fontSize: 16,
      fontWeight: "bold",
      marginLeft: 10,
    },
    scrollContent: {
      paddingBottom: 20,
    },
    modalContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    modalView: {
      width: 320,
      padding: 20,
      backgroundColor: isDarkMode ? "#333" : "white",
      borderRadius: 20,
      alignItems: "center",
      elevation: 10,
    },
    modalText: {
      fontSize: 20,
      fontWeight: "bold",
      color: isDarkMode ? "#fff" : "#333",
      marginBottom: 20,
    },
    botonCamera: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#b90000",
      padding: 15,
      borderRadius: 10,
      marginBottom: 15,
      width: "100%",
      justifyContent: "center",
      elevation: 5,
    },
    botonGallery: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#f20505",
      padding: 15,
      borderRadius: 10,
      marginBottom: 15,
      width: "100%",
      justifyContent: "center",
      elevation: 5,
    },
    modalButtonText: {
      color: "white",
      fontSize: 16,
      fontWeight: "bold",
    },
    cancelButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDarkMode ? "#555" : "#fff",
      padding: 15,
      borderRadius: 10,
      marginTop: 10,
      width: "100%",
      justifyContent: "center",
      elevation: 5,
      borderWidth: 1,
      borderColor: "#f20505",
    },
    cancelButtonText: {
      color: "#f20505",
      fontSize: 16,
      fontWeight: "bold",
    },
    successModalContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    successModalView: {
      width: 250,
      padding: 20,
      backgroundColor: "#f20505",
      borderRadius: 10,
      alignItems: "center",
      elevation: 10,
    },
    successModalText: {
      color: "#fff",
      fontSize: 18,
      fontWeight: "bold",
      marginTop: 10,
    },
    openGalleryButton: {
      backgroundColor: "#f20505",
      padding: 10,
      borderRadius: 10,
      marginTop: 10,
    },
    openGalleryButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "bold",
    },
    infoContainer: {
      backgroundColor: isDarkMode ? "#1e1e1e" : "#fff",
      borderRadius: 10,
      padding: 16,
    },
    label: {
      fontSize: 14,
      color: isDarkMode ? "#fff" : "#404040",
      marginBottom: 8,
    },
    input: {
      borderWidth: 1,
      borderColor: isDarkMode ? "#555" : "#a1a3a6",
      borderRadius: 10,
      padding: 12,
      marginBottom: 16,
      fontSize: 16,
      color: isDarkMode ? "#fff" : "#0d0d0d",
      backgroundColor: isDarkMode ? "#333" : "#fff",
    },
    inputNone: {
      borderWidth: 1,
      borderColor: isDarkMode ? "#555" : "#a1a3a6",
      borderRadius: 10,
      padding: 12,
      marginBottom: 16,
      fontSize: 16,
      color: isDarkMode ? "#fff" : "#0d0d0d",
      backgroundColor: isDarkMode ? "#333" : "#fff",
    },
    pickerContainer: {
      borderWidth: 1,
      borderColor: isDarkMode ? "#555" : "#a1a3a6",
      borderRadius: 10,
      marginBottom: 16,
      backgroundColor: isDarkMode ? "#333" : "#fff",
    },
    picker: {
      width: "100%",
      height: 50,
      color: isDarkMode ? "#fff" : "#000",
    },
  });

export default DocumentsScreen;
