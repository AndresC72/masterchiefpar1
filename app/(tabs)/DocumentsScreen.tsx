import React, { useEffect, useRef, useState } from "react";
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
  Easing,
  Alert,
  Platform,
  useColorScheme,
} from "react-native";
import { Ionicons, AntDesign, MaterialIcons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/common/store";
import { Picker } from "@react-native-picker/picker";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { updateUserProfileSupabase } from "@/common/actions/userActions";
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
  const glowPulse = useRef(new Animated.Value(0)).current;
  const orbSpin = useRef(new Animated.Value(0)).current;

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

  useEffect(() => {
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: 1,
          duration: 2800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glowPulse, {
          toValue: 0,
          duration: 2800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    const orbLoop = Animated.loop(
      Animated.timing(orbSpin, {
        toValue: 1,
        duration: 20000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    glowLoop.start();
    orbLoop.start();

    return () => {
      glowLoop.stop();
      orbLoop.stop();
    };
  }, [glowPulse, orbSpin]);

  const handleUpdate = async () => {
    // Datos actualizados del perfil
    const updatedData = {
      first_name: name,
      last_name: lastName,
      bank_account: bankAccount,
      consul_token: consulToken,
      address: addres,
      verify_id: docNumber,
      city,
      doc_type: docType,
      email,
    };
    // Actualiza en Supabase
    const result = await updateUserProfileSupabase(
      user?.id,
      updatedData,
      dispatch,
      imageUriVehicle || undefined
    );
    if (result.success) {
      setSuccessModalVisible(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => setSuccessModalVisible(false));
      }, 2000);
      Alert.alert("Perfil actualizado", "Tus datos han sido actualizados correctamente.");
    } else {
      Alert.alert("Error", result.error || "No se pudo actualizar el perfil.");
    }
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
  const glowScale = glowPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.22],
  });
  const glowOpacity = glowPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 0.42],
  });
  const orbRotate = orbSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={styles.container}>
      <View style={styles.bgLayer}>
        <Animated.View
          style={[
            styles.bgGlow,
            styles.bgGlowTop,
            { transform: [{ scale: glowScale }], opacity: glowOpacity },
          ]}
        />
        <Animated.View
          style={[
            styles.bgGlow,
            styles.bgGlowBottom,
            {
              transform: [{ scale: glowScale }],
              opacity: glowOpacity,
            },
          ]}
        />
        <Animated.View
          style={[styles.bgOrb, { transform: [{ rotate: orbRotate }] }]}
        />
        <View style={styles.bgGrid} />
      </View>

      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <AntDesign name="arrow-left" size={22} color="#E9F6FF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerText}>Datos Personales</Text>
        </View>
        <View style={styles.headerBadge}>
          <Ionicons name="sparkles-outline" size={18} color="#00E5FF" />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity
          style={styles.profileContainer}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.9}
        >
          <View style={styles.profileRing}>
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
          </View>
          <View style={styles.cameraIcon}>
            <Ionicons name="camera" size={16} color="#071822" />
          </View>
          <Text style={styles.avatarHint}>Toca para cambiar tu foto</Text>
        </TouchableOpacity>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.documentsButton}
            onPress={() => navigation.navigate("ImageGallery")}
            activeOpacity={0.85}
          >
            <AntDesign name="idcard" size={22} color="#FF6A7B" />
            <Text style={styles.buttonText}>Documentos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.updateButton} onPress={handleUpdate} activeOpacity={0.85}>
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
            placeholderTextColor="#8AA6B7"
          />
          <Text style={styles.label}>Apellidos</Text>
          <TextInput
            editable={true}
            selectTextOnFocus={true}
            style={styles.inputNone}
            value={lastName}
            onChangeText={setLastName}
            placeholder="Ingrese sus apellidos"
            placeholderTextColor="#8AA6B7"
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
                    color: "#E9F6FF",
                    fontSize: 16,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    borderColor: "rgba(0, 229, 255, 0.2)",
                    borderWidth: 1,
                    borderRadius: 14,
                    backgroundColor: "rgba(7, 35, 48, 0.72)",
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
                    color: "#E9F6FF",
                    fontSize: 16,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    borderColor: "rgba(0, 229, 255, 0.2)",
                    borderWidth: 1,
                    borderRadius: 14,
                    backgroundColor: "rgba(7, 35, 48, 0.72)",
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
              <MaterialIcons name="cancel" size={24} color="#00f4f5" />
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
            <Ionicons name="checkmark-circle" size={48} color="#00E5FF" />
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
      backgroundColor: "#051A26",
    },
    bgLayer: {
      ...StyleSheet.absoluteFillObject,
      overflow: "hidden",
      zIndex: 0,
    },
    bgGlow: {
      position: "absolute",
      borderRadius: 999,
      backgroundColor: "#00E5FF",
      shadowColor: "#00E5FF",
      shadowOpacity: 0.35,
      shadowRadius: 32,
      shadowOffset: { width: 0, height: 8 },
      elevation: 14,
    },
    bgGlowTop: {
      width: 240,
      height: 240,
      top: -110,
      right: -80,
    },
    bgGlowBottom: {
      width: 210,
      height: 210,
      bottom: 120,
      left: -90,
      backgroundColor: "#00B8D4",
    },
    bgOrb: {
      position: "absolute",
      width: 200,
      height: 200,
      borderRadius: 100,
      borderWidth: 1,
      borderColor: "rgba(0,229,255,0.12)",
      top: "42%",
      right: -90,
    },
    bgGrid: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(2, 16, 24, 0.58)",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingTop: 48,
      paddingBottom: 12,
      zIndex: 2,
    },
    headerBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: "rgba(0,229,255,0.15)",
      backgroundColor: "rgba(10, 46, 61, 0.65)",
      alignItems: "center",
      justifyContent: "center",
    },
    headerCenter: {
      flex: 1,
      alignItems: "center",
    },
    headerText: {
      fontSize: 20,
      fontWeight: "800",
      color: "#E9F6FF",
      letterSpacing: 0.2,
    },
    headerBadge: {
      width: 44,
      height: 44,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: "rgba(0,229,255,0.18)",
      backgroundColor: "rgba(10, 46, 61, 0.65)",
      alignItems: "center",
      justifyContent: "center",
    },
    profileContainer: {
      alignItems: "center",
      marginTop: 8,
      marginBottom: 24,
    },
    profileRing: {
      width: 124,
      height: 124,
      borderRadius: 62,
      padding: 3,
      backgroundColor: "#00E5FF",
      shadowColor: "#00E5FF",
      shadowOpacity: 0.3,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 10 },
      elevation: 12,
    },
    profileImage: {
      width: 118,
      height: 118,
      borderRadius: 59,
      backgroundColor: "#0A2E3D",
    },
    cameraIcon: {
      position: "absolute",
      bottom: 18,
      right: "33%",
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: "#00E5FF",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: "#051A26",
    },
    avatarHint: {
      marginTop: 10,
      color: "#8FB3C5",
      fontSize: 12,
      fontWeight: "500",
    },
    buttonContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 22,
      gap: 10,
    },
    updateButton: {
      backgroundColor: "#00E5FF",
      paddingVertical: 14,
      borderRadius: 20,
      alignItems: "center",
      flex: 1,
      shadowColor: "#00E5FF",
      shadowOpacity: 0.34,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 8,
    },
    updateButtonText: {
      color: "#04202C",
      fontSize: 14,
      fontWeight: "800",
      letterSpacing: 0.2,
    },
    documentsButton: {
      backgroundColor: "rgba(9, 45, 60, 0.72)",
      paddingVertical: 14,
      borderRadius: 20,
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      flex: 1,
      borderWidth: 1,
      borderColor: "rgba(255, 106, 123, 0.4)",
    },
    buttonText: {
      color: "#FF6A7B",
      fontSize: 14,
      fontWeight: "700",
      marginLeft: 8,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 28,
      zIndex: 2,
    },
    modalContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(2, 10, 16, 0.74)",
    },
    modalView: {
      width: 320,
      padding: 20,
      backgroundColor: "rgba(9, 39, 52, 0.95)",
      borderRadius: 22,
      borderWidth: 1,
      borderColor: "rgba(0, 229, 255, 0.28)",
      alignItems: "center",
      elevation: 10,
    },
    modalText: {
      fontSize: 18,
      fontWeight: "700",
      color: "#E9F6FF",
      marginBottom: 20,
    },
    botonCamera: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#0A2E3D",
      padding: 15,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: "rgba(0, 229, 255, 0.24)",
      marginBottom: 15,
      width: "100%",
      justifyContent: "center",
      elevation: 5,
    },
    botonGallery: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#00f4f5",
      padding: 15,
      borderRadius: 14,
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
      backgroundColor: "rgba(9, 39, 52, 0.85)",
      padding: 15,
      borderRadius: 14,
      marginTop: 10,
      width: "100%",
      justifyContent: "center",
      elevation: 5,
      borderWidth: 1,
      borderColor: "rgba(0, 229, 255, 0.28)",
    },
    cancelButtonText: {
      color: "#00f4f5",
      fontSize: 16,
      fontWeight: "bold",
    },
    successModalContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(2, 10, 16, 0.74)",
    },
    successModalView: {
      width: 250,
      padding: 20,
      backgroundColor: "rgba(9, 39, 52, 0.95)",
      borderRadius: 16,
      borderWidth: 1,
      borderColor: "rgba(0, 229, 255, 0.35)",
      alignItems: "center",
      elevation: 10,
    },
    successModalText: {
      color: "#E9F6FF",
      fontSize: 18,
      fontWeight: "bold",
      marginTop: 10,
    },
    openGalleryButton: {
      backgroundColor: "#00f4f5",
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
      backgroundColor: "rgba(8, 36, 49, 0.72)",
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: "rgba(0, 229, 255, 0.14)",
    },
    label: {
      fontSize: 12,
      color: "#9EC2D4",
      marginBottom: 8,
      marginTop: 2,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.7,
    },
    input: {
      borderWidth: 1,
      borderColor: "rgba(0, 229, 255, 0.2)",
      borderRadius: 14,
      padding: 12,
      marginBottom: 16,
      fontSize: 16,
      color: "#E9F6FF",
      backgroundColor: "rgba(7, 35, 48, 0.72)",
    },
    inputNone: {
      borderWidth: 1,
      borderColor: "rgba(0, 229, 255, 0.2)",
      borderRadius: 14,
      padding: 12,
      marginBottom: 16,
      fontSize: 16,
      color: "#E9F6FF",
      backgroundColor: "rgba(7, 35, 48, 0.72)",
    },
    pickerContainer: {
      borderWidth: 1,
      borderColor: "rgba(0, 229, 255, 0.2)",
      borderRadius: 14,
      marginBottom: 16,
      backgroundColor: "rgba(7, 35, 48, 0.72)",
    },
    picker: {
      width: "100%",
      height: 50,
      color: "#E9F6FF",
    },
  });

export default DocumentsScreen;
