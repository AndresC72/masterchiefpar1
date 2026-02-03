import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  StatusBar,
  Modal,
  Pressable,
  Image,
  Switch,
  SafeAreaView,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { RootState } from "@/common/store";
import { fetchUserCars } from "@/common/actions/caractions";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import VehicleCard from "@/components/VehicleCard";
import { getDatabase, ref, update, remove, orderByChild, query, equalTo, onValue } from "firebase/database";
import { FontAwesome } from '@expo/vector-icons';
import { listenToSettingsChanges, selectSettings } from '@/common/reducers/settingsSlice';
import { useColorScheme } from 'react-native';
const { height } = Dimensions.get("window");

type Props = NativeStackScreenProps<any>;

const CarsScreen = ({ navigation }: Props) => {
  const dispatch = useDispatch();
  const { vehicles, loading, error } = useSelector(
    (state: RootState) => state.vehicles
  );
  const user = useSelector((state: RootState) => state.auth.user);
  const colorScheme = useColorScheme();
  // Estados para el modal
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCar, setSelectedCar] = useState<any>(null);
  const [isVehicleActive, setIsVehicleActive] = useState<boolean>(false);
  const settings = useSelector(selectSettings);
  const styles = colorScheme === "dark" ? darkStyles : lightStyles; // Estilos dinámicos

  useEffect(() => {
    // Start listening to settings changes
    dispatch(listenToSettingsChanges());
  }, [dispatch]);
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        dispatch(fetchUserCars(user.uid));
      }

      return () => unsubscribe();
    });
  }, [dispatch, user]);

  useEffect(() => {
    if (user) {
      const db = getDatabase();
      const carsRef = ref(db, 'cars');
      const userCarsQuery = query(carsRef, orderByChild('driver'), equalTo(user.uid));

      const unsubscribe = onValue(userCarsQuery, (snapshot) => {
        if (snapshot.exists()) {
          const carsData = snapshot.val();
          const carsArray = Object.keys(carsData).map((key) => ({
            id: key,
            ...carsData[key],
          }));
          dispatch({ type: 'vehicles/fetchUserCars/fulfilled', payload: carsArray });
        } else {
          dispatch({ type: 'vehicles/fetchUserCars/fulfilled', payload: [] });
        }
      });

      return () => {
        unsubscribe();  // Unsubscribe from the real-time listener when the component unmounts
      };
    }
  }, [dispatch, user]);

  useEffect(() => {
    if (selectedCar) {
      setIsVehicleActive(selectedCar.active);
    }
  }, [selectedCar]);

  const navigateHome = () => {
    navigation.navigate("CarsEdit");
  };

  const onPress = (car: any) => {
    setSelectedCar(car);
    setModalVisible(true);
  };


  const onDelete = async (car: any) => {
    //console.log("esta tocanoem")
    if (!car || !car.id) return;

    try {
      const db = getDatabase();
      const carRef = ref(db, `cars/${car.id}`);
      await remove(carRef); // Elimina el vehículo de la base de datos

      // Después de eliminar, recargar la lista de vehículos
      if (user) {
        dispatch(fetchUserCars(user.uid));
      }
      setModalVisible(false)
    } catch (error) {
      console.error("Error eliminando el vehículo:", error);
    }
  };

  const toggleSwitch = async () => {
    if (!selectedCar) return;

    const db = getDatabase();
    const userId = user?.uid;

    if (!userId) return;

    try {
      const updates = {};
      vehicles.forEach((vehicle) => {
        updates[`/cars/${vehicle.id}/active`] = false;
      });

      updates[`/cars/${selectedCar.id}/active`] = !isVehicleActive;

      await update(ref(db), updates);

      setIsVehicleActive(!isVehicleActive);

      const userData = {
        vehicleNumber: selectedCar.vehicleNumber || "",
        vehicleMake: selectedCar.vehicleMake || "",
        vehicleModel: selectedCar.vehicleModel || "",
        cartype: selectedCar.carType || "",
        car_image: selectedCar.car_image || "",
        carType: selectedCar.carType || "",
        vehicleColor: selectedCar.vehicleColor || "",

        vehicleCylinders: selectedCar.vehicleCylinders || "",
        vehicleDoors: selectedCar.vehicleDoors || "",
        vehicleForm: selectedCar.vehicleForm || "",

        vehicleFuel: selectedCar.vehicleFuel || "",
        vehicleLine: selectedCar.vehicleLine || "",
        vehicleMetalup: selectedCar.vehicleMetalup || "",
        vehicleNoChasis: selectedCar.vehicleNoChasis || "",

        vehicleNoMotor: selectedCar.vehicleNoMotor || "",
        vehicleNoSerie: selectedCar.vehicleNoSerie || "",
        vehicleNoVin: selectedCar.vehicleNoVin || "",
        vehiclePassengers: selectedCar.vehiclePassengers || "",
        carApproved: settings.carApproval ? true : selectedCar.carApproved || false,
        updatedFrom: "NEW_Web",
      };

      if (settings.carApproval) {
        userData.carApproved = true;
      }

      await update(ref(db, `users/${userId}`), userData);

      dispatch(fetchUserCars(userId));
    } catch (error) {
      console.error("Error updating vehicle status:", error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={navigateHome}
          style={styles.addButton}
        >
          <Text style={styles.addButtonText}>Crear Vehículo</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >

        {loading ? (
          <Text>Cargando...</Text>
        ) : error ? (
          <Text>Error: {error}</Text>
        ) : vehicles && vehicles.length > 0 ? (
          vehicles.map((car, i) => (
            <VehicleCard
              key={"index" + i}
              car={car}
              onPress={() => onPress(car)}
              onDelete={onDelete}
            />
          ))
        ) : (
          <ImageBackground
            source={require("./../../assets/images/createCar.jpg")}
            style={styles.backgroundImage}
          >
            <StatusBar hidden={true} />
            <View style={styles.overlay} />
            <View style={styles.emptyState}>

              <TouchableOpacity
                onPress={navigateHome}
                style={styles.addButton}
              >
                <Text style={styles.addButtonText}>Añadir Vehículo</Text>
              </TouchableOpacity>
            </View>
          </ImageBackground>
        )}
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalView}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalles del Vehículo</Text>
              <TouchableOpacity
                onPress={() => onDelete(selectedCar)} // Llama a onDelete cuando se presiona la basura
                style={styles.deleteIconContainer}
              >
                <FontAwesome name="trash" size={24} color="#f20505" />
              </TouchableOpacity>
            </View>
            {selectedCar && (

              <View style={styles.detailsContainer}>
                <ScrollView contentContainerStyle={styles.scrollViewContent}>
                  <Image
                    source={
                      selectedCar?.car_image
                        ? { uri: selectedCar.car_image }
                        : require('../../assets/images/iconos3d/12.png') // Imagen predeterminada local
                    }
                    style={styles.vehicleImage}
                  />



                  <View style={styles.textRow}>
                    <Text style={styles.label}>Activar Vehículo:</Text>
                    <Switch
                      trackColor={{ false: "#EE0000", true: "#F20505" }}
                      thumbColor={isVehicleActive ? "#0E0D0D" : "#494949"}
                      ios_backgroundColor="#3e3e3e"
                      onValueChange={toggleSwitch}
                      value={isVehicleActive}
                    />
                  </View>

                  <View style={styles.textRow}>
                    <Text style={styles.label}>Marca:</Text>
                    <Text style={styles.value}>{selectedCar.vehicleMake}</Text>
                  </View>

                  <View style={styles.textRow}>
                    <Text style={styles.label}>Modelo:</Text>
                    <Text style={styles.value}>{selectedCar.vehicleModel}</Text>
                  </View>

                  <View style={styles.textRow}>
                    <Text style={styles.label}>Color:</Text>
                    <Text style={styles.value}>{selectedCar.vehicleColor}</Text>
                  </View>

                  <View style={styles.textRow}>
                    <Text style={styles.label}>Tipo de vehículo:</Text>
                    <Text style={styles.value}>{selectedCar.carType}</Text>
                  </View>

                  <View style={styles.textRow}>
                    <Text style={styles.label}>Línea:</Text>
                    <Text style={styles.value}>{selectedCar.vehicleLine}</Text>
                  </View>

                  <View style={styles.textRow}>
                    <Text style={styles.label}>Metalup:</Text>
                    <Text style={styles.value}>{selectedCar.vehicleMetalup}</Text>
                  </View>

                  <View style={styles.textRow}>
                    <Text style={styles.label}>Cilindrada:</Text>
                    <Text style={styles.value}>{selectedCar.vehicleCylinders}</Text>
                  </View>

                  <View style={styles.textRow}>
                    <Text style={styles.label}>Puertas:</Text>
                    <Text style={styles.value}>{selectedCar.vehicleDoors}</Text>
                  </View>

                  <View style={styles.textRow}>
                    <Text style={styles.label}>Combustible:</Text>
                    <Text style={styles.value}>{selectedCar.vehicleFuel}</Text>
                  </View>

                  <View style={styles.textRow}>
                    <Text style={styles.label}>Número de Serie:</Text>
                    <Text style={styles.value}>{selectedCar.vehicleNoSerie}</Text>
                  </View>

                  <View style={styles.textRow}>
                    <Text style={styles.label}>Número de Motor:</Text>
                    <Text style={styles.value}>{selectedCar.vehicleNoMotor}</Text>
                  </View>

                  <View style={styles.textRow}>
                    <Text style={styles.label}>Número de Chasis:</Text>
                    <Text style={styles.value}>{selectedCar.vehicleNoChasis}</Text>
                  </View>

                  <View style={styles.textRow}>
                    <Text style={styles.label}>Número de VIN:</Text>
                    <Text style={styles.value}>{selectedCar.vehicleNoVin}</Text>
                  </View>

                  <View style={styles.textRow}>
                    <Text style={styles.label}>Número del Vehículo:</Text>
                    <Text style={styles.value}>{selectedCar.vehicleNumber}</Text>
                  </View>

                  <View style={styles.textRow}>
                    <Text style={styles.label}>Capacidad de Pasajeros:</Text>
                    <Text style={styles.value}>{selectedCar.vehiclePassengers}</Text>
                  </View>

                  <View style={styles.textRow}>
                    <Text style={styles.label}>Otra información:</Text>
                    <Text style={styles.value}>{selectedCar.other_info}</Text>
                  </View>
                </ScrollView>
              </View>
            )}
            <Pressable
              style={styles.buttonClose}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.textStyle}>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const lightStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 80, // Ajusta el padding inferior para dar espacio a la navbar
    paddingHorizontal: 20,
  },
  header: {
    width: "100%",
    height: "10%",
    alignItems: "center",
    justifyContent: "center",
  },
  addButton: {
    backgroundColor: "#F20505",
    borderRadius: 23,
    paddingVertical: 10, // Añade padding vertical para asegurar espacio suficiente
    paddingHorizontal: 20,
    zIndex: 10,
  },


  addButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF", // Asegura que el texto sea blanco
    textAlign: "center",
  },
  backgroundImage: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
  },
  emptyState: {
    justifyContent: "center",
    alignItems: "center",
    height: height, // Asegura que el contenedor ocupe todo el espacio
    padding: 10,
  },
  emptyStateText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
    position: "absolute",
    top: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: "90%",
    maxHeight: "80%",
  },
  modalHeader: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  deleteIconContainer: {
    padding: 10,
  },
  detailsContainer: {
    width: "100%",
  },
  vehicleImage: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginBottom: 20,
  },
  textRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  label: {
    fontWeight: "bold",
  },
  value: {
    flexShrink: 1,
    textAlign: "right",
  },
  buttonClose: {
    backgroundColor: "#F20505",
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    marginTop: 20,
    width: "60%",
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
});
const darkStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#474747',
  },
  container: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 80, // Ajusta el padding inferior para dar espacio a la navbar
    paddingHorizontal: 20,
  },
  header: {
    width: "100%",
    height: "10%",
    alignItems: "center",
    justifyContent: "center",
  },
  addButton: {
    backgroundColor: "#F20505",
    borderRadius: 23,
    paddingVertical: 10, // Añade padding vertical para asegurar espacio suficiente
    paddingHorizontal: 20,
    zIndex: 10,
  },


  addButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF", // Asegura que el texto sea blanco
    textAlign: "center",
  },
  backgroundImage: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
  },
  emptyState: {
    justifyContent: "center",
    alignItems: "center",
    height: height, // Asegura que el contenedor ocupe todo el espacio
    padding: 10,
  },
  emptyStateText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
    position: "absolute",
    top: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    backgroundColor: "#474747",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: "90%",
    maxHeight: "80%",
  },
  modalHeader: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFF",
  },
  deleteIconContainer: {
    padding: 10,
  },
  detailsContainer: {
    width: "100%",
  },
  vehicleImage: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginBottom: 20,
  },
  textRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  label: {
    fontWeight: "bold",
    color: "#FFF",
  },
  value: {
    flexShrink: 1,
    textAlign: "right",
    color: "#CACACA",
  },
  buttonClose: {
    backgroundColor: "#F20505",
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    marginTop: 20,
    width: "60%",
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default CarsScreen;
