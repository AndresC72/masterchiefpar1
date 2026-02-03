import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
} from "react-native";
import {
  AntDesign,
  MaterialIcons,
  FontAwesome,
} from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/common/store";
import { format, addMonths } from "date-fns";
import {
  fetchWalletHistory,
  selectWalletHistory,
  selectWalletLoading,
} from "@/common/reducers/walletSlice";
import {
  fetchMemberships,
  selectMembershipLoading,
} from "@/common/reducers/membershipSlice";
import { listenToSettingsChanges, selectSettings } from '@/common/reducers/settingsSlice';
import { useColorScheme } from 'react-native';
type Props = NativeStackScreenProps<any>;

const WalletDetails = ({ navigation }: Props) => {
  const user = useSelector((state: RootState) => state.auth.user);
  const walletHistory = useSelector(selectWalletHistory);
  const walletLoading = useSelector(selectWalletLoading);
  const memberships = useSelector(
    (state: RootState) => state.memberships.memberships
  );
  const isLoadingMemberships = useSelector(selectMembershipLoading);
  const dispatch = useDispatch<AppDispatch>();
  const [modalVisible, setModalVisible] = useState(false);
  const [modalPayuVisible, setModalPayuVisible] = useState(false);
  const settings = useSelector(selectSettings);
  const colorScheme = useColorScheme();

  //console.log("Configuraciones:", settings);
  const styles = colorScheme === "dark" ? darkStyles : lightStyles; // Estilos dinámicos

  const [selectedMethod, setSelectedMethod] = useState("");

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    string | null
  >(null);
  const [showAllHistory, setShowAllHistory] = useState(false);
  useEffect(() => {
    // Start listening to settings changes
    dispatch(listenToSettingsChanges());
  }, [dispatch]);
  useEffect(() => {
    if (user?.id) {
      dispatch(fetchWalletHistory(user?.id));
      dispatch(fetchMemberships(user?.id));
    }
  }, [dispatch, user?.id]);

  const handlePress = (method: string) => {
    if (method === "PayU") {
      setModalPayuVisible(true);
    } else {
      setSelectedPaymentMethod(method);
      setModalVisible(true);
    }

    setSelectedMethod(method);
    setModalPayuVisible(true); // Open modal when payment method is selected
  };
  const handleOptionSelect = (amount: string) => {
    if (selectedMethod === "PayU") {
      const reference = generateReference();
      const payData = {
        order_id: `wallet-${user?.id}-${reference}`,
        email: user?.email,
        amount, // Pass the selected amount
        currency: "COP",
      };
      setModalPayuVisible(false); // Close the modal

      setSelectedMethod(""); // Reset method selection
      navigation.navigate("WebViewLayout", { payData }); // Navigate to PayU screen
    } else if (selectedMethod === "Daviplata") {
      setModalPayuVisible(false); // Close the modal
      setSelectedMethod(""); // Reset method selection
      navigation.navigate("DaviplataPayment", { amount }); // Navigate to DaviplataPayment screen
    }
  };

  const generateReference = () => {
    const c = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    return [...Array(4)].map((_) => c[~~(Math.random() * c.length)]).join("");
  };

  const expirationDate = user?.memberTime
    ? new Date(user?.memberTime * 1000)
    : new Date();
  const nextMonthExpiration = addMonths(expirationDate, 1);
  const formattedDate = format(nextMonthExpiration, "dd/MM/yyyy");

  const calculateDaysRemaining = (endDate: Date | undefined) => {
    if (!endDate) return 0; // Return 0 if endDate is undefined
    const today = new Date();
    const timeDiff = endDate.getTime() - today.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  };

  const activeMembership = memberships.find(
    (membership) => membership.status === "ACTIVA"
  );
  const daysRemaining = activeMembership
    ? calculateDaysRemaining(new Date(activeMembership?.fecha_terminada))
    : 0;

  const renderHistoryItem = ({ item }) => (
    <View style={styles.historyItem}>
      <Text style={styles.infoLabel}>
        <Text style={styles.labelBold}>Fecha:</Text>{" "}
        {format(new Date(item.date), "dd/MM/yyyy HH:mm")}
      </Text>
      {user?.cartype === "TREAS-X" ? (
        <Text style={styles.infoLabel}>
          <Text style={styles.labelBold}>Kilometros descontados:</Text>{" "}
          {item.kilometros ?? 0} KM
        </Text>
      ) : (
        <Text style={styles.infoLabel}>
          <Text style={styles.labelBold}>Valor del servicio:</Text> ${" "}
          {item.amount}
        </Text>
      )}
      {user?.cartype === "TREAS-X" ? (
        <Text style={styles.infoLabel}>
          <Text style={styles.labelBold}>Referencia:</Text> {item.txRef}
        </Text>
      ) : (
        <Text style={styles.infoLabel}>
          <Text style={styles.labelBold}>Referencia:</Text> {item.txRef}
        </Text>
      )}
    </View>
  );
  if (walletLoading || isLoadingMemberships) return <Text>Loading...</Text>;

  // Si no hay historial o el saldo es 0 o undefined, muestra los valores en 0 y el mensaje de no historial
  const walletBalance = user?.walletBalance || 0;
  const hasHistory = walletHistory?.length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <AntDesign name="arrowleft" size={24} color={colorScheme === "dark" ? "#FFF" : "#000"} />
        </TouchableOpacity>
        <Text style={styles.headerText}>{"Mi Billetera"} </Text>

        <TouchableOpacity onPress={() => navigation.navigate("Memberships")}>
         
        </TouchableOpacity>
      </View>
      <View style={styles.cardContainer}>
        <View style={styles.card}>
          <Text style={styles.cardStatus}>Active</Text>
          <Text style={styles.cardType}> $ {walletBalance}</Text>

          <>
            {user?.usertype === "driver" && user?.cartype === "TREAS-X" && (
              <View style={styles.row}>
                <Text style={styles.cardDetail}>KM disponibles: </Text>

                <Text style={styles.cardIcon}>{user?.kilometers}</Text>
              </View>
            )}
            <View style={styles.row}>
              <Text style={styles.cardDetail}>Membresía caduca en: </Text>

              <Text style={styles.cardIcon}>
                {" "}
                {activeMembership?.fecha_terminada}
              </Text>

            </View>
            <View style={styles.row}>
              <Text style={styles.cardDetail}>Días restantes: </Text>
              {daysRemaining < 4 ? (
                <Text style={[styles.cardIcon, { color: "red" }]}>
                  Necesita renovar su suscripción
                </Text>
              ) : (
                <Text style={styles.cardIcon}> {daysRemaining}</Text>
              )}
            </View>
            {activeMembership && (
              <View style={styles.row}>
                <Text style={styles.cardDetail}>Membresía activa: </Text>
                <Text style={styles.cardIcon}>${activeMembership.costo}</Text>
              </View>
            )}
          </>

          {/*
<View style={styles.row}>
  <Text style={styles.cardDetail}>Número de recargas realizadas:</Text>
  <Text style={styles.cardIcon}>4</Text>
</View>
*/}
        </View>
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.infoHeader}>
          <Text style={styles.infoText}>Historial de tu último servicio</Text>
          {showAllHistory && (
            <TouchableOpacity onPress={() => setShowAllHistory(false)}>
              <Text style={styles.closeText}>Cerrar</Text>
            </TouchableOpacity>
          )}
        </View>

        {hasHistory ? (
          <FlatList
            data={showAllHistory ? walletHistory.slice().reverse() : [walletHistory[0]]}
            renderItem={renderHistoryItem}
            keyExtractor={(item, index) => index.toString()}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        ) : (
          <Text>No tienes historial</Text>
        )}

        {!showAllHistory && walletHistory.length > 1 && (
          <TouchableOpacity onPress={() => setShowAllHistory(true)}>
            <Text style={styles.showMoreText}>Ver más</Text>
          </TouchableOpacity>
        )}
      </View>

      {/*
       *   <Text style={styles.infoText}>Recarga con</Text>
     *   <TouchableOpacity
        style={styles.button}
        onPress={() => handlePress("Daviplata")}
      >
        <Image
          source={require("@/assets/payment-icons/daviplata-logo.png")}
          style={{ width: 70, height: 40 }}
        />
        <Text style={styles.buttonText}>Daviplata</Text>
      </TouchableOpacity>

      
         <Text style={styles.infoText}>Recarga con</Text>
        <TouchableOpacity
        style={styles.button}
        onPress={() => handlePress("PayU")}
      >
        <Image
          source={require("@/assets/payment-icons/payulatam-logo.png")}
          style={{ width: 80, height: 40 }}
        />
        <Text style={styles.buttonText}>PayU</Text>
      </TouchableOpacity> 
     */}

      <View style={{ width: "100%", top: 30 }}>
        {[
          // Solo se añade el botón de "Membresía" si settings.Membership es true
          ...(settings.Membership
            ? [{ icon: "local-offer", text: "Membresía", mode: "membership" }]
            : []),
          // Solo se añade el botón de "Kilómetros" si user?.cartype es 'TREAS-X' y settings.KilimetrsWallet es true
          ...(user && user?.cartype === "TREAS-X" && settings.KilimetrsWallet
            ? [{ icon: "road", text: "Kilómetros", mode: "kms" }]
            : []),
        ].map(({ icon, text, mode }, idx) => (
          <TouchableOpacity
            key={mode}
            style={[
              styles.button,
              styles.membershipButton,
              idx === 1 && { marginHorizontal: 1 },
            ]}
            onPress={() => navigation.navigate("ChosePlan", { mode })}
          >
            {icon === "local-offer" ? (
              <MaterialIcons name={icon} size={24} color="white" />
            ) : (
              <FontAwesome name={icon} size={24} color="white" />
            )}
            <Text style={[styles.buttonText, { color: "white" }]}>
              Paquete {text}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>Seleccione el tipo de recarga</Text>
            {user?.cartype === "TREAS-X" && (
              <>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: "#4f0000" }]}
                  onPress={() => handleOptionSelect("Seguro")}
                >
                  <Text style={styles.textStyle}>Seguro</Text>
                </TouchableOpacity>
              </>
            )}
            {user?.cartype !== "TREAS-X" && (
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "#ae0606" }]}
                onPress={() => handleOptionSelect("Membresía")}
              >
                <Text style={styles.textStyle}>Membresía</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: "#ae0606" }]}
              onPress={() => handleOptionSelect("Wallet")}
            >
              <Text style={styles.textStyle}>Billetera</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: "#f44336" }]}
              onPress={() => setModalVisible(!modalVisible)}
            >
              <Text style={styles.textStyle}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalPayuVisible}
        onRequestClose={() => setModalPayuVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Elige el monto de tu recarga</Text>

            <View style={styles.amountOptionsContainer}>
              {user?.cartype === "TREAS-X" && (
                <TouchableOpacity
                  style={[styles.amountOption, styles.amountOptionFirst]}
                  onPress={() => handleOptionSelect("15000")}
                >
                  <Text style={styles.amountText}>$15,000</Text>
                </TouchableOpacity>
              )}
              {user?.cartype === "TREAS-Van" && (
                <TouchableOpacity
                  style={styles.amountOption}
                  onPress={() => handleOptionSelect("96000")}
                >
                  <Text style={styles.amountText}>$96,000</Text>
                </TouchableOpacity>
              )}
              {user?.cartype === "TREAS-X" && (
                <TouchableOpacity
                  style={styles.amountOption}
                  onPress={() => handleOptionSelect("48000")}
                >
                  <Text style={styles.amountText}>$48,000</Text>
                </TouchableOpacity>
              )}
              {user?.cartype !== "TREAS-T" && (
                <TouchableOpacity
                  style={styles.amountOption}
                  onPress={() => handleOptionSelect("36000")}
                >
                  <Text style={styles.amountText}>$36,000</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setModalPayuVisible(false)}
            >
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const lightStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
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
  },
  headerIcon: {
    backgroundColor: "#E0E0E0",
    borderRadius: 12,
    padding: 4,
  },
  cardContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#000",
    borderRadius: 12,
    padding: 20,
    width: "100%",
  },
  cardStatus: {
    color: "#F20505",
    fontWeight: "bold",
    marginBottom: 10,
    left: 140,
  },
  cardType: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    left: 130,
  },
  cardDetail: {
    color: "#FFF",
    marginBottom: 5,
  },
  cardIcon: {
    position: "absolute",
    right: 20,
    bottom: 5,
    color: "#FFF",
    alignItems: "center",
  },
  cardBoton: {
    position: "absolute",
    right: 20,
    bottom: 5,
    color: "#F20505",
    alignItems: "center",
  },
  infoContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  infoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  infoLabel: {
    color: "#888",
    marginBottom: 5,
  },
  labelBold: {
    fontWeight: "bold",
  },
  infoText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  closeText: {
    color: "#F20505",
    fontWeight: "bold",
  },
  showMoreText: {
    color: "#f20505",
    textAlign: "center",
    marginTop: 10,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  buttonText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: "bold",
    color: "#888",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalText: {
    marginBottom: 15,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
  },
  modalButton: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    marginVertical: 5,
    width: 200,
    alignItems: "center",
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  historyItem: {
    backgroundColor: "#FFF",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  separator: {
    height: 1,
    backgroundColor: "#f20505",
    marginVertical: 10,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)", // Fondo más suave para mejor enfoque
  },
  modalView: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 30,
    width: "90%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  amountOptionsContainer: {
    width: "100%",
    marginBottom: 20,
  },
  amountOption: {
    backgroundColor: "#F44336",
    borderRadius: 10,
    paddingVertical: 15,
    marginVertical: 10,
    alignItems: "center",
    width: "100%",
    elevation: 3,
  },
  amountOptionFirst: {
    backgroundColor: "#FF5252", // Color más claro para resaltar la primera opción
  },
  amountText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  cancelButton: {
    backgroundColor: "#B71C1C",
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 40,
    width: "100%",
    alignItems: "center",
  },
  cancelText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },

  membershipButton: {
    backgroundColor: "#F20505",
    alignItems: "center",
    justifyContent: "center",
    elevation: 5, // Elevación para Android
    shadowColor: "#000", // Color de la sombra
    shadowOffset: {
        width: 0,
        height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84, // Radio de la sombra
  },
});
const darkStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#474747",
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
    color: "#FFF",
  },
  headerIcon: {
    backgroundColor: "#E0E0E0",
    borderRadius: 12,
    padding: 4,
  },
  cardContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#000",
    borderRadius: 12,
    padding: 20,
    width: "100%",
  },
  cardStatus: {
    color: "#F20505",
    fontWeight: "bold",
    marginBottom: 10,
    left: 140,
  },
  cardType: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    left: 130,
  },
  cardDetail: {
    color: "#FFF",
    marginBottom: 5,
  },
  cardIcon: {
    position: "absolute",
    right: 20,
    bottom: 5,
    color: "#FFF",
    alignItems: "center",
  },
  cardBoton: {
    position: "absolute",
    right: 20,
    bottom: 5,
    color: "#F20505",
    alignItems: "center",
  },
  infoContainer: {
    backgroundColor: "#333333",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  infoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  infoLabel: {
    color: "#CACACA",
    marginBottom: 5,
  },
  labelBold: {
    fontWeight: "bold",
    color: "#FFF",
  },
  infoText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFF",    
  },
  closeText: {
    color: "#F20505",
    fontWeight: "bold",
  },
  showMoreText: {
    color: "#f20505",
    textAlign: "center",
    marginTop: 10,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  buttonText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: "bold",
    color: "#888",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalText: {
    marginBottom: 15,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
  },
  modalButton: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    marginVertical: 5,
    width: 200,
    alignItems: "center",
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  historyItem: {
    backgroundColor: "#333333",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  separator: {
    height: 1,
    backgroundColor: "#f20505",
    marginVertical: 10,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)", // Fondo más suave para mejor enfoque
  },
  modalView: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 30,
    width: "90%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  amountOptionsContainer: {
    width: "100%",
    marginBottom: 20,
  },
  amountOption: {
    backgroundColor: "#F44336",
    borderRadius: 10,
    paddingVertical: 15,
    marginVertical: 10,
    alignItems: "center",
    width: "100%",
    elevation: 3,
  },
  amountOptionFirst: {
    backgroundColor: "#FF5252", // Color más claro para resaltar la primera opción
  },
  amountText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  cancelButton: {
    backgroundColor: "#B71C1C",
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 40,
    width: "100%",
    alignItems: "center",
  },
  cancelText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },

  membershipButton: {
    backgroundColor: "#F20505",
    alignItems: "center",
    justifyContent: "center",
    elevation: 5, // Elevación para Android
    shadowColor: "#000", // Color de la sombra
    shadowOffset: {
        width: 0,
        height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84, // Radio de la sombra
  },
});

export default WalletDetails;