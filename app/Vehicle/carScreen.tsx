import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useDispatch, useSelector } from "react-redux";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { getDatabase, equalTo, onValue, orderByChild, query, ref, remove, update } from "firebase/database";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { RootState } from "@/common/store";
import { fetchUserCars } from "@/common/actions/caractions";
import { listenToSettingsChanges, selectSettings } from "@/common/reducers/settingsSlice";
import { VEHICLE_RULES } from "@/common/utils/vehicleRules";

type Props = NativeStackScreenProps<any>;

const BG_IMAGE = require("../../assets/images/bg.png");
const FALLBACK_CAR_IMAGE = require("../../assets/images/iconos3d/12.png");

const CarsScreen = ({ navigation }: Props) => {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const { vehicles, loading, error } = useSelector((state: RootState) => state.vehicles);
  const user = useSelector((state: RootState) => state.auth.user) as any;
  const settings = useSelector(selectSettings);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCar, setSelectedCar] = useState<any>(null);
  const [isVehicleActive, setIsVehicleActive] = useState(false);

  const headerTopPadding = Platform.OS === "android" ? Math.max(insets.top, 10) + 8 : 10;
  const contentBottomPadding = Platform.OS === "android" ? Math.max(insets.bottom, 12) + 88 : insets.bottom + 100;
  const modalBottomPadding = insets.bottom + 20;

  const vehicleLimitReached = Array.isArray(vehicles) && vehicles.length >= VEHICLE_RULES.MAX_VEHICLES_PER_DRIVER;

  useEffect(() => {
    dispatch(listenToSettingsChanges());
  }, [dispatch]);

  useEffect(() => {
    if (!user?.uid) {
      return;
    }

    dispatch(fetchUserCars(user.uid));

    const db = getDatabase();
    const carsRef = ref(db, "cars");
    const userCarsQuery = query(carsRef, orderByChild("driver"), equalTo(user.uid));

    const unsubscribe = onValue(userCarsQuery, (snapshot) => {
      if (snapshot.exists()) {
        const carsData = snapshot.val();
        const carsArray = Object.keys(carsData).map((key) => ({
          id: key,
          ...carsData[key],
        }));
        dispatch({ type: "vehicles/fetchUserCars/fulfilled", payload: carsArray });
        return;
      }

      dispatch({ type: "vehicles/fetchUserCars/fulfilled", payload: [] });
    });

    return () => unsubscribe();
  }, [dispatch, user?.uid]);

  useEffect(() => {
    if (!selectedCar) {
      return;
    }

    setIsVehicleActive(Boolean(selectedCar.active));
  }, [selectedCar]);

  const detailRows = useMemo(
    () => [
      { label: "Marca", value: selectedCar?.vehicleMake },
      { label: "Modelo", value: selectedCar?.vehicleModel },
      { label: "Color", value: selectedCar?.vehicleColor },
      { label: "Tipo de vehiculo", value: selectedCar?.carType },
      { label: "Linea", value: selectedCar?.vehicleLine },
      { label: "Carroceria", value: selectedCar?.vehicleMetalup },
      { label: "Cilindrada", value: selectedCar?.vehicleCylinders },
      { label: "Puertas", value: selectedCar?.vehicleDoors },
      { label: "Combustible", value: selectedCar?.vehicleFuel },
      { label: "Numero de serie", value: selectedCar?.vehicleNoSerie },
      { label: "Numero de motor", value: selectedCar?.vehicleNoMotor },
      { label: "Numero de chasis", value: selectedCar?.vehicleNoChasis },
      { label: "Numero de VIN", value: selectedCar?.vehicleNoVin },
      { label: "Placa", value: selectedCar?.vehicleNumber },
      { label: "Pasajeros", value: selectedCar?.vehiclePassengers },
      { label: "Otra informacion", value: selectedCar?.other_info },
    ],
    [selectedCar]
  );

  const navigateToCreateVehicle = () => {
    navigation.navigate("CarsEdit");
  };

  const openDetails = (car: any) => {
    setSelectedCar(car);
    setModalVisible(true);
  };

  const onDelete = async (car: any) => {
    if (!car?.id) {
      return;
    }

    try {
      const db = getDatabase();
      await remove(ref(db, `cars/${car.id}`));
      setModalVisible(false);

      if (user?.uid) {
        dispatch(fetchUserCars(user.uid));
      }
    } catch (deleteError) {
      console.error("Error eliminando el vehiculo:", deleteError);
    }
  };

  const toggleSwitch = async () => {
    if (!selectedCar?.id || !user?.uid) {
      return;
    }

    try {
      const db = getDatabase();
      const updates: Record<string, any> = {};

      vehicles.forEach((vehicle: any) => {
        updates[`/cars/${vehicle.id}/active`] = false;
      });

      updates[`/cars/${selectedCar.id}/active`] = !isVehicleActive;
      await update(ref(db), updates);

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

      await update(ref(db, `users/${user.uid}`), userData);
      setIsVehicleActive(!isVehicleActive);

      if (user?.uid) {
        dispatch(fetchUserCars(user.uid));
      }
    } catch (toggleError) {
      console.error("Error actualizando el estado del vehiculo:", toggleError);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar hidden />

      <Image source={BG_IMAGE} style={styles.bgImage} resizeMode="cover" />
      <View pointerEvents="none" style={styles.bgOverlay} />
      <View pointerEvents="none" style={styles.bgGlowTop} />
      <View pointerEvents="none" style={styles.bgGlowBottom} />

      <View style={[styles.header, { paddingTop: headerTopPadding }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()} activeOpacity={0.84}>
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerEyebrow}>T+plus</Text>
          <Text style={styles.headerTitle}>Mis Vehiculos</Text>
        </View>

        <TouchableOpacity
          style={[styles.headerCreateBtn, vehicleLimitReached && { opacity: 0.38 }]}
          onPress={vehicleLimitReached ? undefined : navigateToCreateVehicle}
          activeOpacity={vehicleLimitReached ? 1 : 0.9}
        >
          <Ionicons name="add" size={18} color="#051A26" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: contentBottomPadding }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <Text style={styles.heroTag}>Crear Vehiculo</Text>
          <Text style={styles.heroTitle}>Tu acceso inteligente para conducir en T+plus</Text>
          <Text style={styles.heroText}>
            Administra tus vehiculos, activa el que usaras hoy y agrega uno nuevo cuando lo necesites.
          </Text>

          {vehicleLimitReached ? (
            <View style={styles.vehicleLimitBanner}>
              <Ionicons name="alert-circle-outline" size={16} color="#FFA726" />
              <Text style={styles.vehicleLimitBannerText}>
                Límite alcanzado · {vehicles.length}/{VEHICLE_RULES.MAX_VEHICLES_PER_DRIVER} vehículos
              </Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.heroButton} onPress={navigateToCreateVehicle} activeOpacity={0.88}>
              <Text style={styles.heroButtonText}>Añadir Vehiculo</Text>
              <Ionicons name="arrow-forward" size={16} color="#051A26" />
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <View style={styles.feedbackCard}>
            <ActivityIndicator color="#00E5FF" />
            <Text style={styles.feedbackText}>Cargando tus vehiculos...</Text>
          </View>
        ) : error ? (
          <View style={styles.feedbackCard}>
            <MaterialIcons name="error-outline" size={22} color="#FF6B6B" />
            <Text style={styles.feedbackText}>No fue posible cargar tus vehiculos.</Text>
          </View>
        ) : vehicles && vehicles.length > 0 ? (
          <View style={styles.vehicleList}>
            {vehicles.map((car: any, index: number) => (
              <TouchableOpacity
                key={car.id || `vehicle-${index}`}
                style={styles.vehicleCard}
                activeOpacity={0.9}
                onPress={() => openDetails(car)}
              >
                <View style={styles.vehicleImageWrap}>
                  <Image
                    source={car?.car_image ? { uri: car.car_image } : FALLBACK_CAR_IMAGE}
                    style={styles.vehicleImage}
                  />
                  <View style={[styles.statusPill, car?.active ? styles.statusPillActive : styles.statusPillInactive]}>
                    <Text style={[styles.statusPillText, car?.active ? styles.statusPillTextActive : styles.statusPillTextInactive]}>
                      {car?.active ? "Activo" : "Inactivo"}
                    </Text>
                  </View>
                </View>

                <View style={styles.vehicleInfo}>
                  <Text style={styles.vehicleTitle}>{`${car?.vehicleMake || "Vehiculo"} ${car?.vehicleModel || ""}`.trim()}</Text>
                  <Text style={styles.vehicleSubtitle}>{car?.vehicleNumber || "Placa no disponible"}</Text>

                  <View style={styles.vehicleMetaRow}>
                    <View style={styles.vehicleMetaItem}>
                      <Text style={styles.vehicleMetaLabel}>Servicio</Text>
                      <Text style={styles.vehicleMetaValue}>{car?.carType || "No definido"}</Text>
                    </View>
                    <View style={styles.vehicleMetaItem}>
                      <Text style={styles.vehicleMetaLabel}>Color</Text>
                      <Text style={styles.vehicleMetaValue}>{car?.vehicleColor || "No definido"}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.vehicleActions}>
                  <TouchableOpacity style={styles.vehicleActionBtn} onPress={() => openDetails(car)} activeOpacity={0.85}>
                    <Ionicons name="eye-outline" size={18} color="#00E5FF" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.vehicleActionBtnDanger} onPress={() => onDelete(car)} activeOpacity={0.85}>
                    <Ionicons name="trash-outline" size={18} color="#FF6B6B" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="car-sport-outline" size={40} color="#00E5FF" />
            </View>
            <Text style={styles.emptyTitle}>Aun no has creado un vehiculo</Text>
            <Text style={styles.emptyText}>
              Usa la nueva opcion de Añadir Vehiculo para registrar tu carro y dejarlo listo para operar.
            </Text>
            <TouchableOpacity style={styles.emptyButton} onPress={navigateToCreateVehicle} activeOpacity={0.9}>
              <Text style={styles.emptyButtonText}>Crear Vehiculo</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { paddingBottom: modalBottomPadding }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalEyebrow}>Detalles</Text>
                <Text style={styles.modalTitle}>Vehiculo</Text>
              </View>

              <View style={styles.modalHeaderActions}>
                <TouchableOpacity style={styles.modalIconBtnDanger} onPress={() => onDelete(selectedCar)} activeOpacity={0.85}>
                  <Ionicons name="trash-outline" size={18} color="#FF6B6B" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalIconBtn} onPress={() => setModalVisible(false)} activeOpacity={0.85}>
                  <Ionicons name="close" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>

            {selectedCar && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalContent}>
                <Image
                  source={selectedCar?.car_image ? { uri: selectedCar.car_image } : FALLBACK_CAR_IMAGE}
                  style={styles.modalVehicleImage}
                />

                <View style={styles.activeRow}>
                  <View>
                    <Text style={styles.activeLabel}>Activar Vehiculo</Text>
                    <Text style={styles.activeHelp}>Solo un vehiculo puede quedar activo al mismo tiempo.</Text>
                  </View>
                  <Switch
                    trackColor={{ false: "rgba(255,255,255,0.14)", true: "#00E5FF" }}
                    thumbColor={isVehicleActive ? "#051A26" : "#D6E4EA"}
                    ios_backgroundColor="rgba(255,255,255,0.14)"
                    onValueChange={toggleSwitch}
                    value={isVehicleActive}
                  />
                </View>

                <View style={styles.detailList}>
                  {detailRows.map((row) => (
                    <View key={row.label} style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{row.label}</Text>
                      <Text style={styles.detailValue}>{row.value || "No disponible"}</Text>
                    </View>
                  ))}
                </View>

                <Pressable style={styles.closeButton} onPress={() => setModalVisible(false)}>
                  <Text style={styles.closeButtonText}>Cerrar</Text>
                </Pressable>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#051A26",
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.32,
  },
  bgOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5,26,38,0.83)",
  },
  bgGlowTop: {
    position: "absolute",
    top: -70,
    right: -90,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(0,229,255,0.08)",
  },
  bgGlowBottom: {
    position: "absolute",
    bottom: 50,
    left: -110,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(0,188,212,0.06)",
  },
  header: {
    position: "relative",
    zIndex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  headerTitleWrap: {
    flex: 1,
    paddingHorizontal: 12,
  },
  headerEyebrow: {
    fontSize: 11,
    fontWeight: "700",
    color: "#00E5FF",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.4,
  },
  headerCreateBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#00E5FF",
  },
  container: {
    flex: 1,
    position: "relative",
    zIndex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 110,
  },
  heroCard: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.16)",
    backgroundColor: "rgba(10,46,61,0.58)",
    padding: 22,
    marginBottom: 18,
    overflow: "hidden",
  },
  heroTag: {
    alignSelf: "flex-start",
    fontSize: 10,
    fontWeight: "800",
    color: "#051A26",
    backgroundColor: "#00E5FF",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 14,
  },
  heroTitle: {
    fontSize: 26,
    lineHeight: 30,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 10,
    letterSpacing: -0.6,
  },
  heroText: {
    fontSize: 14,
    lineHeight: 22,
    color: "rgba(255,255,255,0.74)",
    marginBottom: 18,
  },
  heroButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 18,
    backgroundColor: "#00E5FF",
    paddingHorizontal: 18,
    paddingVertical: 13,
  },
  heroButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#051A26",
  },
  vehicleLimitBanner: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 14,
    backgroundColor: "rgba(255,167,38,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,167,38,0.38)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 4,
  },
  vehicleLimitBannerText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFA726",
  },
  feedbackCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(10,46,61,0.5)",
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  feedbackText: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 14,
    fontWeight: "600",
  },
  vehicleList: {
    gap: 14,
  },
  vehicleCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.14)",
    backgroundColor: "rgba(10,46,61,0.54)",
    padding: 14,
  },
  vehicleImageWrap: {
    position: "relative",
    marginBottom: 14,
  },
  vehicleImage: {
    width: "100%",
    height: 170,
    borderRadius: 18,
  },
  statusPill: {
    position: "absolute",
    top: 12,
    right: 12,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusPillActive: {
    backgroundColor: "rgba(0,229,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.28)",
  },
  statusPillInactive: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  statusPillTextActive: {
    color: "#00E5FF",
  },
  statusPillTextInactive: {
    color: "#D6E4EA",
  },
  vehicleInfo: {
    marginBottom: 14,
  },
  vehicleTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 4,
    letterSpacing: -0.4,
  },
  vehicleSubtitle: {
    fontSize: 14,
    color: "#00E5FF",
    fontWeight: "700",
    marginBottom: 12,
  },
  vehicleMetaRow: {
    flexDirection: "row",
    gap: 10,
  },
  vehicleMetaItem: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  vehicleMetaLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.52)",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  vehicleMetaValue: {
    fontSize: 13,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  vehicleActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  vehicleActionBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,229,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.16)",
  },
  vehicleActionBtnDanger: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,107,107,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,107,107,0.18)",
  },
  emptyCard: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.14)",
    backgroundColor: "rgba(10,46,61,0.52)",
    alignItems: "center",
    paddingVertical: 36,
    paddingHorizontal: 24,
  },
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,229,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.16)",
    marginBottom: 18,
  },
  emptyTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 22,
    color: "rgba(255,255,255,0.72)",
    textAlign: "center",
    marginBottom: 18,
  },
  emptyButton: {
    borderRadius: 18,
    backgroundColor: "#00E5FF",
    paddingHorizontal: 20,
    paddingVertical: 13,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#051A26",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.42)",
  },
  modalCard: {
    maxHeight: "88%",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: "#082331",
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "rgba(0,229,255,0.12)",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalEyebrow: {
    fontSize: 11,
    fontWeight: "700",
    color: "#00E5FF",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  modalHeaderActions: {
    flexDirection: "row",
    gap: 10,
  },
  modalIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  modalIconBtnDanger: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,107,107,0.08)",
  },
  modalContent: {
    paddingBottom: 24,
  },
  modalVehicleImage: {
    width: "100%",
    height: 210,
    borderRadius: 20,
    marginBottom: 18,
  },
  activeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 14,
    marginBottom: 16,
    gap: 14,
  },
  activeLabel: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  activeHelp: {
    color: "rgba(255,255,255,0.62)",
    fontSize: 12,
    marginTop: 4,
    maxWidth: 220,
  },
  detailList: {
    gap: 10,
  },
  detailRow: {
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.5)",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  closeButton: {
    marginTop: 18,
    borderRadius: 18,
    backgroundColor: "#00E5FF",
    paddingVertical: 14,
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#051A26",
  },
});

export default CarsScreen;