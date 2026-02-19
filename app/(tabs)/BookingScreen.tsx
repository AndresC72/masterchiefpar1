import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  Alert,
  Modal,
  FlatList,
  TextInput,
  Animated,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import { useRoute, useNavigation } from "@react-navigation/native";
import markeIcon from "@/assets/images/rsz_2red_pin.png";
import markeIconO from "@/assets/images/green_pin.png";
import { AntDesign, } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/common/store";
import {
  BottomSheetModal,
  BottomSheetModalProvider,
} from "@gorhom/bottom-sheet";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { saveBooking } from "@/common/actions/saveBooking";
import { FareCalculator } from "@/common/actions/FareCalculator";
import { fetchPromos } from "@/common/actions/promoactions";
import PromoComp from "@/components/PromoComp"; // Asegúrate de importar el componente de promoción
import { Avatar } from "react-native-elements";

import { Ionicons, } from "@expo/vector-icons";
import { database } from "@/config/SupabaseConfig";
import { ref, get } from "firebase/database"; 
import {
  fetchRecentDrivers,
} from "@/common/store/bookingsSlice"; // Asegúrate de que esta acción esté importada
import { API_KEY } from '@/config/AppConfig'; // Asegúrate de importar la clave API
import { useColorScheme } from "react-native"; 
const { width, height } = Dimensions.get("window");

const GOOGLE_MAPS_APIKEY_PROD = API_KEY; // Asignar la clave API

const BookingScreen = () => {
  const route = useRoute();
  const { origin, destination, type } = route.params;
  const mapRef = useRef<MapView | null>(null);
  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [fareDetails, setFareDetails] = useState(null);
  const [passedTolls, setPassedTolls] = useState([]);
  const [immediatePickup, setImmediatePickup] = useState(true);
  const [soloIda, setSoloIda] = useState(false);
  const [scheduleRide, setScheduleRide] = useState(false);
  const [date, setDate] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentType, setSelectedPaymentType] = useState("cash");
  const user = useSelector((state: RootState) => state.auth.user);
  const navigation = useNavigation();
  const [isPromoModalVisible, setIsPromoModalVisible] = useState(false); // Estado para el modal de promo
  const [promotions, setPromotions] = useState([]); // Lista de promociones
  const [promoDiscount, setPromoDiscount] = useState(0); // Estado para el descuento de la promoción
  const [isScheduled, setIsScheduled] = useState(false);
  const [tripType, setTripType] = useState("Solo Ida"); // Estado para el tipo de viaje
  const [observations, setObservations] = useState("");
  const dispatch = useDispatch();
  const [selectedPromo, setSelectedPromo] = useState(null); // Estado para la promo seleccionada
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0)); // Animación de fade
  const [errorMessage, setErrorMessage] = useState("");

  const [taxiOptions, setTaxiOptions] = useState([]);
  const [isVehicleModalVisible, setIsVehicleModalVisible] = useState(false);

  const drivers = useSelector((state) => state.bookings.recentDrivers);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [isDriverModalVisible, setIsDriverModalVisible] = useState(false); // Estado para el modal de conductores
  const [isSoloIdaActive, setIsSoloIdaActive] = useState(true); // Cambiado a true para que esté activo por defecto
  const [isIdaYVueltaActive, setIsIdaYVueltaActive] = useState(false); // Asegúrate de que "Ida y Vuelta" esté desactivado por defecto
  //console.log(date)
 // console.log(distance,"DISTANCIAAAA")
const colorScheme = useColorScheme();
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
//console.log(type,"type")
  useEffect(() => {
    dispatch(fetchPromos());
    dispatch(fetchRecentDrivers());
  }, [dispatch]);
  const styles = colorScheme === "dark" ? darkStyles : lightStyles; // Estilos dinámicos

  const handleSelectDriver = (driver) => {
    setSelectedDriver(driver);
   // console.log("Conductor seleccionado:", driver); // Guardar en log
    setIsDriverModalVisible(false); // Cerrar el modal
  };
  useEffect(() => {
    if (distance && duration) {
      fetchTaxiOptionsFromFirebase();
    }
  }, [distance, duration]);
  
  const renderDriverList = () => {
    // Crear un conjunto para rastrear los nombres de los conductores únicos
    const uniqueDrivers = new Set();
    const filteredDrivers = drivers.filter((driver) => {
      if (!uniqueDrivers.has(driver.driver_name)) {
        uniqueDrivers.add(driver.driver_name);
        return true; // Mantener este conductor
      }
      return false; // Filtrar este conductor
    });

    return filteredDrivers.map((driver, index) => (
      <TouchableOpacity
        key={index}
        style={styles.driverItem}
        onPress={() => handleSelectDriver(driver)}
      >
        <Text style={styles.driverName}>{driver.driver_name}</Text>
      </TouchableOpacity>
    ));
  };

  const fetchTaxiOptionsFromFirebase = async () => {
    try {
      const cartypesRef = ref(database, "cartypes");
      const snapshot = await get(cartypesRef);

      if (snapshot.exists()) {
        const data = snapshot.val();
        const options = await Promise.all(Object.keys(data).map(async (key) => {
          const vehicle = {
            value: key,
            name: data[key].name,
            capacity: data[key].typeService,
            service: data[key].extra_info,
            carImage: data[key].image || "",
            base_fare: data[key].base_fare || 0,
            rate_per_unit_distance: data[key].rate_per_unit_distance || 0,
            rate_per_hour: data[key].rate_per_hour || 0,
            min_fare: data[key].min_fare || 0,
            convenience_fees: data[key].convenience_fees || 0,
            convenience_fee_type: data[key].convenience_fee_type || "flat",
          };
          const rateDetails = {
            rate_per_unit_distance: vehicle.rate_per_unit_distance,
            rate_per_hour: vehicle.rate_per_hour,
            base_fare: vehicle.base_fare,
            min_fare: vehicle.min_fare,
            convenienceFee: vehicle.convenience_fees,
            convenience_fee_type: vehicle.convenience_fee_type,
          };
       // console.log(duration,"distanciaaaa")
          let fareDetails;
          try {
            const response = await fetch('https://us-central1-treasupdate.cloudfunctions.net/calculatePrice2', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                bookingData: {
                  roundedDistance: parseFloat(distance),
                  durationMinutes: parseFloat(duration),
                  carType: rateDetails,
                },
                tolls: [],
                isScheduled,
                settings: {
                  decimal: 2,
                  distanceIntermunicipal: 50,
                },
                addressOrigin: "Origen",
                addressDestination: "Destino",
                selectedPaymentMethod: selectedPaymentType,
                selectedUser: null,
                authState: null,
                filteredUsers: [],
              }),
            });
            fareDetails = await response.json();
            //console.log(parseFloat(distance),"-----distance----")
            const distancia = parseFloat(duration)
           // console.log(distancia,"Duration")
          } catch (error) {
            console.error("Error al calcular el precio:", error);
            fareDetails = null;
          }
        
          return {
            ...vehicle,
            estimatedPrice: fareDetails ? fareDetails.estimateFare : 0,
          };
        }));
        

        setTaxiOptions(options);
        if (options.length > 0) {
          const selectedIndex = type ? Math.max(0, type - 1) : 0;
          setSelectedVehicle(options[selectedIndex]);
          const rateDetails = {
            rate_per_unit_distance: options[selectedIndex].rate_per_unit_distance,
            rate_per_hour: options[selectedIndex].rate_per_hour,
            base_fare: options[selectedIndex].base_fare,
            min_fare: options[selectedIndex].min_fare,
            convenienceFee: options[selectedIndex].convenience_fees,
            convenience_fee_type: options[selectedIndex].convenience_fee_type,
          };
       let fareDetails
          try {
            const response = await fetch('https://us-central1-treasupdate.cloudfunctions.net/calculatePrice2', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                bookingData: {
                  roundedDistance: parseFloat(distance),
                  durationMinutes: parseFloat(duration),
                  carType: rateDetails,
                },
                tolls: [],
                isScheduled,
                settings: {
                  decimal: 2,
                  distanceIntermunicipal: 50,
                },
                addressOrigin: "Origen",
                addressDestination: "Destino",
                selectedPaymentMethod: selectedPaymentType,
                selectedUser: null,
                authState: null,
                filteredUsers: [],
              }),
            });
            fareDetails = await response.json();
           // console.log(parseFloat(distance),"-----distance2----")
            const distancia = parseFloat(duration)
           // console.log(distancia,"Duration2")
           // console.log(fareDetails,"fareee")
            setFareDetails(fareDetails)
          } catch (error) {
            console.error("Error al calcular el precio:", error);
            fareDetails = null;
          }
        }
      }
    } catch (error) {
      console.error("Error obteniendo datos:", error);
    }
  };
  const handleSelectVehicle = async (vehicle) => {
    setSelectedVehicle(vehicle);
    const rateDetails = {
      rate_per_unit_distance: vehicle.rate_per_unit_distance,
      rate_per_hour: vehicle.rate_per_hour,
      base_fare: vehicle.base_fare,
      min_fare: vehicle.min_fare,
      convenienceFee: vehicle.convenience_fees,
      convenience_fee_type: vehicle.convenience_fee_type,
    };
  
    let calculatedFareDetails;
    try {
      const response = await fetch('https://us-central1-treasupdate.cloudfunctions.net/calculatePrice2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingData: {
            roundedDistance: parseFloat(distance),
            durationMinutes: parseFloat(duration),
            carType: rateDetails,
          },
          tolls: [],
          isScheduled,
          settings: {
            decimal: 2,
            distanceIntermunicipal: 50,
          },
          addressOrigin: "Origen",
          addressDestination: "Destino",
          selectedPaymentMethod: selectedPaymentType,
          selectedUser: null,
          authState: null,
          filteredUsers: [],
        }),
      });
      calculatedFareDetails = await response.json();
      //console.log(parseFloat(distance), "-----distance2----");
      const distancia = parseFloat(duration);
      //console.log(distancia, "Duration2");
      //console.log(fareDetails, "fareee");
      setFareDetails(calculatedFareDetails);
    } catch (error) {
      console.error("Error al calcular el precio:", error);
      calculatedFareDetails = null;
    }
  
    setIsVehicleModalVisible(false);
  };
  

  const renderTaxiOptions = () => {
    return taxiOptions.map((option) => (
      <TouchableOpacity
        key={option.value}
        style={[
          styles.taxiOption,
          selectedVehicle?.value === option.value && styles.selectedTaxiOption,
        ]}
        onPress={() => handleSelectVehicle(option)}
      >
        <Image
          source={
            option.carImage
              ? { uri: option.carImage }
              : require("./../../assets/images/microBlackCar.png")
          }
          style={styles.taxiIcon}
        />
        <View style={styles.optionDetails}>
          <Text style={styles.taxiType}>{option.name}</Text>
          <Text style={styles.taxiInfo}>Servicio {option.capacity}</Text>
          <Text style={styles.taxiPrice}>
            Valor estimado: ${" "}
            {roundPrice(
              option.estimatedPrice +
                (isScheduled ? 7000 : 0) +
                (origin.title.includes("Aero") ||
                destination.title.includes("Aero")
                  ? 7000
                  : 0)
            )}{" "}
            - $
            {roundPrice(
              option.estimatedPrice +
                7000 +
                (isScheduled ? 7000 : 0) +
                (origin.title.includes("Aero") ||
                destination.title.includes("Aero")
                  ? 7000
                  : 0)
            )}
          </Text>
        </View>
      </TouchableOpacity>
    ));
  };

  const handleShowPromoModal = async (promos) => {
    try {
      setPromotions(promos); // Guarda las promociones en el estado
      setIsPromoModalVisible(true); // Muestra el modal
    } catch (error) {
      console.error("Error fetching promotions: ", error);
    }
  };

  const handleClosePromoModal = () => {
    setIsPromoModalVisible(false); // Cierra el modal
  };

  const showDatePicker = () => {
    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  const handleConfirm = (selectedDate) => {
    const timestamp = new Date(selectedDate).getTime(); // Convertir la fecha seleccionada a un timestamp
    setDate(timestamp); // Guardamos el timestamp en el estado
    setIsScheduled(true); // Indicamos que el viaje es programado
    //console.log("Fecha y hora seleccionadas (timestamp):", timestamp); // Log del timestamp

    // Mostrar alerta con la fecha seleccionada
    Alert.alert(
      "Fecha y Hora Seleccionadas",
      `Has seleccionado: ${new Date(selectedDate).toLocaleString()}`,
      [{ text: "OK", onPress: () => console.log("OK Pressed") }]
    );

    hideDatePicker();
  };

  const paymentTypes = [
    { label: "Efectivo", value: "cash" },
    { label: "Daviplata", value: "daviplata" },
    { label: "Billetera", value: "wallet" },
  ];

  const handleSelectPaymentType = (value) => {
    setSelectedPaymentType(value);
    setShowPaymentModal(false);
  };

  const renderPaymentOption = ({ item }) => (
    <TouchableOpacity
      style={styles.paymentOption}
      onPress={() => handleSelectPaymentType(item.value)}
    >
      <Text style={styles.paymentOptionText}>{item.label}</Text>
    </TouchableOpacity>
  );

  const getPrice = (bookingData, tolls, isScheduled) => {
    const { roundedDistance, durationMinutes, carType } = bookingData;

    if (!carType) {
      console.error("carType is undefined");
      return null;
    }

    let { totalCost, grandTotal, convenience_fees } = FareCalculator(
      roundedDistance,
      durationMinutes * 60,
      carType,
      {},
      2
    );

    if (isNaN(totalCost) || isNaN(grandTotal) || isNaN(convenience_fees)) {
      console.error("Calculation resulted in NaN values:", {
        totalCost,
        grandTotal,
        convenience_fees,
      });
      return null;
    }

    const tollsCost = tolls.reduce((acc, toll) => acc + toll.PriceToll, 0);
    grandTotal += tollsCost * 2;

    if (isScheduled) {
      grandTotal += 4000;
    }

    return {
      totalCost: totalCost,
      estimateFare: grandTotal,
      estimateTime: durationMinutes,
      convenienceFees: convenience_fees,
      driverShare: grandTotal - convenience_fees,
      tollsCost: tollsCost,
    };
  };

  useEffect(() => {
    const fetchDirections = async () => {
      if (origin && destination) {
        const directionsService = new google.maps.DirectionsService();
        const result = await directionsService.route({
          origin: origin,
          destination: destination,
          travelMode: google.maps.TravelMode.DRIVING,
        });
        setDirections(result);
        if (result.routes.length > 0) {
          const route = result.routes[0];
          const leg = route.legs[0];
          setDistance(leg.distance.text);
          setDuration(leg.duration.text);

          const passedTolls = tolls.filter((toll) => {
            if (!toll.CoordToll) return false;
            const [lat, lng] = toll.CoordToll.split(",").map(Number);
            if (isNaN(lat) || isNaN(lng)) return false;
            return route.overview_path.some(
              (point) =>
                google.maps.geometry.spherical.computeDistanceBetween(
                  point,
                  new google.maps.LatLng(lat, lng)
                ) < 1000
            );
          });
          setPassedTolls(passedTolls);
        }
      }
    };

    fetchDirections();
  }, [origin, destination]);

// ... código existente ...

const snapPoints = useMemo(() => ["3%", "50%", "90%"], []); // Ajusta los puntos de anclaje

// ... código existente ...
  useEffect(() => {
    handlePayment();
    if (mapRef.current && origin && destination) {
      mapRef.current.fitToCoordinates([origin, destination], {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  }, [origin, destination, snapPoints]); // Añadido snapPoints para que se ajuste al abrir el BottomSheet

  const handleMissingFields = () => {
    let missingFields = [];

    if (!selectedVehicle) missingFields.push("el vehículo");
    if (!origin) missingFields.push("el origen");
    if (!destination) missingFields.push("el destino");
    if (!selectedPaymentType) missingFields.push("el tipo de pago");

    // Generar el mensaje de error dinámicamente
    if (missingFields.length > 0) {
      const message = `Error al crear la Reserva. Por favor selecciona ${missingFields.join(
        ", "
      )}.`;
      setErrorMessage(message);
      setSuccessModalVisible(true);

      // Animación de entrada
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start();

      // Cerrar el modal después de 2 segundos
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }).start(() => setSuccessModalVisible(false));
      }, 3000);
    }
  };
  const handleBookNowPress = async () => {
   // e.preventDefault();

    if (isButtonDisabled) return; // Si el botón está deshabilitado, no hacer nada

    setIsButtonDisabled(true); // Deshabilitar el botón

    if (!user) {
      console.error("User data is missing or invalid:", user);
      Alert.alert("Error", "Faltan datos del usuario para crear la reserva.");
      return;
    }

    if (!selectedVehicle || !origin || !destination || !selectedPaymentType) {
      handleMissingFields(); // Llama a la función para manejar los campos faltantes
      return;
    }

    // Calculate the estimated fare and discount if applicable
    const estimatedFare = fareDetails ? fareDetails.estimateFare : 0;
    let estimate;

    // Modificar el cálculo del estimate según el tipo de viaje
    if (tripType === "Ida y Vuelta") {
      estimate = estimatedFare * 2; // Duplicar el costo para ida y vuelta
    } else {
      estimate = estimatedFare; // Usar el costo normal para solo ida
    }

    // Sumar 7000 si el viaje es programado
    if (isScheduled) {
      estimate += 7000; // Incrementar el costo si es un viaje programado
    }

    // Redondear el estimate
    estimate = roundPrice(estimate); // Redondear el estimate

    if (selectedPromo && selectedPromo.max_promo_discount_value) {
      // Calculate the discount with the promo
      const promoCash = parseFloat(selectedPromo.max_promo_discount_value);
      const estimatedDiscount = Math.max(estimate - promoCash, 0); // Ensure the discount doesn't make the fare negative
      estimate = estimatedDiscount;
    }

    // Prepare the booking object
    const bookingObject = {
      bookLater: isScheduled, // Cambiar a true si el viaje es programado
      bookingDate: new Date().getTime(),
      carImage: selectedVehicle?.carImage || "TREAS-X",
      carType: selectedVehicle?.name || "TREAS-X",
      commission_rate: selectedVehicle?.convenience_fees || "0",
      convenience_fees: selectedVehicle?.convenience_fees || "0",
      tollsCost: "No contiene",
      drop: {
        lat: destination.latitude,
        lng: destination.longitude,
        add: destination.title || "Dirección no disponible",
      },
      pickup: {
        lat: origin.latitude,
        lng: origin.longitude,
        add: origin.title || "Dirección no disponible",
      },
      pickupAddress: origin.title || "Dirección no disponible",
      dropAddress: destination.title || "Dirección no disponible",
      customer: user.uid || user.id || "",
      customer_contact: user.mobile || "",
      customer_email: user.email || "",
      customer_image: user.profile_image || "",
      customer_name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
      customer_token: user.pushToken || "",
      customer_status: `${user.id || ""}_NEW`,
      customer_city: user.city,
      distance: distance || 0,
      estimate: estimate, // Save either the discounted or full fare
      estimateDistance: distance || 0,
      estimateTime: duration || 0,
      otp: Math.floor(Math.random() * 90000) + 10000,
      payment_mode: selectedPaymentType || "cash",
      driver_share: "Calculated Driver Share",
      reference: [...Array(6)]
        .map(() => "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)])
        .join(""),
      driverEstimates: {},
      status: "NEW",
      tripType: tripType, // Asignar el tipo de viaje
      tripUrban: "Urbano",
      trip_cost: estimate, // También almacenar el costo del viaje
      tripdate: isScheduled ? date : new Date().getTime(), // Asignar el timestamp obtenido o la fecha actual
      cost_corp: 0,
      company: "",
      observations: "",
      requestedDrivers: selectedDriver ? { [selectedDriver.driver]: true } : {}, // Dejar vacío si no se seleccionó ningún conductor
    };

     console.log("bookingObject:", bookingObject);
    try {
      // Assuming the function saveBooking exists and processes the booking
      const result = await saveBooking(bookingObject);

      if (result.success) {
        const bookingWithUid = {
          ...bookingObject,
          id: result.uid, // Asigna el UID al objeto booking
        };

        navigation.navigate("Booking", { booking: bookingWithUid });
      } else {
        Alert.alert(
          "Error",
          "No se pudo crear la reserva. Inténtalo de nuevo."
        );
      }
    } catch (error) {
      console.error("Error saving booking:", error);
      Alert.alert("Error", "Ocurrió un error al guardar la reserva.");
    }

    // Rehabilitar el botón después de 20 segundos
    setTimeout(() => {
      setIsButtonDisabled(false);
    }, 20000);
  };

  const handleCarDetails = () => {
    setIsVehicleModalVisible(true);
  };

  const handlePayment = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);

  const handleSheetChanges = useCallback((index) => {
    if (index === -1) {
      bottomSheetModalRef.current?.dismiss(); // Cierra el BottomSheet cuando se baja
    }
  }, []);
  const openBottomSheet = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);
  useEffect(() => {
    openBottomSheet(); // Asegúrate de que esta función se llame al montar el componente
  }, []);
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  useEffect(() => {
    handlePayment();
  }, []);

  const applyPromo = (promo) => {
    // Aquí aplicamos el descuento de la promoción
    const discount = promo.discount; // Asumimos que el objeto promo tiene un campo `discount`
    setPromoDiscount(discount);
    setSelectedPromo(promo); // Guarda la promoción seleccionada
  };

  const roundPrice = (price) => {
    const remainder = price % 100;
    if (remainder > 0 && remainder <= 49) {
      return price - remainder + 50;
    } else if (remainder >= 50) {
      return price - remainder + 100;
    }
    return price;
  };

  const darkMapStyle = [
    {
      elementType: "geometry",
      stylers: [
        {
          color: "#212121",
        },
      ],
    },
    {
      elementType: "labels.icon",
      stylers: [
        {
          visibility: "off",
        },
      ],
    },
    {
      elementType: "labels.text.fill",
      stylers: [
        {
          color: "#757575",
        },
      ],
    },
    {
      elementType: "labels.text.stroke",
      stylers: [
        {
          color: "#212121",
        },
      ],
    },
    {
      featureType: "administrative",
      elementType: "geometry",
      stylers: [
        {
          color: "#757575",
        },
      ],
    },
    {
      featureType: "administrative.country",
      elementType: "labels.text.fill",
      stylers: [
        {
          color: "#9e9e9e",
        },
      ],
    },
    {
      featureType: "administrative.land_parcel",
      stylers: [
        {
          visibility: "off",
        },
      ],
    },
    {
      featureType: "administrative.locality",
      elementType: "labels.text.fill",
      stylers: [
        {
          color: "#bdbdbd",
        },
      ],
    },
    {
      featureType: "poi",
      elementType: "labels.text.fill",
      stylers: [
        {
          color: "#757575",
        },
      ],
    },
    {
      featureType: "poi.park",
      elementType: "geometry",
      stylers: [
        {
          color: "#181818",
        },
      ],
    },
    {
      featureType: "poi.park",
      elementType: "labels.text.fill",
      stylers: [
        {
          color: "#616161",
        },
      ],
    },
    {
      featureType: "poi.park",
      elementType: "labels.text.stroke",
      stylers: [
        {
          color: "#1b1b1b",
        },
      ],
    },
    {
      featureType: "road",
      elementType: "geometry.fill",
      stylers: [
        {
          color: "#2c2c2c",
        },
      ],
    },
    {
      featureType: "road",
      elementType: "labels.text.fill",
      stylers: [
        {
          color: "#8a8a8a",
        },
      ],
    },
    {
      featureType: "road.arterial",
      elementType: "geometry",
      stylers: [
        {
          color: "#373737",
        },
      ],
    },
    {
      featureType: "road.highway",
      elementType: "geometry",
      stylers: [
        {
          color: "#3c3c3c",
        },
      ],
    },
    {
      featureType: "road.highway.controlled_access",
      elementType: "geometry",
      stylers: [
        {
          color: "#4e4e4e",
        },
      ],
    },
    {
      featureType: "road.local",
      elementType: "labels.text.fill",
      stylers: [
        {
          color: "#616161",
        },
      ],
    },
    {
      featureType: "transit",
      elementType: "labels.text.fill",
      stylers: [
        {
          color: "#757575",
        },
      ],
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [
        {
          color: "#000000",
        },
      ],
    },
    {
      featureType: "water",
      elementType: "labels.text.fill",
      stylers: [
        {
          color: "#3d3d3d",
        },
      ],
    },
  ];

  return (
    <KeyboardAvoidingView
    behavior={Platform.OS === "ios" ? "padding" : "height"} // Ajuste específico para iOS
    style={{ flex: 1 }}
  >
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
    <View style={styles.container}>
      {/* Botón de Volver */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>

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
            <Ionicons name="close-circle" size={48} color="#F20505" />
            <Text style={styles.successModalText}>{errorMessage}</Text>
          </Animated.View>
        </View>
      </Modal>
      <MapView
        ref={mapRef}
        style={{ flex: 1, marginBottom: isVehicleModalVisible ? 300 : 0 }} // Ajustar el margen inferior según la visibilidad del BottomSheet
        loadingEnabled
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: origin.latitude,
          longitude: origin.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        customMapStyle={colorScheme === "dark" ? darkMapStyle : []}

      >
        <Marker
          coordinate={{
            latitude: origin.latitude,
            longitude: origin.longitude,
          }}
          title={origin.title}
          image={markeIconO}
        />
        <Marker
          coordinate={{
            latitude: destination.latitude,
            longitude: destination.longitude,
          }}
          title={destination.title}
          image={markeIcon}
        />
        {origin && destination && (
          <MapViewDirections
            origin={origin}
            destination={destination}
            apikey={GOOGLE_MAPS_APIKEY_PROD}
            strokeWidth={6}
            strokeColor="#f20505"
            onReady={(result) => {
              setDistance(result.distance);
              setDuration(result.duration);
            }}
          />
        )}
      </MapView>

      {/**  
      <View style={styles.autocompleteContainer}>
        <View style={styles.addressContainer}>
          <Text style={styles.address}>
            <FontAwesome5 name="map-pin" size={24} color="black" />{" "}
            {origin.title}
          </Text>
          <View style={styles.separator}></View>
          <Text style={styles.address}>
            <FontAwesome5 name="map-pin" size={24} color="red" />{" "}
            {destination.title}
          </Text>
        </View>
      </View> */}

      {/* Modal para detalles del vehículo y opciones */}
      <BottomSheetModalProvider >
      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={2} // Cambia el índice a 2 para abrir al 90%
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
        enablePanDownToClose={false} // Deshabilita el cierre al deslizar hacia abajo
        handleStyle={{ backgroundColor: colorScheme === "dark" ? "#000" : "#fff" }} // Fondo del área del indicador en negro
        handleIndicatorStyle={{ backgroundColor: colorScheme === "dark" ? "#fff" : "#000" }}
      >
    

          <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Detalles del viaje</Text>
          </View>
            {/* Opción de selección de vehículo */}
            <TouchableOpacity onPress={handleCarDetails} style={styles.option}>
              <Image
                source={
                  selectedVehicle?.carImage
                    ? { uri: selectedVehicle.carImage }
                    : require("./../../assets/images/microBlackCar.png")
                }
                style={styles.paymentIcon}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "bold",
                    color: "#f20505",
                    left: -60,
                    marginBottom: 10,
                  }}
                >
                  Seleciona tu vehículo{" "}
                </Text>
                <Text style={styles.paymentText}>
                  {selectedVehicle
                    ? `Vehículo seleccionado: ${selectedVehicle.name}`
                    : "Cargando..."}
                </Text>
                <Text style={styles.paymentText}>
                  {selectedVehicle
                    ? `Categoria: Servicio ${selectedVehicle.capacity}`
                    : "Cargando..."}
                </Text>
                <Text style={styles.estimateText}>
                  {fareDetails
                    ? `Valor estimado: $ ${roundPrice(
                        (tripType === "Ida y Vuelta"
                          ? fareDetails.estimateFare * 2 // Duplicar el costo para ida y vuelta
                          : fareDetails.estimateFare) +
                          (isScheduled ? 4000 : 0) +
                          (origin.title.includes("Aero") ||
                          destination.title.includes("Aero")
                            ? 7000
                            : 0) // Sumar 7000 si es programado o si contiene "aero"
                      )} - $ ${roundPrice(
                        (tripType === "Ida y Vuelta"
                          ? fareDetails.estimateFare * 2
                          : fareDetails.estimateFare) +
                          (isScheduled ? 4000 : 0) +
                          7000 + // Sumar 7000 adicional
                          (origin.title.includes("aero") ||
                          destination.title.includes("Aero")
                            ? 7000
                            : 0) // Sumar 7000 si contiene "aero"
                      )} COP`
                    : "Cargando estamos calculando el costo del viaje"}
                </Text>
              </View>
              <AntDesign name="right" size={16} color="#000" />
            </TouchableOpacity>

            {/* Modal para selección de vehículo */}
            <Modal
              visible={isVehicleModalVisible}
              transparent={true}
              animationType="slide"
              onRequestClose={() => setIsVehicleModalVisible(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                  {renderTaxiOptions()}
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setIsVehicleModalVisible(false)}
                  >
                    <Text style={styles.closeButtonText}>Cerrar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

            {/* Opciones de viaje */}
            <View style={{ marginTop: 10, width: "100%" }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "bold",
                  color: "#f20505",
                  left: 10,
                  marginBottom: 10,
                }}
              >
                Seleciona tu tipo de viaje{" "}
              </Text>
            </View>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  immediatePickup ? styles.activeButton : styles.inactiveButton,
                ]}
                onPress={() => {
                  setImmediatePickup(true);
                  setScheduleRide(false);
                  setIsScheduled(false);
                }}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    immediatePickup
                      ? styles.activeButtonText
                      : styles.inactiveButtonText,
                  ]}
                >
                  Viaje Inmediato
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.optionButton,
                  scheduleRide ? styles.activeButton : styles.inactiveButton,
                ]}
                onPress={() => {
                  setImmediatePickup(false);
                  setScheduleRide(true);
                  showDatePicker();
                }}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    scheduleRide
                      ? styles.activeButtonText
                      : styles.inactiveButtonText,
                  ]}
                >
                  Programar Viaje
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  isSoloIdaActive ? styles.activeButton : styles.inactiveButton, // Usar el estado de "Solo Ida"
                ]}
                onPress={() => {
                  setIsSoloIdaActive(true); // Activar "Solo Ida"
                  setIsIdaYVueltaActive(false); // Desactivar "Ida y Vuelta"
                  setImmediatePickup(true);
                  setTripType("Solo Ida"); // Establecer el tipo de viaje como "Solo Ida"
                }}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    isSoloIdaActive
                      ? styles.activeButtonText
                      : styles.inactiveButtonText,
                  ]}
                >
                  Solo Ida
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.optionButton,
                  isIdaYVueltaActive
                    ? styles.activeButton
                    : styles.inactiveButton, // Usar el estado de "Ida y Vuelta"
                ]}
                onPress={() => {
                  setIsIdaYVueltaActive(true); // Activar "Ida y Vuelta"
                  setIsSoloIdaActive(false); // Desactivar "Solo Ida"
                  setTripType("Ida y Vuelta"); // Establecer el tipo de viaje como "Ida y Vuelta"
                }}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    isIdaYVueltaActive
                      ? styles.activeButtonText
                      : styles.inactiveButtonText,
                  ]}
                >
                  Ida y Vuelta
                </Text>
              </TouchableOpacity>
            </View>

            {/* Selector de fecha para Programar Viaje */}
            <DateTimePickerModal
              isVisible={isDatePickerVisible}
              mode="datetime"
              locale="es_ES" // Use "en_GB" here
              onConfirm={handleConfirm}
              onCancel={hideDatePicker}
              isDarkModeEnabled={true}
              cancelTextIOS="Cancelar"
              confirmTextIOS="Confirmar Fecha"
              minimumDate={new Date()} // Set the minimum date to the current date and time
            />

            {/* Tipo de pago */}
            <TouchableOpacity
              style={[styles.option, { marginVertical: 16 }]}
              onPress={() => setShowPaymentModal(true)}
            >
              <Text
                style={[
                  styles.optionText,
                  { marginBottom: 12, color: "#F20505" },
                ]}
              >
                Tipo de Pago
              </Text>
              <Text style={[styles.optionText, { marginBottom: 12 }]}>
                {paymentTypes.find((type) => type.value === selectedPaymentType)
                  ?.label || "Efectivo"}
              </Text>
              <AntDesign name="down" size={16} color={colorScheme === "dark" ? "#fff" : "#000"} />
            </TouchableOpacity>

            {/* Promoción seleccionada */}
            {selectedPromo ? (
              <View
                style={{
                  margin: 10,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <Avatar
                  size={40}
                  rounded
                  source={{
                    uri: "https://cdn4.iconfinder.com/data/icons/icoflat3/512/discount-512.png",
                  }}
                />
                <Text> {selectedPromo.promo_code}</Text>
                <Text> ${selectedPromo.max_promo_discount_value}</Text>
              </View>
            ) : (
              <View
                style={{
                  marginTop: 20,
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  width: "100%",
                  alignItems: "center",
                  marginVertical: 5,
                  top: -40,
                }}
              >
                <Text style={{color: colorScheme === "dark" ? "#fff" : "#000"}}>No hay promo seleccionada</Text>

                <TouchableOpacity
                  style={[
                    styles.bookNow,
                    { backgroundColor: "#EEE", marginHorizontal: 10 },
                  ]}
                  onPress={handleShowPromoModal}
                >
                  <Text style={styles.promoButtonText}>Ingresar Promo</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Observaciones */}
            <View
              style={{
                marginTop: 20,
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                width: "100%",
                alignItems: "center",
                marginVertical: 5,
                top: -40,
              }}
            >
              <TextInput
                style={styles.input}
                placeholder="Añadir observaciones"
                placeholderTextColor="#999"
                onChangeText={setObservations}
                value={observations}
              />
            </View>

            {/* Botones de acción */}
            <View style={[styles.buttonContainer, { bottom: 80 }]}>
              {immediatePickup ? (
                <TouchableOpacity
                  style={[
                    styles.bookNow,
                    {
                      backgroundColor: "#f20505",
                      marginHorizontal: 10,
                      width: "40%",
                    },
                  ]}
                  onPress={handleBookNowPress} // Llama a la función de solicitar
                >
                  <Text style={[styles.confirmButtonText, { color: "#fff" }]}>
                    Solicitar
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.bookNow}
                  onPress={() => setIsDriverModalVisible(true)} // Abrir modal de conductores
                >
                  <Text style={styles.confirmButtonText}>Selecciona Conductor</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </BottomSheetModal>

        {/* Modales para Promociones y Pagos */}
        <Modal
          visible={isPromoModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={handleClosePromoModal}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[styles.modalContainer, { height: "100%", width: "90%" }]}
            >
              <Text style={styles.modalTitle}>Promociones Disponibles</Text>
              <PromoComp promotions={promotions} onPressButton={applyPromo} />
              <TouchableOpacity
                onPress={handleClosePromoModal}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal
          visible={showPaymentModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowPaymentModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Seleccione el tipo de pago</Text>

              {/* Lista de opciones de pago */}
              <FlatList
                data={paymentTypes}
                renderItem={renderPaymentOption}
                keyExtractor={(item) => item.value}
                style={styles.paymentList}
              />

              {/* Botón de cerrar */}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowPaymentModal(false)}
              >
                <Text style={styles.closeButtonText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </BottomSheetModalProvider>

      {/* Modal para selección de conductor */}
      <Modal
        visible={isDriverModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsDriverModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Selecciona un Conductor</Text>
            {drivers.length > 0 ? (
              renderDriverList() // Renderizar la lista de conductores si hay disponibles
            ) : (
              <Text style={styles.noDriversText}>No hay conductores disponibles en este momento.</Text>
            )}
            <View
              style={{
                flexDirection: "row-reverse",
                justifyContent: "space-between",
              }}
            >
              <TouchableOpacity
                style={[styles.closeButton, { marginHorizontal: 10, opacity: isButtonDisabled ? 0.5 : 1 }]}
                onPress={handleBookNowPress}
                disabled={isButtonDisabled} // Deshabilitar el botón si isButtonDisabled es true
              >
                <Text style={styles.closeButtonText}>
                  {drivers.length > 0 ? "Solicitar" : "Solicitar Servicio"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: "#eee" }]}
                onPress={() => {
                  setIsDriverModalVisible(false); // Cerrar el modal
                }}
              >
                <Text style={[styles.closeButtonText, { color: "#000" }]}>
                  Volver
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
    </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
   
  );
};

const lightStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  autocompleteContainer: {
    position: "absolute",
    top: 50,
    width: 360,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    left: (width - 360) / 2,
    borderRadius: 23,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 5,
  },
  addressContainer: {
    flexDirection: "column",
    height: 90,
    justifyContent: "center",
  },
  address: {
    fontSize: 16,
    fontWeight: "bold",
    marginVertical: 5,
    justifyContent: "center",
  },
  separator: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#F20505",
  },
  modalHeader: {
    width: "100%",
    alignItems: "center",
    margin: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#F20505",

  },
  modalContent: {
    flex: 1,
    alignItems: "center",
    padding: 20,
    top: -30,
  },
  option: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  optionText: {
    fontSize: 18,
    color: "#000",
  },
  successModalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 1000, // Asegúrate de ajustar el valor según la necesidad
  },
  successModalView: {
    width: 250,
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    alignItems: "center",
    elevation: 10,
  },
  successModalText: {
    color: "#f20505",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 10,
  },

  paymentIcon: {
    width: 54,
    height: 24,
    marginRight: 10,
  },
  paymentText: {
    fontSize: 16,
  },
  bookNow: {
    backgroundColor: "#f20505",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    marginTop: 10,
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  picker: {
    height: 50,
    width: "100%",
  },
  datePicker: {
    width: 100,
    height: 150,
    marginTop: 20,
  },
  estimateText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    marginVertical: 10,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 16,
  },
  optionButton: {
    flex: 1,
    padding: 10,
    marginHorizontal: 5,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  activeButton: {
    backgroundColor: "#ffff",
    borderWidth: 1,
    borderColor: "#F20505",
  },
  inactiveButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#333",
  },
  optionButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  activeButtonText: {
    color: "#F20505",
  },
  inactiveButtonText: {
    color: "#ddd",
  },
  datePickerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  closeButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#f20505",
    borderRadius: 5,
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },

  paymentList: {
    width: "100%", // Ajustamos el ancho de la lista al contenedor
    marginBottom: 20,
  },

  paymentOption: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomColor: "#ddd",
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  paymentOptionText: {
    fontSize: 18,
    color: "#333",
  },

  promoButton: {
    position: "absolute",
    bottom: 50,
    left: 20,
    right: 20,
    backgroundColor: "#F20505",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  promoButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
  },

  promoModal: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  promoContent: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
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
  promoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  promoText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  closePromoButton: {
    backgroundColor: "#333",
    borderRadius: 5,
    padding: 10,
    elevation: 2,
  },
  input: {
    width: "100%",
    height: 50,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    color: "#333",
    marginBottom: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 25,
    width: "85%",
    maxHeight: "70%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  taxiOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    padding: 15,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    marginBottom: 10,
    height: 100,
    backgroundColor: "#fff",
  },
  selectedTaxiOption: {
    borderColor: "#F20505",
    borderWidth: 2,
    shadowColor: "#F20505",
    shadowOpacity: 0.8,
    shadowRadius: 5,
  },
  taxiIcon: {
    height: 80,
    width: 80,
    resizeMode: "contain",
    marginRight: 10,
    borderRadius: 10,
    backgroundColor: "#f0f0f0",
    padding: 5,
  },
  optionDetails: {
    flex: 1,
    justifyContent: "center",
  },
  taxiType: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  taxiInfo: {
    fontSize: 14,
    color: "#555",
    fontWeight: "600",
    marginVertical: 5,
  },
  taxiPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#f20505",
    borderRadius: 5,
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  driverItem: {
    padding: 15,
    marginVertical: 5,
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
  },
  driverName: {
    fontSize: 16,
  },


  closeButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#f20505",
    borderRadius: 5,
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  selectDriverButton: {
    backgroundColor: "#f20505",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    marginTop: 10,
    position: "absolute",
    bottom: 10,
    width: "80%",
    alignSelf: "center",
  },
  selectDriverButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  backButton: {
    backgroundColor: "#f20505",
    borderRadius: 60,
    position: "absolute",
    top: 40,
    left: 20,
    padding: 10,
    zIndex: 1000, // Asegúrate de que el botón esté por encima de otros elementos
  },
});
const darkStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  autocompleteContainer: {
    position: "absolute",
    top: 50,
    width: 360,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    left: (width - 360) / 2,
    borderRadius: 23,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 5,
  },
  addressContainer: {
    flexDirection: "column",
    height: 90,
    justifyContent: "center",
  },
  address: {
    fontSize: 16,
    fontWeight: "bold",
    marginVertical: 5,
    justifyContent: "center",
  },
  separator: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#F20505",
  },
  modalHeader: {
    width: "100%",
    alignItems: "center",
    margin: 8,
    marginTop: 20,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#F20505",
  },
  modalContent: {
    flex: 1,
    alignItems: "center",
    padding: 20,
    top: -30,
    backgroundColor: "#000",
  },
  option: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  optionText: {
    fontSize: 18,
    color: "#fff",
  },
  successModalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 1000, // Asegúrate de ajustar el valor según la necesidad
  },
  successModalView: {
    width: 250,
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    alignItems: "center",
    elevation: 10,
  },
  successModalText: {
    color: "#f20505",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 10,
  },

  paymentIcon: {
    width: 54,
    height: 24,
    marginRight: 10,
  },
  paymentText: {
    fontSize: 16,
    color: "#fff",
  },
  bookNow: {
    backgroundColor: "#f20505",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    marginTop: 10,
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  picker: {
    height: 50,
    width: "100%",
  },
  datePicker: {
    width: 100,
    height: 150,
    marginTop: 20,
  },
  estimateText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginVertical: 10,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 16,
  },
  optionButton: {
    flex: 1,
    padding: 10,
    marginHorizontal: 5,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  activeButton: {
    backgroundColor: "#ffff",
    borderWidth: 1,
    borderColor: "#F20505",
  },
  inactiveButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#333",
  },
  optionButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  activeButtonText: {
    color: "#F20505",
  },
  inactiveButtonText: {
    color: "#ddd",
  },
  datePickerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  closeButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#f20505",
    borderRadius: 5,
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },

  paymentList: {
    width: "100%", // Ajustamos el ancho de la lista al contenedor
    marginBottom: 20,
  },

  paymentOption: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomColor: "#ddd",
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  paymentOptionText: {
    fontSize: 18,
    color: "#333",
  },

  promoButton: {
    position: "absolute",
    bottom: 50,
    left: 20,
    right: 20,
    backgroundColor: "#F20505",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  promoButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
  },

  promoModal: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  promoContent: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
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
  promoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  promoText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  closePromoButton: {
    backgroundColor: "#333",
    borderRadius: 5,
    padding: 10,
    elevation: 2,
  },
  input: {
    width: "100%",
    height: 50,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    color: "#333",
    marginBottom: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    backgroundColor: "#474747",
    borderRadius: 20,
    padding: 25,
    width: "85%",
    maxHeight: "70%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  taxiOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    padding: 15,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    marginBottom: 10,
    height: 100,
    backgroundColor: "#000",
  },
  selectedTaxiOption: {
    borderColor: "#F20505",
    borderWidth: 2,
    shadowColor: "#F20505",
    shadowOpacity: 0.8,
    shadowRadius: 5,
  },
  taxiIcon: {
    height: 80,
    width: 80,
    resizeMode: "contain",
    marginRight: 10,
    borderRadius: 10,
    backgroundColor: "#cacaca",
    padding: 5,
  },
  optionDetails: {
    flex: 1,
    justifyContent: "center",
  },
  taxiType: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  taxiInfo: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "600",
    marginVertical: 5,
  },
  taxiPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  closeButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#f20505",
    borderRadius: 5,
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  driverItem: {
    padding: 15,
    marginVertical: 5,
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
  },
  driverName: {
    fontSize: 16,
  },


  closeButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#f20505",
    borderRadius: 5,
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  selectDriverButton: {
    backgroundColor: "#f20505",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    marginTop: 10,
    position: "absolute",
    bottom: 10,
    width: "80%",
    alignSelf: "center",
  },
  selectDriverButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  backButton: {
    backgroundColor: "#f20505",
    borderRadius: 60,
    position: "absolute",
    top: 40,
    left: 20,
    padding: 10,
    zIndex: 1000, // Asegúrate de que el botón esté por encima de otros elementos
  },
});

export default BookingScreen;
