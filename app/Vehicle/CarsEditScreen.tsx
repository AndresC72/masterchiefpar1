import React, { useState, useMemo, useCallback, useRef } from "react";
import {
  StyleSheet,
  View,
  Dimensions,
  Image,
  ScrollView,
  TextInput,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import {
  BottomSheetModal,
  BottomSheetModalProvider,
} from "@gorhom/bottom-sheet";
import LottieView from "lottie-react-native";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/common/store";
import { addCar } from "@/common/actions/caractions";
import { Picker } from '@react-native-picker/picker'; // Importa Picker desde el nuevo paquete
const { height } = Dimensions.get("window");
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useColorScheme } from 'react-native';
import RNPickerSelect from "react-native-picker-select";

const CarsScreen = ({ navigation }: any) => {
  const dispatch = useDispatch();
  const { uid } = useSelector((state: RootState) => state.auth.user);
  const [successMessage, setSuccessMessage] = useState<string | null>(null); // Estado para el mensaje de éxito
  const [modalVisible, setModalVisible] = useState(false);

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageUriVehicle, setimageUriVehicle] = useState<string | null>(null);
  const colorScheme = useColorScheme();
  const [log, setLog] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [loaded, setLoaded] = useState<boolean>(false);
  const [vehicleData, setVehicleData] = useState({
    vehicleNumber: "", // Placa
    vehicleNoMotor: "", // NMOTOR
    vehicleNoChasis: "", // CHASIS
    vehicleForm: "", // vehicleForm
    vehicleModel: "", // MODELO
    vehicleMake: "", // MARCA
    vehicleCylinders: "", // CILINDRAJE
    vehicleColor: "", // COLOR
    vehicleFuel: "", // COMBUSTIBLE
    vehicleNoVin: "", // gUAR
    vehicleNoSerie: "", // SERIE
    vehiclePassengers: "", // NPASAJEROS
    carType: "TREAS-X", // carType
    vehicleMetalup: "", // CARROCERIA
    vehicleDoors: "", // Cantidad de puertas

  });
  const styles = colorScheme === "dark" ? darkStyles : lightStyles; // Estilos dinámicos

  const vehicleTypes = ['Automovil', 'Camioneta', 'VAN', 'Microbus', 'Campero'];
  const serviceTypes = [
    { description: 'TREAS-T(taxi)', value: 'TREAS-T' },
    { description: 'TREAS-Van(Van Pax 11)', value: 'TREAS-Van' },
    { description: 'TREAS-X(Vehiculo Particular)', value: 'TREAS-X' },
    { description: 'TREAS-E(Servicio Especial)', value: 'TREAS-E' }
  ];
  const bodyworkTypes = ['VAN', '4x4', 'Cerrada', 'COUPÉ', 'Doble Cabina', 'Hatch Back', 'MiniVan', 'CROSSOVER', 'Sedán', 'Station Wagon',];
  const marcasDeVehiculos = [
    { label: 'Brilliance', value: 'Brilliance' },
    { label: 'Byd', value: 'Byd' },
    { label: 'Chana', value: 'Chana' },
    { label: 'Changan', value: 'Changan' },
    { label: 'Chery', value: 'Chery' },
    { label: 'Chery Tiggo', value: 'Chery Tiggo' },
    { label: 'Chevrolet', value: 'Chevrolet' },
    { label: 'Chevrolet Aveo', value: 'Chevrolet Aveo' },
    { label: 'Chevrolet Beat', value: 'Chevrolet Beat' },
    { label: 'Chevrolet Camaro', value: 'Chevrolet Camaro' },
    { label: 'Chevrolet Captiva', value: 'Chevrolet Captiva' },
    { label: 'Chevrolet Corsa', value: 'Chevrolet Corsa' },
    { label: 'Chevrolet Cruze', value: 'Chevrolet Cruze' },
    { label: 'Chevrolet Optra', value: 'Chevrolet Optra' },
    { label: 'Chevrolet Sail', value: 'Chevrolet Sail' },
    { label: 'Chevrolet Sonic', value: 'Chevrolet Sonic' },
    { label: 'Chevrolet Spark', value: 'Chevrolet Spark' },
    { label: 'Chevrolet Swift', value: 'Chevrolet Swift' },
    { label: 'Chevrolet Tracker', value: 'Chevrolet Tracker' },
    { label: 'Citroen', value: 'Citroen' },
    { label: 'Dfsk', value: 'Dfsk' },
    { label: 'Dodge', value: 'Dodge' },
    { label: 'BYD ELÉCTRICO', value: 'BYD ELÉCTRICO' },
    { label: 'FAW', value: 'FAW' },
    { label: 'Fiat', value: 'Fiat' },
    { label: 'Ford', value: 'Ford' },
    { label: 'Ford Ecosport', value: 'Ford Ecosport' },
    { label: 'Ford Fiesta', value: 'Ford Fiesta' },
    { label: 'Fotton', value: 'Fotton' },
    { label: 'Geely', value: 'Geely' },
    { label: 'Great', value: 'Great' },
    { label: 'Honda', value: 'Honda' },
    { label: 'Honda Civic', value: 'Honda Civic' },
    { label: 'Hyundai', value: 'Hyundai' },
    { label: 'Hyundai Accent', value: 'Hyundai Accent' },
    { label: 'Hyundai I10', value: 'Hyundai I10' },
    { label: 'Hyundai I25', value: 'Hyundai I25' },
    { label: 'Hyundai Tucson', value: 'Hyundai Tucson' },
    { label: 'Jac', value: 'Jac' },
    { label: 'Jac S2', value: 'Jac S2' },
    { label: 'Kia', value: 'Kia' },
    { label: 'Kia ', value: 'Kia ' },
    { label: 'Kia Carens', value: 'Kia Carens' },
    { label: 'Kia Cerato', value: 'Kia Cerato' },
    { label: 'Kia Picanto', value: 'Kia Picanto' },
    { label: 'Kia Rio', value: 'Kia Rio' },
    { label: 'Kia Soul', value: 'Kia Soul' },
    { label: 'Kia Sportage', value: 'Kia Sportage' },
    { label: 'Lifan', value: 'Lifan' },
    { label: 'Mahindra', value: 'Mahindra' },
    { label: 'Mazda', value: 'Mazda' },
    { label: 'Mazda 2', value: 'Mazda 2' },
    { label: 'Mazda 3', value: 'Mazda 3' },
    { label: 'Mazda 6', value: 'Mazda 6' },
    { label: 'Mazda Bt 50', value: 'Mazda Bt 50' },
    { label: 'Mg', value: 'Mg' },
    { label: 'Nissan', value: 'Nissan' },
    { label: 'Nissan ', value: 'Nissan ' },
    { label: 'Nissan March', value: 'Nissan March' },
    { label: 'Nissan Sentra', value: 'Nissan Sentra' },
    { label: 'Nissan Tiida', value: 'Nissan Tiida' },
    { label: 'Nissan Versa', value: 'Nissan Versa' },
    { label: 'Nissan X Trail', value: 'Nissan X Trail' },
    { label: 'Peugeot', value: 'Peugeot' },
    { label: 'Renault', value: 'Renault' },
    { label: 'Renault Clio', value: 'Renault Clio' },
    { label: 'Renault Duster', value: 'Renault Duster' },
    { label: 'Renault Koleos', value: 'Renault Koleos' },
    { label: 'Renault Kwid', value: 'Renault Kwid' },
    { label: 'Renault Logan', value: 'Renault Logan' },
    { label: 'Renault Sandero', value: 'Renault Sandero' },
    { label: 'Renault Stepway', value: 'Renault Stepway' },
    { label: 'Renault Symbol', value: 'Renault Symbol' },
    { label: 'Saic Wuling', value: 'Saic Wuling' },
    { label: 'Sail', value: 'Sail' },
    { label: 'Seat', value: 'Seat' },
    { label: 'Skoda', value: 'Skoda' },
    { label: 'Spark', value: 'Spark' },
    { label: 'Ssang Yong', value: 'Ssang Yong' },
    { label: 'Suzuki', value: 'Suzuki' },
    { label: 'Suzuki Jimny', value: 'Suzuki Jimny' },
    { label: 'Suzuki Swift', value: 'Suzuki Swift' },
    { label: 'Suzuky', value: 'Suzuky' },
    { label: 'Toyota', value: 'Toyota' },
    { label: 'Toyota Corolla', value: 'Toyota Corolla' },
    { label: 'Volkswagen', value: 'Volkswagen' },
    { label: 'Volkswagen Gol', value: 'Volkswagen Gol' },
    { label: 'Volkswagen Voyage', value: 'Volkswagen Voyage' },
    { label: 'Zotye', value: 'Zotye' },
    { label: 'Otra', value: 'Otra' },
  ];
  const CilindrajesDeVehiculos = [
    { label: 'Tipo de Cilindraje', value: '' },
    { label: 'Menos de 1.0L', value: 'Menos de 1.0L' },
    { label: '1.0L - 1.4L', value: '1.0L - 1.4L' },
    { label: '1.5L - 1.9L', value: '1.5L - 1.9L' },
    { label: '2.0L - 2.4L', value: '2.0L - 2.4L' },
    { label: '2.5L - 2.9L', value: '2.5L - 2.9L' },
    { label: '3.0L - 3.4L', value: '3.0L - 3.4L' },
    { label: '3.5L - 3.9L', value: '3.5L - 3.9L' },
    { label: '4.0L - 4.4L', value: '4.0L - 4.4L' },
    { label: '4.5L - 4.9L', value: '4.5L - 4.9L' },
    { label: 'Más de 5.0L', value: 'Más de 5.0L' },
  ];
  const TipoCombustible = [
    { label: 'Tipo de Combustible', value: '' },
    { label: 'GASOLINA', value: 'Gasolina' },
    { label: 'DIESEL', value: 'Diesel' },
    { label: 'Electrico', value: 'ELECTRICO' },
    { label: 'GAS', value: 'Gas' },
    { label: 'Gas/Gasol', value: 'GasolGas' },
    { label: 'Gasol/Elect', value: 'GasolElect' },
  ]
  const ModelosDeVehiculos = [
    { label: 'Modelo del Vehículo', value: '' },
    { label: '2006', value: '2006' },
    { label: '2007', value: '2007' },
    { label: '2008', value: '2008' },
    { label: '2009', value: '2009' },
    { label: '2010', value: '2010' },
    { label: '2011', value: '2011' },
    { label: '2012', value: '2012' },
    { label: '2013', value: '2013' },
    { label: '2014', value: '2014' },
    { label: '2015', value: '2015' },
    { label: '2016', value: '2016' },
    { label: '2017', value: '2017' },
    { label: '2018', value: '2018' },
    { label: '2019', value: '2019' },
    { label: '2020', value: '2020' },
    { label: '2021', value: '2021' },
    { label: '2022', value: '2022' },
    { label: '2023', value: '2023' },
    { label: '2024', value: '2024' },
  ];
  const isFormComplete = useMemo(() => {
    return (
      Object.values(vehicleData).every(value => value !== "") &&
      imageUriVehicle !== null
    );
  }, [vehicleData, imageUriVehicle]);
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [5, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setImageUri(uri);
      await processImage(uri);
    }
  };

  const takePhoto = async () => {
    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [5, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setImageUri(uri);
      await processImage(uri);
    }
  };

  const processImage = async (uri: string) => {
    setLoading(true);
    try {

      const base64 = await getBase64(uri);
      const response = await axios.post(
        "https://us-central1-treasupdate.cloudfunctions.net/detectCar",
        {
          imageBase64: base64,
        }
      );

      const vehicleInfo = response.data;
      setVehicleData(vehicleInfo);
      //console.log("data vehiculo vector ", vehicleInfo)

      setLog("Datos del vehículo cargados correctamente.");
      setLoaded(true);
    } catch (error) {
      console.error("Error processing image:", error);
      setLog("Error processing image. Please try again.");
    } finally {
      setLoading(false);
    }
  };


  const getBase64 = (uri: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = function () {
        const reader = new FileReader();
        reader.onloadend = function () {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.readAsDataURL(xhr.response);
      };
      xhr.onerror = function () {
        reject(new Error("Failed to fetch base64 from uri"));
      };
      xhr.open("GET", uri);
      xhr.responseType = "blob";
      xhr.send();
    });
  };

  const handleAddCar = async () => {
    if (!isFormComplete) return;
    setLoading(true);
    try {
      // Crear el objeto del vehículo
      const newCar = {
        ...vehicleData,
        car_image: "",
        approved: false,
        active: false,
        driver: uid,
        createdAt: Date.now(),
      };
      //console.log("DANIEL", imageUriVehicle)
      // Llamar a la acción addCar
      await dispatch(addCar({ vehicle: newCar, imageUriVehicle })).unwrap();

      // Navegar de regreso a la pantalla anterior
      navigation.goBack();
    } catch (error) {
      console.error("Error al crear el vehículo:", error);
      setLog("Error al crear el vehículo. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
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

      //console.log("aaaaaa", uri)
      setimageUriVehicle(uri);

    }

    setModalVisible(false);
  };

  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["25%", "40%"], [height]);
  const handlePresentModalPress = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <BottomSheetModalProvider>
        <View style={styles.container}>
          <View style={styles.imageContainer}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.image} />
            ) : null}
          </View>
          {/**    <View style={{ width: "100%", alignItems: "center" }}>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={handlePresentModalPress}
          >
            <Text style={styles.uploadButtonText}>
              Cargar Tarjeta de Propiedad
            </Text>
          </TouchableOpacity>
        </View> */}

          <View style={{ width: "100%", alignItems: "center", marginVertical: 10 }}>
            <TouchableOpacity
              style={styles.circularBackground}
              onPress={() => setModalVisible(true)}
            >
              {imageUriVehicle ? (
                <Image
                  source={{ uri: imageUriVehicle }} // Mostrar la imagen seleccionada
                  style={styles.uploadCarImage}
                />
              ) : (
                <Image
                  source={require('@/assets/images/TREAS-X.png')} // Mostrar la imagen por defecto si no hay imagen seleccionada
                  style={styles.uploadCarImage}
                />
              )}
              <Text style={styles.uploadDescription}>📷</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Placa del Vehículo</Text>
              <TextInput
                value={vehicleData.vehicleNumber}
                style={styles.input}
                placeholderTextColor="#000"
                onChangeText={(text) =>
                  setVehicleData({ ...vehicleData, vehicleNumber: text })
                }
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Número de Motor</Text>
              <TextInput
                value={vehicleData.vehicleNoMotor}
                style={styles.input}
                placeholderTextColor="#000"
                onChangeText={(text) =>
                  setVehicleData({ ...vehicleData, vehicleNoMotor: text })
                }
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Número de Chasis</Text>
              <TextInput
                value={vehicleData.vehicleNoChasis}
                style={styles.input}
                placeholderTextColor="#000"
                onChangeText={(text) =>
                  setVehicleData({ ...vehicleData, vehicleNoChasis: text })
                }
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Marca del Vehículo</Text>
              {Platform.OS === "android" ? (
                <Picker
                  selectedValue={vehicleData.vehicleMake}
                  onValueChange={(itemValue) =>
                    setVehicleData({ ...vehicleData, vehicleMake: itemValue })
                  }
                  style={styles.input}
                >
                  <Picker.Item label="Seleccione una marca" value="" />
                  {marcasDeVehiculos.map((marca) => (
                    <Picker.Item key={marca.value} label={marca.label} value={marca.value} />
                  ))}
                </Picker>
              ) : (
                <RNPickerSelect
                  onValueChange={(itemValue) => setVehicleData({ ...vehicleData, vehicleMake: itemValue })}
                  items={marcasDeVehiculos.map((marca) => ({
                    label: marca.label,
                    value: marca.value,
                  }))}
                  placeholder={{ label: "Seleccione una marca", value: null }}
                  style={{
                    inputIOS: {
                      color: "black",
                      fontSize: 16,
                      paddingHorizontal: 10,
                      paddingVertical: 8,
                      borderColor: "#a1a3a6",
                      borderRadius: 10,
                      backgroundColor: colorScheme === "dark" ? "#000" : "#fff",
                    },
                  }}
                />
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Cilindraje del Vehículo</Text>
              {Platform.OS === "android" ? (
                <Picker
                  selectedValue={vehicleData.vehicleCylinders}
                  onValueChange={(itemValue) =>
                    setVehicleData({ ...vehicleData, vehicleCylinders: itemValue })
                  }
                  style={styles.input}
                >
                  <Picker.Item label="Seleccione el cilindraje" value="" />
                  {CilindrajesDeVehiculos.map((cilindraje) => (
                    <Picker.Item key={cilindraje.value} label={cilindraje.label} value={cilindraje.value} />
                  ))}
                </Picker>
              ) : (
                <RNPickerSelect
                  onValueChange={(itemValue) => setVehicleData({ ...vehicleData, vehicleCylinders: itemValue })}
                  items={CilindrajesDeVehiculos.map((cilindraje) => ({
                    label: cilindraje.label,
                    value: cilindraje.value,
                  }))}
                  placeholder={{ label: "Seleccione el cilindraje", value: null }}
                  style={{
                    inputIOS: {
                      color: "black",
                      fontSize: 16,
                      paddingHorizontal: 10,
                      paddingVertical: 8,
                      borderColor: "#a1a3a6",
                      borderRadius: 10,
                      backgroundColor: colorScheme === "dark" ? "#000" : "#fff",
                    },
                  }}
                />
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Tipo de Combustible</Text>
              {Platform.OS === "android" ? (
                <Picker
                  selectedValue={vehicleData.vehicleFuel}
                  onValueChange={(itemValue) =>
                    setVehicleData({ ...vehicleData, vehicleFuel: itemValue })
                  }
                  style={styles.input}
                >
                  <Picker.Item label="Seleccione el tipo de combustible" value="" />
                  {TipoCombustible.map((combustible) => (
                    <Picker.Item key={combustible.value} label={combustible.label} value={combustible.value} />
                  ))}
                </Picker>
              ) : (
                <RNPickerSelect
                  onValueChange={(itemValue) => setVehicleData({ ...vehicleData, vehicleFuel: itemValue })}
                  items={TipoCombustible.map((combustible) => ({
                    label: combustible.label,
                    value: combustible.value,
                  }))}
                  placeholder={{ label: "Seleccione el tipo de combustible", value: null }}
                  style={{
                    inputIOS: {
                      color: "black",
                      fontSize: 16,
                      paddingHorizontal: 10,
                      paddingVertical: 8,
                      borderColor: "#a1a3a6",
                      borderRadius: 10,
                      backgroundColor: colorScheme === "dark" ? "#000" : "#fff",
                    },
                  }}
                />
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Modelo del Vehículo</Text>
              {Platform.OS === "android" ? (
                <Picker
                  selectedValue={vehicleData.vehicleModel}
                  onValueChange={(itemValue) =>
                    setVehicleData({ ...vehicleData, vehicleModel: itemValue })
                  }
                  style={styles.input}
                >
                  <Picker.Item label="Seleccione el modelo" value="" />
                  {ModelosDeVehiculos.map((modelo) => (
                    <Picker.Item key={modelo.value} label={modelo.label} value={modelo.value} />
                  ))}
                </Picker>
              ) : (
                <RNPickerSelect
                  onValueChange={(itemValue) => setVehicleData({ ...vehicleData, vehicleModel: itemValue })}
                  items={ModelosDeVehiculos.map((modelo) => ({
                    label: modelo.label,
                    value: modelo.value,
                  }))}
                  placeholder={{ label: "Seleccione el modelo", value: null }}
                  style={{
                    inputIOS: {
                      color: "black",
                      fontSize: 16,
                      paddingHorizontal: 10,
                      paddingVertical: 8,
                      borderColor: "#a1a3a6",
                      borderRadius: 10,
                      backgroundColor: colorScheme === "dark" ? "#000" : "#fff",
                    },
                  }}
                />
              )}
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Clase de Vehículo</Text>
              {Platform.OS === "android" ? (
                <Picker
                  selectedValue={vehicleData.vehicleForm}
                  onValueChange={(itemValue) =>
                    setVehicleData({ ...vehicleData, vehicleForm: itemValue })
                  }
                  style={styles.input}
                >
                  <Picker.Item label="Seleccione clase de vehículo" value="" />
                  {vehicleTypes.map((type) => (
                    <Picker.Item key={type} label={type} value={type} />
                  ))}
                </Picker>
              ) : (
                <RNPickerSelect
                  onValueChange={(itemValue) => setVehicleData({ ...vehicleData, vehicleForm: itemValue })}
                  items={vehicleTypes.map((type) => ({
                    label: type,
                    value: type,
                  }))}
                  placeholder={{ label: "Seleccione clase de vehículo", value: null }}
                  style={{
                    inputIOS: {
                      color: "black",
                      fontSize: 16,
                      paddingHorizontal: 10,
                      paddingVertical: 8,
                      borderColor: "#a1a3a6",
                      borderRadius: 10,
                      backgroundColor: colorScheme === "dark" ? "#000" : "#fff",
                    },
                  }}
                />
              )}
            </View>

            {/* Input para vehicleColor */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Color del Vehículo</Text>
              <TextInput
                value={vehicleData.vehicleColor}
                style={styles.input}
                placeholderTextColor="#000"
                onChangeText={(text) =>
                  setVehicleData({ ...vehicleData, vehicleColor: text })
                }
              />
            </View>

            {/* Input para vehicleNoVin */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Número de VIN del Vehículo</Text>
              <TextInput
                value={vehicleData.vehicleNoVin}
                style={styles.input}
                placeholderTextColor="#000"
                onChangeText={(text) =>
                  setVehicleData({ ...vehicleData, vehicleNoVin: text })
                }
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Cantidad de puertas</Text>
              <TextInput
                value={vehicleData.vehicleDoors}
                style={styles.input}
                placeholderTextColor="#000"
                onChangeText={(text) =>
                  setVehicleData({ ...vehicleData, vehicleDoors: text })
                }
              />
            </View>

            {/* Input para vehicleNoSerie */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Número de Serie del Vehículo</Text>
              <TextInput
                value={vehicleData.vehicleNoSerie}
                style={styles.input}
                placeholderTextColor="#000"
                onChangeText={(text) =>
                  setVehicleData({ ...vehicleData, vehicleNoSerie: text })
                }
              />
            </View>

            {/* Input para vehiclePassengers */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Número de Pasajeros</Text>
              <TextInput
                value={vehicleData.vehiclePassengers}
                style={styles.input}
                placeholderTextColor="#000"
                onChangeText={(text) =>
                  setVehicleData({ ...vehicleData, vehiclePassengers: text })
                }
              />
            </View>

            {/* Input para vehicleMetalup */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Tipo de Carrocería</Text>
              {Platform.OS === "android" ? (
                <Picker
                  selectedValue={vehicleData.vehicleMetalup}
                  style={styles.input}
                  onValueChange={(itemValue) =>
                    setVehicleData({ ...vehicleData, vehicleMetalup: itemValue })
                  }
                >
                  <Picker.Item label="Selecciona un tipo de carrocería" value="" />
                  {bodyworkTypes.map((type) => (
                    <Picker.Item key={type} label={type} value={type} />
                  ))}
                </Picker>
              ) : (
                <RNPickerSelect
                  onValueChange={(itemValue) => setVehicleData({ ...vehicleData, vehicleMetalup: itemValue })}
                  items={bodyworkTypes.map((type) => ({
                    label: type,
                    value: type,
                  }))}
                  placeholder={{ label: "Selecciona un tipo de carrocería", value: null }}
                  style={{
                    inputIOS: {
                      color: "black",
                      fontSize: 16,
                      paddingHorizontal: 10,
                      paddingVertical: 8,
                      borderColor: "#a1a3a6",
                      borderRadius: 10,
                      backgroundColor: colorScheme === "dark" ? "#000" : "#fff",
                    },
                  }}
                />
              )}
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Tipo de Servicio</Text>
              {Platform.OS === "android" ? (
                <Picker
                  selectedValue={vehicleData.carType}
                  style={styles.input}
                  onValueChange={(itemValue) =>
                    setVehicleData({ ...vehicleData, carType: itemValue })
                  }
                >
                  <Picker.Item label="Selecciona un tipo de Servicio" value="" />
                  {serviceTypes.map((type) => (
                    <Picker.Item key={type.value} label={type.description} value={type.value} />
                  ))}
                </Picker>
              ) : (
                <RNPickerSelect
                  onValueChange={(itemValue) => setVehicleData({ ...vehicleData, carType: itemValue })}
                  items={serviceTypes.map((type) => ({
                    label: type.description,
                    value: type.value,
                  }))}
                  placeholder={{ label: "Selecciona un tipo de Servicio", value: null }}
                  style={{
                    inputIOS: {
                      color: "black",
                      fontSize: 16,
                      paddingHorizontal: 10,
                      paddingVertical: 8,
                      borderColor: "#a1a3a6",
                      borderRadius: 10,
                      backgroundColor: colorScheme === "dark" ? "#000" : "#fff",
                    },
                  }}
                />
              )}
            </View>

            {/* Repite esta estructura para cada campo que quieras */}
          </ScrollView>





          <View>
            <TouchableOpacity
              onPress={handleAddCar}
              style={[
                styles.botonCamera,
                {
                  width: "50%",
                  backgroundColor: isFormComplete ? "#F20505" : "#B0B0B0"
                }
              ]}
              disabled={!isFormComplete}
            >
              <Text style={styles.saveButtonText}>Guardar Vehículo</Text>
            </TouchableOpacity>
          </View>
          {!loading && (
            <BottomSheetModal
              ref={bottomSheetModalRef}
              index={0}
              snapPoints={snapPoints}
            >
              <View>
                <TouchableOpacity
                  style={[styles.botonCamera, { width: "50%" }]}
                  onPress={takePhoto}
                >
                  <Text style={styles.buttonText}>Tomar una foto</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.botonCamera, { width: "65%" }]}
                  onPress={pickImage}
                >
                  <Text style={styles.buttonText}>Cargar desde la galería</Text>
                </TouchableOpacity>
              </View>
            </BottomSheetModal>
          )}
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
                  <Ionicons name="camera" size={24} color="white" style={styles.modalIcon} />
                  <Text style={styles.modalButtonText}>Tomar Foto</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.botonGallery}
                  onPress={() => selectImage(false)}
                >
                  <Ionicons name="images" size={24} color="white" style={styles.modalIcon} />
                  <Text style={styles.modalButtonText}>Cargar desde Dispositivo</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setModalVisible(false)}
                >
                  <MaterialIcons name="cancel" size={24} color="#FF0000" style={styles.modalIcon} />
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#F20505" />
              <Text style={styles.loadingText}>Cargando...</Text>
            </View>
          )}

          {loaded && (
            <View style={styles.animationContainer}>
              <LottieView
                source={require("@/json/animation.json")}
                autoPlay
                loop={false}
                onAnimationFinish={() => setLoaded(false)}
              />
              <Text style={styles.successText}>
                Estamos terminando de leer tus datos. Por Favor Espera Un Momento.
              </Text>
            </View>
          )}
          {successMessage && (
            <View style={styles.animationContainer}>
              <LottieView
                source={require("@/json/animation.json")}
                autoPlay
                loop={false}
              />
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
          )}
        </View>
      </BottomSheetModalProvider>
    </KeyboardAvoidingView>
  );
};

const lightStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#eee",
  },
  circularBackground: {
    backgroundColor: "#f2f2f2",
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
  uploadCarImage: {
    width: 100,
    height: 100,
    resizeMode: "contain",
  },
  imageContainer: {
    width: "100%",
    marginVertical: 10,
    alignItems: "center",
    borderRadius: 23,
    elevation: 5,
  },
  image: {
    width: 350,
    height: 200,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
  },
  inputContainer: {
    width: "100%",
    marginVertical: 10,
    borderRadius: 10,
    backgroundColor: "#fff",
    elevation: 2,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  label: {
    fontSize: 14,
    color: "#555",
    marginBottom: 5,
  },
  input: {
    width: "100%",
    height: 40,
    fontSize: 16,
    color: "#333",
    borderBottomWidth: 1,
    borderColor: "#ccc",
    paddingBottom: 5,
  },
  uploadButton: {
    backgroundColor: "#F20505",
    borderRadius: 16,
    alignItems: "center",
    marginVertical: 5,
    elevation: 5,
  },
  uploadButtonText: {
    color: "white",
    marginVertical: 10,
    fontSize: 16,
    fontWeight: "bold",
    marginHorizontal: 10,
  },

  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 18,
    color: "#FFF",
  },
  animationContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  successText: {
    marginTop: 20,
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    width: 320,
    padding: 25,
    backgroundColor: "white",
    borderRadius: 20,
    alignItems: "center",
    elevation: 10,
  },
  modalText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
  },
  modalIcon: {
    marginRight: 10,
  },
  botonCamera: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF0000",
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
    backgroundColor: "#b90000",
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
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginTop: 15,
    width: "100%",
    justifyContent: "center",
    elevation: 5,
    borderWidth: 1,
    borderColor: "#FF0000",
  },
  cancelButtonText: {
    color: "#FF0000",
    fontSize: 16,
    fontWeight: "bold",
  },
});
const darkStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#474747",
  },
  circularBackground: {
    backgroundColor: "#f2f2f2",
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
  uploadCarImage: {
    width: 100,
    height: 100,
    resizeMode: "contain",
  },
  imageContainer: {
    width: "100%",
    marginVertical: 10,
    alignItems: "center",
    borderRadius: 23,
    elevation: 5,
  },
  image: {
    width: 350,
    height: 200,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
  },
  inputContainer: {
    width: "100%",
    marginVertical: 10,
    borderRadius: 10,
    backgroundColor: "#000",
    elevation: 2,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  label: {
    fontSize: 14,
    color: "#fff",
    marginBottom: 5,
  },
  input: {
    width: "100%",
    height: 40,
    fontSize: 16,
    color: "#333",
    borderBottomWidth: 1,
    borderColor: "#ccc",
    paddingBottom: 5,
    color: "#fff",

  },
  uploadButton: {
    backgroundColor: "#F20505",
    borderRadius: 16,
    alignItems: "center",
    marginVertical: 5,
    elevation: 5,
  },
  uploadButtonText: {
    color: "white",
    marginVertical: 10,
    fontSize: 16,
    fontWeight: "bold",
    marginHorizontal: 10,
  },

  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 18,
    color: "#FFF",
  },
  animationContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  successText: {
    marginTop: 20,
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    width: 320,
    padding: 25,
    backgroundColor: "white",
    borderRadius: 20,
    alignItems: "center",
    elevation: 10,
  },
  modalText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
  },
  modalIcon: {
    marginRight: 10,
  },
  botonCamera: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF0000",
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
    backgroundColor: "#b90000",
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
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginTop: 15,
    width: "100%",
    justifyContent: "center",
    elevation: 5,
    borderWidth: 1,
    borderColor: "#FF0000",
  },
  cancelButtonText: {
    color: "#FF0000",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default CarsScreen;
