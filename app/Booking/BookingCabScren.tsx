import React, {
  useRef,
  useMemo,
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  Dimensions,
  Alert,
  Linking,
  Platform,
  Modal,
  useColorScheme,
  Animated,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Camera } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import {
  Entypo,
  FontAwesome,
  FontAwesome5,
  Ionicons,
  MaterialIcons,
} from "@expo/vector-icons";
import { Icon } from "react-native-elements";
import SliderButton from "@/components/SliderButton";
import {
  BottomSheetModal,
  BottomSheetModalProvider,
} from "@gorhom/bottom-sheet";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useSelector, useDispatch } from "react-redux";
import { ref, onValue, update } from "firebase/database";
import axios from "axios";
import { database } from "@/config/SupabaseConfig";
import OtpModal from "@/components/OtpModal";
import { RootState } from "@/common/store";
import loadCar from "./../../assets/video/g4.gif";
import { debounce, result } from "lodash";
import {
  startBooking,
  endBooking,
  arriveBooking,
  updateLocation,
  reportIncident,
} from "@/common/store/bookingsSlice.ts";
import CountdownModal from "@/components/CountdownModal";
import { roundPrice } from "@/hooks/roundPrice";
import originIcon from "../../assets/images/rsz_2red_pin.png";
import destinationIcon from "../../assets/images/green_pin.png";
import { colors } from "@/scripts/theme";
import { MAIN_COLOR } from "@/common/other/sharedFunctions";
import moment from "moment";
import { fonts } from "@/scripts/font";
import CancelModal from "@/components/CancelModal";
import { getDatabase } from "firebase/database";   
import {
  listenToSettingsChanges,
  selectSettings,
} from "@/common/reducers/settingsSlice";
import RadioForm from "react-native-simple-radio-button";

import { API_KEY } from '@/config/AppConfig'; // Asegúrate de importar la clave API
import MapSensor from "../(tabs)/mapaSensors";
import AntDesign from "@expo/vector-icons/AntDesign";

const { width, height } = Dimensions.get("window");
const GOOGLE_MAPS_APIKEY_PROD = API_KEY; // Reemplaza con tu API Key de Google Maps

const BookingCabScreen = () => {
  const route = useRoute();
  const dispatch = useDispatch();
  const [currentBooking, setCurrentBooking] = useState(
    route.params?.booking || {} // Use an empty object as a fallback
  );

  const user = useSelector((state: RootState) => state.auth.user);
  const mapRef = useRef<MapView>(null);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["60%", "70%"], []);
  const [driverLocation, setDriverLocation] = useState(null);
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [estimatedTime, setEstimatedTime] = useState(null);
  const [isDriverArrived, setIsDriverArrived] = useState(false);
  const navigation = useNavigation();
  const [isButtonDisabled, setIsButtonDisabled] = useState(true); // Estado para habilitar/deshabilitar el botón
  const [countdown, setCountdown] = useState(180); // 3 minutos en segundos
  const [showOtp, setShowOtp] = useState(false);
  const [isCountdownModalVisible, setIsCountdownModalVisible] = useState(false); // Nuevo estado para controlar la visibilidad del modal
  const [isCustomerArrivalModalVisible, setIsCustomerArrivalModalVisible] =
    useState(false);

  const [userLocation, setUserLocation] = useState({
    latitude: user?.location?.lat,
    longitude: user?.location.lng,
  });
  const [successModalVisible, setSuccessModalVisible] = useState(false);

  const [unreadMessages, setUnreadMessages] = useState(false);
  const db = getDatabase();
  const settings = useSelector(selectSettings);
  const [isIncidentModalVisible, setIsIncidentModalVisible] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const colorScheme = useColorScheme(); // Hook para detectar si es modo oscuro o claro
  const [fadeAnim] = useState(new Animated.Value(0)); // Animación de fade
  const [isConfirmationModalVisible, setIsConfirmationModalVisible] =
    useState(false);
  const incidentOptions = [
    { label: "Falla Mecanica (Parcial)", value: "Falla Mecanica (Parcial)" },

    {
      label: "Accidente de Tránsito (Fotos Requeridas)",
      value: "Accidente de Tránsito con Heridos (Fotos Requeridas)",
    },
    {
      label:
        "Tome el servicio por error y no alcanzo a llegar a cumplir con la reserva.",
      value:
        "Tome el servicio por error y no alcanzo a llegar a cumplir con la reserva.",
    },

    { label: "Falla Mecanica (Total)", value: "Falla Mecanica (Total)" },
    { label: "Falla Electrica", value: "Falla Electrica" },
    { label: "Otros", value: "Otros" },
    // Agrega más opciones según sea necesario
  ];
  const styles = colorScheme === "dark" ? darkStyles : lightStyles; // Estilos dinámicos

  useEffect(() => {
    // Start listening to settings changes
    dispatch(listenToSettingsChanges());
  }, [dispatch]);
  useEffect(() => {
    if (currentBooking?.id) {
      const messagesRef = ref(db, `chats/${currentBooking.id}/messages`);
      onValue(messagesRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const messages = Object.values(data);
          const lastMessage = messages[messages.length - 1];
          const hasUnread = messages.some(
            (message) => !message.read && message.Source !== user.usertype
          );
          setUnreadMessages(
            lastMessage.Source === user.usertype ? false : hasUnread
          );
        }
      });
    }
  }, [currentBooking]);

  useEffect(() => {
    if (
      currentBooking &&
      (currentBooking.status === "ACCEPTED" ||
        currentBooking.status === "ARRIVED" ||
        currentBooking.status === "STARTED") &&
      user &&
      user?.usertype === "driver"
    ) {
      const intervalId = setInterval(() => {
        //console.log(user);

        dispatch(
          updateLocation({ booking: currentBooking, driverProfile: user })
        );
      }, 15000); // 15000 milisegundos = 15 segundos
      return () => clearInterval(intervalId);
    }
  }, [dispatch, currentBooking, user]);

  useEffect(() => {
    if (currentBooking?.status === "ARRIVED") {
      setIsCountdownModalVisible(true); // Mostrar modal cuando el estado es ARRIVED
    }
  }, [currentBooking?.status]);
  useEffect(() => {
    if (currentBooking?.status === "NEW" && user?.usertype === "driver") {
      navigation.navigate("HomeScreen");
    }
  }, [currentBooking?.status, user?.usertype]);
  useEffect(() => {
    if (user?.location && currentBooking?.pickup) {
      const distance = getDistanceFromLatLonInMeters(
        user.location.lat,
        user.location.lng,
        currentBooking.pickup.lat,
        currentBooking.pickup.lng
      );
      // //console.log("aaaaaa", distance);
      if (distance <= 500) {
        //  //console.log("si esta dentro del rango");
        setIsButtonDisabled(false); // Habilitar el botón si está dentro de 500 metros
      } else {
        setIsButtonDisabled(true); // Deshabilitar el botón si está más lejos
      }
    }
  }, [user?.location, currentBooking?.pickup]);

  useEffect(() => {
    if (
      currentBooking?.status === "ARRIVED" &&
      currentBooking?.driver_arrived_time
    ) {
      const driverArrivedTime = new Date(
        currentBooking.driver_arrived_time
      ).getTime();
      const currentTime = Date.now();
      const timeElapsed = (currentTime - driverArrivedTime) / 1000; // Tiempo transcurrido en segundos
      const initialCountdown = 180; // 3 minutos en segundos

      // Calcula el tiempo restante
      const remainingTime = initialCountdown - timeElapsed;

      if (remainingTime > 0) {
        setCountdown(remainingTime);

        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              setShowOtp(true);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        return () => clearInterval(timer);
      } else {
        setCountdown(0);
        setShowOtp(true); // Mostrar OTP inmediatamente si el tiempo ya expiró
      }
    }
  }, [currentBooking?.status, currentBooking?.driver_arrived_time]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      if (currentBooking?.id) {
        const bookingRef = ref(database, `bookings/${currentBooking.id}`);

        onValue(bookingRef, (snapshot) => {
          const updatedBooking = snapshot.val();
          if (updatedBooking) {
            setCurrentBooking(updatedBooking);
          }
        });
      }
    });

    return unsubscribe;
  }, [navigation, currentBooking?.id]);

  useEffect(() => {
    if (currentBooking?.status === "ACCEPTED") {
      const trackingRef = ref(database, `tracking/${currentBooking.id}`);
      const unsubscribe = onValue(trackingRef, (snapshot) => {
        const trackingData = snapshot.val();
        if (trackingData) {
          const lastEntryKey = Object.keys(trackingData).pop();
          const { lat, lng } = trackingData[lastEntryKey];
          setDriverLocation({ latitude: lat, longitude: lng });
        }
      });
      return () => unsubscribe();
    } else if (
      currentBooking?.status === "CANCELLED" ||
      currentBooking?.status === "PENDING"
    ) {
      navigation.goBack();
    } else if (currentBooking?.status === "REACHED") {
      let booking = { ...currentBooking };

      navigation.navigate("Payment", { booking });
    }
  }, [currentBooking]);

  useEffect(() => {
    if (mapRef.current && driverLocation) {
      mapRef.current.animateCamera(
        {
          center: driverLocation,
          pitch: 70,
          altitude: 1500,
          zoom: 17,
        },
        { duration: 1000 }
      );
    }
  }, [driverLocation]);

  const handleStartTrip = () => {
    if (settings.otp_secure) {
      setOtpModalVisible(true);
    } else {
      handleOtpMatch(true);
    }

    if (Platform.OS === "android") {
      // Lógica específica para Android relacionada con heading o rotación si es necesario
    }
  };

  const handleOtpMatch = async (isMatch: boolean) => {
    setOtpModalVisible(false); // Cierra el modal
    if (isMatch) {
      if (
        !user ||
        (currentBooking?.status !== "ACCEPTED" &&
          currentBooking?.status !== "ARRIVED")
      ) {
        return Alert.alert("Error", "No se puede iniciar el viaje.");
      }
      try {
        await dispatch(
          startBooking({ booking: currentBooking, driverProfile: user })
        ).unwrap();
        <CountdownModal
          visible={isCountdownModalVisible}
          countdown={countdown}
          otp={currentBooking?.otp}
          onClose={() => setIsCountdownModalVisible(false)} // Cerrar el modal
        />;
        // Enviar notificación
        fetch(
          "https://us-central1-treasupdate.cloudfunctions.net/sendMassNotification",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              tokens: [currentBooking.customer_token],
              title: `¡${currentBooking.customer_name} Tu viaje ha comenzado!`,
              body: `¡Hola ${currentBooking.customer_name}! 🚗✨ Tu emocionante viaje ha comenzado. ¡Prepárate para una experiencia increíble!`,
            }),
          }
        )
          .then((response) => response.json())
          .then((data) => {
            console.log("Notificación enviada:", data);
          })
          .catch((error) => {
            console.error("Error al enviar la notificación:", error);
          });

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
      } catch (error) {
        Alert.alert("Error", `No se pudo iniciar el viaje: ${error}`);
      }
    } else {
      Alert.alert("Error", "El código OTP no coincide.");
    }
  };
  const handleCustomerArrival = () => {
    setIsCustomerArrivalModalVisible(true);
  };
  const confirmCustomerArrival = async () => {
    const arrivedTime = new Date().toISOString();

    try {
      const updatedBooking = {
        ...currentBooking,
        customer_arrived_time: arrivedTime,
      };

      // Actualizar la reserva en la base de datos
      const bookingId = currentBooking.uid || currentBooking.id;
      await update(ref(database, `bookings/${bookingId}`), updatedBooking);

      setCurrentBooking(updatedBooking);
      setIsCustomerArrivalModalVisible(false);
      Alert.alert(
        "Éxito",
        "Tu llegada ha sido confirmada. El conductor ahora puede iniciar el viaje sin ti."
      );
    } catch (error) {
      Alert.alert(
        "Error",
        "No se pudo confirmar tu llegada. Inténtalo de nuevo."
      );
    }
  };

  const handleEndTrip = async () => {
    //  console.log("Current user object:", user); // Log the full user object

    if (!user.location || !user.location.lat || !user.location.lng) {
      Alert.alert(
        "Error",
        "No se pudo finalizar el viaje: Driver Location data is missing"
      );
      return;
    }

    setIsConfirmationModalVisible(true);
  };

  const handlePresentModalPress = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);

  const handleArrived = async () => {
    //console.log("entro");
    if (isButtonDisabled) {
      Alert.alert(
        "Error",
        "No puedes confirmar la llegada porque estás demasiado lejos del punto de inicio."
      );
      return;
    }

    try {
      const result = await dispatch(arriveBooking(currentBooking)).unwrap();
      // Enviar notificación
      fetch(
        "https://us-central1-treasupdate.cloudfunctions.net/sendMassNotification",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tokens: [currentBooking.customer_token],
            title: `¡${currentBooking.customer_name}, tu conductor ha llegado!`,
            body: `Hola ${currentBooking.customer_name}, tu conductor ${user.firstName} ${user.lastName} ha llegado al punto de encuentro. Tienes 3 minutos para llegar al punto de recogida. Pasado este tiempo, el conductor podrá iniciar el viaje y se empezará a contar el costo del servicio. ¡Gracias por elegirnos!`,
          }),
        }
      )
        .then((response) => response.json())
        .then((data) => {
          console.log("Notificación enviada:", data);
        })
        .catch((error) => {
          console.error("Error al enviar la notificación:", error);
        });
      setIsDriverArrived(true);
    } catch (error) {
      Alert.alert("Error", `No se pudo finalizar el viaje: ${error}`);
    }
  };

  const onPressCall = () => {
    if (user.usertype === "customer") {
      let call_link =
        Platform.OS == "android"
          ? "tel:" + currentBooking.driver_contact
          : "telprompt:" + currentBooking.driver_contact;
      Linking.openURL(call_link);
    } else if (user.usertype === "driver") {
      let call_link =
        Platform.OS == "android"
          ? "tel:" + currentBooking.customer_contact
          : "telprompt:" + currentBooking.customer_contact;
      Linking.openURL(call_link);
    }
  };

  const openWhatsApp = () => {
    handleOpenOnlineChat();
  };

  const handleReporIncident = () => {
    setIsIncidentModalVisible(true);
  };

  const [modalVisible, setModalVisible] = useState(false);

  const handleOpenCancelModal = () => {
    if (!currentBooking || !currentBooking.id) {
      Alert.alert(
        "Atención",
        "Vuelve a entrar a la reserva para cancelar.",
        [
          {
            text: "OK",
            onPress: () => navigation.navigate("CustMap"), // Navegar a CustMap cuando no hay reserva
          },
        ],
        { cancelable: false }
      );
      return;
    } else {
      setModalVisible(true);
    }

    // Si hay un ID válido, mostramos el modal
    setModalVisible(true);
  };
  const getDistanceFromLatLonInMeters = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radio de la tierra en km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceInKm = R * c; // Distancia en km
    return distanceInKm * 1000; // Distancia en metros
  };
  const startNavigation = () => {
    let url = "https://www.google.com/maps/dir/?api=1&travelmode=driving";
    let bookingData = currentBooking;
    if (bookingData.status == "ACCEPTED") {
      url =
        url +
        "&destination=" +
        bookingData.pickup.lat +
        "," +
        bookingData.pickup.lng;
      Linking.openURL(url);
    } else if (bookingData.status == "STARTED") {
      if (
        bookingData.waypoints &&
        bookingData.waypoints.length &&
        bookingData.waypoints.length > 0
      ) {
        let abc =
          url +
          "&destination=" +
          bookingData.drop.lat +
          "," +
          bookingData.drop.lng +
          "&waypoints=";
        if (bookingData.waypoints.length > 1) {
          for (let i = 0; i < bookingData.waypoints.length; i++) {
            let obj = bookingData.waypoints[i];
            if (i < bookingData.waypoints.length - 1) {
              abc = abc + obj.lat + "," + obj.lng + "%7C";
            } else {
              abc = abc + obj.lat + "," + obj.lng;
            }
          }
          Linking.openURL(abc);
        } else {
          url =
            url +
            "&destination=" +
            bookingData.drop.lat +
            "," +
            bookingData.drop.lng +
            "&waypoints=" +
            bookingData.waypoints[0].lat +
            "," +
            bookingData.waypoints[0].lng;
          Linking.openURL(url);
        }
      } else {
        url =
          url +
          "&destination=" +
          bookingData.drop.lat +
          "," +
          bookingData.drop.lng;
        Linking.openURL(url);
      }
    } else {
      Alert.alert("alert", "navigation_available");
    }
  };

  const startNavigationWaze = () => {
    let url = "";
    
    if (currentBooking.status === "ACCEPTED") {
      // Utilizar las coordenadas de recogida
      url = `https://www.waze.com/ul?ll=${currentBooking.pickup.lat},${currentBooking.pickup.lng}&navigate=yes&zoom=17`;
    } else if (currentBooking.status === "STARTED") {
      // Utilizar las coordenadas de destino
      url = `https://www.waze.com/ul?ll=${currentBooking.drop.lat},${currentBooking.drop.lng}&navigate=yes&zoom=17`;
    } else {
      Alert.alert("Alerta", "Navegación no disponible en este estado.");
      return;
    }
  
    // Navegar a la pantalla del WebView con la URL
    navigation.navigate("NavigationWebView", { url });
  };

  const [lastLocation, setLastLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [lastBearing, setLastBearing] = useState<number>(0);
  const [heading, setHeading] = useState<number>(0); // Dirección actual del mapa
  const smoothFactor = 0.01; // Factor de suavizado

  const calculateBearing = (
    start: { latitude: number; longitude: number },
    end: { latitude: number; longitude: number }
  ): number => {
    const startLat = (start.latitude * Math.PI) / 180;
    const startLng = (start.longitude * Math.PI) / 180;
    const endLat = (end.latitude * Math.PI) / 180;
    const endLng = (end.longitude * Math.PI) / 180;

    const dLon = endLng - startLng;

    const y = Math.sin(dLon) * Math.cos(endLat);
    const x =
      Math.cos(startLat) * Math.sin(endLat) -
      Math.sin(startLat) * Math.cos(endLat) * Math.cos(dLon);

    let bearing = Math.atan2(y, x) * (180 / Math.PI);
    bearing = (bearing + 360) % 360; // Normalizar a 0-360 grados

    return bearing;
  };

  // Monitorear cambios en la ubicación para ajustar el rumbo
  useEffect(() => {
    if (Platform.OS !== "android") return; // Solo para Android

    if (userLocation) {
      if (lastLocation) {
        const newBearing = calculateBearing(lastLocation, userLocation);
        const bearingChange = Math.abs(newBearing - lastBearing);

        const normalizedChange =
          bearingChange > 180 ? 360 - bearingChange : bearingChange;

        const UMBRAL_CAMBIO = 10; // Grados de cambio para considerar un giro

        if (normalizedChange > UMBRAL_CAMBIO) {
          // Aplicar suavizado si es necesario
          const smoothedBearing =
            lastBearing * (1 - smoothFactor) + newBearing * smoothFactor;
          setHeading(smoothedBearing);
          setLastBearing(smoothedBearing);
        }
        // Si el cambio es menor que el umbral, mantener el rumbo actual
      }

      // Actualizar la última ubicación
      setLastLocation(userLocation);
    }
  }, [userLocation]);

  // Ajustar la cámara del mapa basado en el nuevo rumbo
  useEffect(() => {
    if (Platform.OS !== "android") return; // Solo para Android

    if (mapRef.current && userLocation) {
      const camera: Camera = {
        center: userLocation,
        pitch: 40,
        heading: heading, // Utilizar el ángulo calculado
        zoom: 18, // Ajusta el zoom según tus necesidades
        altitude: 1500, // Puedes ajustar la altitud si es necesario
      };
      mapRef.current.animateCamera(camera, { duration: 500 });
      console.log("Camera updated with heading:", heading);
    }
  }, [heading, userLocation]);

  // Suscripción al giroscopio para obtener el heading

  let requestCount = 0; // Variable global para contar las peticiones

  useEffect(() => {
    console.log("Se activa el debounce, pero aún no se ejecuta la función"); // Log antes de la función debounce

    const debounceCalculateETA = debounce(async () => {
      console.log("Se ejecuta la función dentro de debounce"); // Log dentro de debounce

      if (driverLocation && currentBooking) {
        let destination = "";
        if (currentBooking.status === "ACCEPTED") {
          destination = `${currentBooking.pickup.lat},${currentBooking.pickup.lng}`;
        } else if (currentBooking.status === "STARTED") {
          destination = `${currentBooking.drop.lat},${currentBooking.drop.lng}`;
        }

        const origin = `${driverLocation.latitude},${driverLocation.longitude}`;

        // console.log("Origen (ubicación actual del conductor):", origin);

        const API_KEY = GOOGLE_MAPS_APIKEY_PROD;

        try {
          requestCount++;

          console.log(
            "Número de peticiones realizadas a la API hasta ahora:",
            requestCount
          );

          const response = await axios.get(
            `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&key=${API_KEY}`
          );

          if (response.data.routes.length > 0) {
            const duration = response.data.routes[0].legs[0].duration.text;
            setEstimatedTime(duration);
          } else {
            console.log(
              "No se pudo calcular el tiempo estimado.",
              response.data
            );
          }
        } catch (error) {
          if (axios.isAxiosError(error) && error.response) {
            console.error("Respuesta de error de la API:", error.response.data);
          }
        }
      }
    }, 60000); // Ajusta el tiempo de debounce según sea necesario (en este caso 1 minuto)

    debounceCalculateETA();
  }, [driverLocation, currentBooking]);

  const determineTripType = (pickup, drop) => {
    if (
      !pickup ||
      !drop ||
      !pickup.lat ||
      !pickup.lng ||
      !drop.lat ||
      !drop.lng
    ) {
      return "Ubicaciones no disponibles";
    }

    const cityLimits = {
      northEast: { latitude: 4.8, longitude: -73.9 },
      southWest: { latitude: 4.5, longitude: -74.2 },
    };

    const isWithinCityLimits = (location) => {
      return (
        location.lat >= cityLimits.southWest.latitude &&
        location.lat <= cityLimits.northEast.latitude &&
        location.lng >= cityLimits.southWest.longitude &&
        location.lng <= cityLimits.northEast.longitude
      );
    };

    const isUrban = isWithinCityLimits(pickup) && isWithinCityLimits(drop);
    return isUrban ? "Urbano" : "Intermunicipal";
  };

  useEffect(() => {
    if (currentBooking.id) {
      // console.log("ID de la reserva actual:", currentBooking.id); // Verifica que el id esté presente
    } else {
      console.error("La reserva actual no tiene un ID.");
    }
  }, [currentBooking]);
  const handleOpenOnlineChat = () => {
    if (currentBooking.id) {
      navigation.navigate("Chat", {
        bookingId: currentBooking.id,
        customer_pushToken: currentBooking.customer_token,
        driver_pushToken: currentBooking.driver_token,
      });
    } else {
      Alert.alert("Error", "ID de reserva no disponible.");
    }
  };

  const navigationSecurity = (currentBooking) => {
    if (!currentBooking) {
      console.error("currentBooking es undefined");
      return; // Salir de la función si currentBooking es undefined
    }

    const booking = currentBooking;
    console.log(booking);
    navigation.navigate("Segurity", { booking });
  };
  const handleReportIncident = () => {
    if (!currentBooking.id || !selectedIncident) {
      console.error("Booking ID or incident not available");
      return;
    }
    dispatch(
      reportIncident({
        bookingId: currentBooking.id,
        incident: selectedIncident,
      })
    ).then((response) => {
      if (response.error) {
        console.error("Error reporting incident:", response.error.message);
      } else {
        console.log("Incidencia reportada con éxito:", selectedIncident);
      }
    });
    setIsIncidentModalVisible(false);
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
  const finalizarReserva = async (currentBooking, user) => {
    setIsConfirmationModalVisible(false);
    try {
      const result = await dispatch(
        endBooking({ booking: currentBooking, driverProfile: user })
      ).unwrap(); // Asegúrate de que driverProfile se pase como user

      if (result && result.status === "REACHED") {
        let booking = { ...result };
        // Enviar notificación

        fetch(
          "https://us-central1-treasupdate.cloudfunctions.net/sendMassNotification",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              tokens: [currentBooking.customer_token],
              title: `¡Has llegado a tu destino!`,
              body: `Hola ${currentBooking.customer_name}, Has llegado a tu destino ${currentBooking.dropAddress}.`,
            }),
          }
        )
          .then((response) => response.json())
          .then((data) => {
            console.log("Notificación enviada:", data);
          })
          .catch((error) => {
            console.error("Error al enviar la notificación:", error);
          });

        navigation.navigate("Payment", { booking });
      } else {
        Alert.alert("Error", "No se pudo finalizar la reserva correctamente.");
      }
    } catch (error) {
      Alert.alert(
        "Error",
        `No se pudo finalizar el viaje: ${error.message || error}`
      );
    }
  };

  useEffect(() => {
    if (user?.location && currentBooking?.drop) {
      console.log("Origen:", user.location.lat, user.location.lng);
      console.log("Destino:", currentBooking.drop.lat, currentBooking.drop.lng);
    } else {
      console.warn("Las coordenadas de origen o destino no están disponibles.");
    }
  }, [user, currentBooking]);

  return (
    <BottomSheetModalProvider>
      <View style={styles.container}>
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            zIndex: 2,
            padding: 15,
          }}
        >
          <TouchableOpacity
            style={{
              backgroundColor: "#ffaeae",
              borderRadius: 100,
              width: 40,
              height: 40,
              justifyContent: "center",
              alignItems: "center",
            }}
            onPress={() => navigation.goBack()} // Cambia 'NombreDeLaPantalla' por el nombre de la pantalla a la que deseas navegar
          >
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
        </View>
        <>
          {user?.usertype === "driver" ? (
            <>
              <MapSensor routeCoordinates={currentBooking?.status === "STARTED" ? result?.coordinates : []}>
                <Marker
                  coordinate={{
                    latitude: currentBooking.drop.lat,
                    longitude: currentBooking.drop.lng,
                  }}
                  title="Punto de Destino"
                  image={destinationIcon}
                />
                {currentBooking?.status === "STARTED" && (
                  <MapViewDirections
                    origin={{
                      latitude: user?.location.lat,
                      longitude: user?.location.lng,
                    }}
                    destination={{
                      latitude: currentBooking.drop.lat,
                      longitude: currentBooking.drop.lng,
                    }}
                    apikey={GOOGLE_MAPS_APIKEY_PROD}
                    strokeWidth={5}
                    strokeColor={colorScheme === "dark" ? "#FFF" : "#000"}
                    onReady={(result) => {
                      if (mapRef.current) {
                        mapRef.current.fitToCoordinates(result.coordinates, {
                          edgePadding: {
                            right: 20,
                            bottom: 20,
                            left: 20,
                            top: 20,
                          },
                        });
                        const heading = calculateBearing(
                          result.coordinates[0],
                          result.coordinates[1]
                        );
                        mapRef.current.animateCamera({
                          heading,
                        });
                      }
                    }}
                    onError={(errorMessage) => {
                      console.error("GMaps Error:", errorMessage);
                      //  Alert.alert("Error de Ruta", errorMessage);
                    }}
                  />
                )}

                {currentBooking.status === "ACCEPTED" && (
                  <>
                    <Marker
                      coordinate={{
                        latitude: currentBooking.pickup.lat,
                        longitude: currentBooking.pickup.lng,
                      }}
                      title="Punto de Origen"
                      image={originIcon}
                    />
                    <MapViewDirections
                      origin={
                        driverLocation
                          ? {
                              latitude: driverLocation.latitude,
                              longitude: driverLocation.longitude,
                            }
                          : {
                              latitude: user?.location.lat,
                              longitude: user?.location.lng,
                            }
                      }
                      destination={{
                        latitude: currentBooking.pickup.lat,
                        longitude: currentBooking.pickup.lng,
                      }}
                      apikey={GOOGLE_MAPS_APIKEY_PROD}
                      strokeWidth={7}
                      strokeColor={colorScheme === "dark" ? 'white' : 'red'}
                      onError={(errorMessage) =>
                        console.error("GMaps Error:", errorMessage)
                      }
                     
                    />
                  </>
                )}
              </MapSensor>
            </>
          ) : (
            <>
              <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                scrollEnabled={true}
                rotateEnabled={true} // Evita la rotación del mapa
                zoomEnabled={false}
                pitchEnabled={true}
                initialRegion={{
                  latitude: user?.location.lat || 0,
                  longitude: user?.location.lng || 0,
                  latitudeDelta: 0.015,
                  longitudeDelta: 0.0121,
                }}
                followsUserLocation={true}
                customMapStyle={colorScheme === "dark" ? darkMapStyle : []}
              >
                <>
                  <Marker
                    coordinate={{
                      latitude: currentBooking.pickup.lat,
                      longitude: currentBooking.pickup.lng,
                    }}
                    title="Punto de Origen"
                    image={originIcon}
                  />
                  <Marker
                    coordinate={{
                      latitude: currentBooking.drop.lat,
                      longitude: currentBooking.drop.lng,
                    }}
                    title="Punto de Destino"
                    image={destinationIcon}
                  />
                  <MapViewDirections
                    origin={{
                      latitude: currentBooking.pickup.lat,
                      longitude: currentBooking.pickup.lng,
                    }}
                    destination={{
                      latitude: currentBooking.drop.lat,
                      longitude: currentBooking.drop.lng,
                    }}
                    apikey={GOOGLE_MAPS_APIKEY_PROD}
                    strokeWidth={3}
                    strokeColor={MAIN_COLOR}
                    onError={(errorMessage) =>
                      console.error("GMaps Error:", errorMessage)
                    }
                  />
                </>
              </MapView>
            </>
          )}

          <CancelModal
            isVisible={modalVisible} // Aquí pasas el estado que controla la visibilidad
            onClose={() => setModalVisible(false)} // Lógica para cerrar el modal
            currentBooking={currentBooking} // Aquí pasas la reserva actual
            user={user} // Aquí pasas el usuario actual
          />
          <Header
            currentBooking={currentBooking}
            user={user}
            colorScheme={colorScheme}
          />
          <ButonsFloat
            handleOpenOnlineChat={handleOpenOnlineChat}
            startNavigation={startNavigation}
            startNavigationWaze={startNavigationWaze}
            navigationSecurity={navigationSecurity}
            openWhatsApp={openWhatsApp}
            onPressCall={onPressCall}
            user={user}
            unreadMessages={unreadMessages}
            currentBooking={currentBooking}
            colorScheme={colorScheme}
          />
          <DetailsContainer
            currentBooking={currentBooking}
            user={user}
            estimatedTime={estimatedTime}
            onPresentModalPress={handlePresentModalPress}
            onStartTrip={handleStartTrip}
            handleArrived={handleArrived}
            handleEndTrip={handleEndTrip}
            openWhatsApp={openWhatsApp}
            onPressCall={onPressCall}
            onHandle={handleArrived}
            isButtonDisabled={isButtonDisabled}
            handleCustomerArrival={handleCustomerArrival}
            setIsCustomerArrivalModalVisible={setIsCustomerArrivalModalVisible}
            confirmCustomerArrival={confirmCustomerArrival}
            isCustomerArrivalModalVisible={isCustomerArrivalModalVisible}
            colorScheme={colorScheme}
          />
          {otpModalVisible && (
            <OtpModal
              modalVisible={otpModalVisible}
              requestModalClose={() => setOtpModalVisible(false)}
              otp={currentBooking?.otp}
              onMatch={handleOtpMatch}
            />
          )}
          <CountdownModal
            visible={isCountdownModalVisible}
            countdown={countdown}
            otp={currentBooking?.otp}
            onClose={() => setIsCountdownModalVisible(false)} // Cerrar el modal
          />
          {currentBooking.status !== "ARRIVED" ? null : (
            <View
              style={{
                alignItems: "flex-end",
                justifyContent: "flex-end",
                marginRight: 25,
                position: "absolute",
                top: 10,
                marginLeft: -10,
                width: "100%",
                height: "70%",
              }}
            >
              <TouchableOpacity
                style={styles.reopenButton}
                onPress={() => setIsCountdownModalVisible(true)}
              >
                <Ionicons name="timer" size={24} color="red" />
              </TouchableOpacity>
            </View>
          )}
          <BottomSheetModal
            ref={bottomSheetModalRef}
            index={0}
            snapPoints={snapPoints}
          >
            <BottomSheetContent
              user={user}
              currentBooking={currentBooking}
              handleReporIncident={handleReporIncident}
              determineTripType={determineTripType}
              handleOpenCancelModal={handleOpenCancelModal}
              colorScheme={colorScheme}
            />
          </BottomSheetModal>
        </>

        <Modal
          animationType="slide"
          transparent={true}
          visible={searchModalVisible}
          onRequestClose={() => {
            setSearchModalVisible(false);
          }}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: colors.BACKGROUND,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <View
              style={{
                width: width - 70,
                borderRadius: 10,
                flex: 1,
                maxHeight: 310,
                marginTop: 15,
                backgroundColor: colors.WHITE,
              }}
            >
              <Image
                source={loadCar}
                resizeMode={"contain"}
                style={{ width: "100%", height: 220, alignSelf: "center" }}
              />
              <View style={{ color: colors.BLACK, alignSelf: "center" }}>
                <Text
                  style={{
                    color: colors.HEADER,
                    fontSize: 16,
                    fontFamily: fonts.Regular,
                  }}
                >
                  {"El conductor se asignará pronto.."}
                </Text>
              </View>
              <View
                style={{
                  position: "absolute",
                  bottom: 10,
                  alignSelf: "center",
                }}
              >
                <TouchableOpacity
                  style={{
                    width: 120,
                    backgroundColor: colors.RED,
                    marginTop: 20,
                    borderRadius: 18,
                    alignItems: "center",
                  }}
                  onPress={() => {
                    setSearchModalVisible(false);
                  }}
                >
                  <Text
                    style={{ fontFamily: fonts.Bold, margin: 7, color: "#FFF" }}
                  >
                    Cerrar
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        <Modal
          animationType="slide"
          transparent={true}
          visible={isIncidentModalVisible}
          onRequestClose={() => setIsIncidentModalVisible(false)}
        >
          <View style={styles.modalCenteredView}>
            <View style={styles.modalView}>
              <Text style={styles.modalText}>Selecciona una incidencia:</Text>
              <RadioForm
                radio_props={incidentOptions}
                initial={null}
                onPress={(value) => setSelectedIncident(value)}
                buttonColor={"#F20505"}
                selectedButtonColor={"#F20505"}
                labelStyle={{ fontSize: 16, color: "#000" }}
                radioStyle={{ marginBottom: 15 }}
              />
              <View
                style={{
                  flexDirection: "row-reverse",
                  justifyContent: "space-between",
                }}
              >
                <TouchableOpacity
                  style={[
                    styles.modalConfirmButton,
                    { backgroundColor: "#F20505", marginHorizontal: 10 },
                  ]}
                  onPress={handleReportIncident}
                >
                  <Text style={styles.modalConfirmButtonText}>Reportar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalCancelButton,
                    { backgroundColor: "#333", marginHorizontal: 10 },
                  ]}
                  onPress={() => setIsIncidentModalVisible(false)}
                >
                  <Text style={styles.modalCancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
              <Text style={styles.successModalText}>
                Se ha iniciado el viaje!
              </Text>
            </Animated.View>
          </View>
        </Modal>
        <Modal
          transparent={true}
          visible={isConfirmationModalVisible}
          animationType="fade"
          onRequestClose={() => setIsConfirmationModalVisible(false)}
        >
          <View style={styles.successModalContainer}>
            <View style={styles.successModalView}>
              <AntDesign name="infocirlce" size={48} color="#fff" />
              <Text style={styles.modalText}>
                ¿Estás seguro que deseas finalizar el viaje?
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: "#fff" }]}
                  onPress={() => {
                    // Acción para el botón Aceptar
                    finalizarReserva(currentBooking, user);
                    setModalVisible(false);
                  }}
                >
                  <Text style={styles.modalButtonText}>Aceptar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalButtonCancel,
                    { backgroundColor: "#333" },
                  ]}
                  onPress={() => setIsConfirmationModalVisible(false)}
                >
                  <Text
                    style={[styles.modalButtonText, { color: colors.WHITE }]}
                  >
                    Cancelar
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </BottomSheetModalProvider>
  );
};
const BottomSheetContent = ({
  currentBooking,
  user,
  handleOpenCancelModal,
  handleReporIncident,
  determineTripType,
  colorScheme,
}) => {
  const styles = colorScheme === "dark" ? darkStyles : lightStyles; // Estilos dinámicos
  const carImageSource = currentBooking?.carImage
    ? { uri: currentBooking.car_image }
    : require("../../assets/images/defaultVehicle.png");

  return (
    <View style={styles.contentContainer}>
      {/* Encabezado del Viaje */}
      <View style={styles.header2}>
        <View style={{ margin: 1 }}>
          <Image
            source={carImageSource}
            style={[styles.carImage, { height: 90, width: 90 }]}
          />
          <View
            style={{
              flexDirection: "row",
              alignItems: "stretch",
              width: "auto",
            }}
          >
            <Text
              style={{
                marginHorizontal: 4,
                color: colorScheme === "dark" ? "white" : "black",
              }}
            >
              <Text style={{ fontWeight: "bold" }}> Placa:</Text>{" "}
              {currentBooking.vehicle_number}
            </Text>
            <Text
              style={{
                marginHorizontal: 4,
                color: colorScheme === "dark" ? "white" : "black",
              }}
            >
              <Text style={{ fontWeight: "bold" }}> Marca: </Text>{" "}
              {currentBooking.vehicleMake}
            </Text>
            <Text
              style={{
                marginHorizontal: 4,
                color: colorScheme === "dark" ? "white" : "black",
              }}
            >
              <Text style={{ fontWeight: "bold" }}> Color:</Text>{" "}
              {currentBooking.vehicleColor}
            </Text>
          </View>
        </View>

        <View style={{ right: 69 }}>
          {user?.usertype === "customer" ? (
            // Si es customer, mostrar "Cancelar viaje"
            <TouchableOpacity onPress={handleOpenCancelModal}>
              <Text style={styles.cancelRideText}>Cancelar viaje</Text>
            </TouchableOpacity>
          ) : user?.usertype === "driver" ? (
            // Si es driver, mostrar "Reportar incidencia"
            <TouchableOpacity onPress={handleReporIncident}>
              <Text style={styles.cancelRideText}>Reportar Incidencia</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Información del Conductor */}
      <View
        style={[styles.driverInfoContainer, { margin: 10, borderWidth: 0.8 }]}
      ></View>

      {/* Detalles del Viaje */}
      <View style={styles.tripDetails}>
        <Text style={styles.tripTitle}>Información del Viaje</Text>

        {/* Fecha del viaje */}
        <View style={styles.row}>
          <Image
            source={require("./../../assets/images/iconos3d/45.png")}
            style={styles.iconImage}
          />
          <Text style={styles.tripDateText}>
            {currentBooking?.tripdate
              ? moment(currentBooking.tripdate).format("lll")
              : ""}
          </Text>
        </View>

        {/* Paradas del viaje */}
        <View style={styles.tripStops}>
          <Text style={styles.tripStopText}>
            <Ionicons
              name="location-outline"
              size={24}
              color={colors.BALANCE_GREEN}
            />{" "}
            {currentBooking?.pickupAddress}
          </Text>
          <View style={styles.tripStopSeparator} />
          <Text style={styles.tripStopText}>
            <Ionicons
              name="location-outline"
              size={24}
              color={colors.LIGHT_RED}
            />{" "}
            {currentBooking?.dropAddress}
          </Text>
        </View>
      </View>

      {/* Detalle de Pago */}
      <View style={styles.paymentDetails}>
        <Text style={styles.paymentTitle}>Detalles de Pago</Text>

        <Text style={styles.amountText}>
          <Text style={{ fontWeight: "bold" }}> Costo Estimado:</Text> $
          {roundPrice(parseFloat(currentBooking.trip_cost))} - $
          {roundPrice(parseFloat(currentBooking.trip_cost) + 7000)}
        </Text>

        {/* Método de pago y tipo de viaje */}
        <View style={styles.paymentMethodContainer}>
          <View style={styles.paymentMethod}>
            <Text style={styles.iconText}>
              {currentBooking.payment_mode === "cash" ? (
                <Ionicons name="cash" size={29} color={colors.BALANCE_GREEN} />
              ) : currentBooking.payment_mode === "card" ? (
                <FontAwesome name="credit-card" size={29} color="red" />
              ) : currentBooking.payment_mode === "corp" ? (
                <MaterialIcons name="corporate-fare" size={29} color="black" />
              ) : null}
            </Text>
            <Text style={styles.methodText}>
              {currentBooking.payment_mode === "cash"
                ? "Efectivo"
                : currentBooking.payment_mode === "card"
                ? "Tarjeta"
                : currentBooking.payment_mode === "corp"
                ? "Empresarial"
                : currentBooking.payment_mode === "wallet"
                ? "Billetera"
                : null}
            </Text>
          </View>

          {/* Tipo de viaje */}
          <View style={styles.paymentMethod}>
            <Text style={styles.iconText}>
              <Entypo
                name="location"
                size={29}
                color={colorScheme === "dark" ? "white" : "#3333"}
              />
            </Text>
            <Text style={styles.methodText}>{currentBooking.tripType}</Text>
          </View>

          {/* Detalles adicionales */}
          <View style={styles.paymentMethod}>
            <Text style={styles.iconText}>
              <FontAwesome5 name="map" size={29} color="#ff5b5b" />
            </Text>
            <Text style={[styles.methodText]}>
              {determineTripType(currentBooking?.pickup, currentBooking?.drop)}
            </Text>
          </View>
        </View>

        {/* Observaciones */}
        <View style={{ marginVertical: 13 }}>
          <Text
            style={[styles.tripDetail, { fontWeight: "bold", color: "black" }]}
          >
            Observaciones: {currentBooking?.observations}
          </Text>
        </View>
      </View>
    </View>
  );
};

const Header = ({ currentBooking, user, colorScheme }) => {
  const styles = colorScheme === "dark" ? darkStyles : lightStyles; // Estilos dinámicos

  return (
    <View style={styles.header}>
      <Text style={styles.address}>
        Estado:{" "}
        {currentBooking?.status === "ACCEPTED"
          ? "ACEPTADO"
          : currentBooking && currentBooking.status === "REACHED"
          ? "ALCANZADO"
          : currentBooking && currentBooking.status === "STARTED"
          ? "INICIO"
          : currentBooking && currentBooking.status === "NEW"
          ? "NUEVO"
          : currentBooking && currentBooking.status === "ARRIVED"
          ? "LLEGO"
          : ""}
      </Text>
      {user?.usertype === "customer" && (
        <Text style={styles.address}>
          {" "}
          Cod de Seg: {currentBooking && currentBooking.otp}
        </Text>
      )}
      <ProfileImage
        currentBooking={currentBooking}
        user={user}
        colorScheme={colorScheme}
      />
    </View>
  );
};

const ButonsFloat = ({
  startNavigation,
  user,
  startNavigationWaze,
  navigationSecurity,
  onPressCall,
  handleOpenOnlineChat,
  unreadMessages,
  currentBooking,
  colorScheme,
}) => {
  const styles = colorScheme === "dark" ? darkStyles : lightStyles; // Estilos dinámicos

  return (
    <View
      style={{
        position: "absolute",
        top:
          user?.usertype === "driver" ? height / 2.4 - 50 : height / 1.7 - 50, // Ajusta 50 según la mitad de la altura del componente
        left: 0, // Alinea a la izquierda
        width: "20%", // Ajusta el ancho según sea necesario
        height: 100, // Ajusta el alto según sea necesario
        alignItems: "flex-start",
        justifyContent: "center", // Centra el contenido verticalmente
        marginLeft: 10,
      }}
    >
      {user?.usertype == "driver" ? (
        <TouchableOpacity
          style={styles.floatButton1}
          onPress={() => startNavigation()}
        >
          <Icon
            name="navigate-circle"
            type="ionicon"
            size={30}
            color={colors.WHITE}
          />
        </TouchableOpacity>
      ) : null}

      <TouchableOpacity
        style={styles.floatButton1}
        onPress={handleOpenOnlineChat}
      >
        <FontAwesome name="wechat" size={24} color="white" />
        {unreadMessages && <View style={styles.unreadIndicator} />}
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.floatButton1, { marginVertical: 10 }]}
        onPress={onPressCall}
      >
        <MaterialIcons name="phone" size={24} color="white" />
      </TouchableOpacity>
      {user?.usertype === "driver" ? (
        <View>
          <TouchableOpacity
            style={[styles.floatButton1, { marginVertical: 10 }]}
            onPress={() => startNavigationWaze()}
          >
            <FontAwesome5 name="waze" size={30} color={colors.WHITE} />
          </TouchableOpacity>
        </View>
      ) : null}

      <View>
        <TouchableOpacity
          style={[styles.floatButton1, { marginVertical: 10 }]}
          onPress={() => navigationSecurity(currentBooking)}
        >
          <FontAwesome5 name="shield-alt" size={30} color={colors.WHITE} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const DetailsContainer = ({
  currentBooking,
  user,
  estimatedTime,
  onPresentModalPress,
  onStartTrip,
  handleEndTrip,
  openWhatsApp,
  onPressCall,
  onHandle,

  isButtonDisabled,
  handleArrived,
  handleCustomerArrival,
  setIsCustomerArrivalModalVisible,
  confirmCustomerArrival,
  isCustomerArrivalModalVisible,
  colorScheme, // Agregar colorScheme aquí
}) => {
  const styles = colorScheme === "dark" ? darkStyles : lightStyles; // Estilos dinámicos

  return (
    <View style={styles.detailsContainer}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text
          style={{
            fontSize: 16,
            fontWeight: "bold",
            color: colorScheme === "dark" ? "white" : "black",
          }}
        >
          {user?.usertype === "customer"
            ? estimatedTime
              ? `Estás a ${estimatedTime} de tu Conductor`
              : "calculando..."
            : `Estás a ${estimatedTime || "calculando..."} de tu servicio`}
        </Text>

        <TouchableOpacity onPress={onPresentModalPress}>
          <Text style={{ fontSize: 16, fontWeight: "bold", color: "#f50505" }}>
            Detalle del Viaje
          </Text>
        </TouchableOpacity>
      </View>
      <DriverInfo
        currentBooking={currentBooking}
        user={user}
        colorScheme={colorScheme}
      />
      <CarDetails currentBooking={currentBooking} colorScheme={colorScheme} />
      <ActionButtons
        currentBooking={currentBooking}
        user={user}
        onStartTrip={onStartTrip}
        onHandle={onHandle}
        handleEndTrip={handleEndTrip}
        openWhatsApp={openWhatsApp}
        onPressCall={onPressCall}
        handleArrived={handleArrived}
        isButtonDisabled={isButtonDisabled}
        handleCustomerArrival={handleCustomerArrival}
        setIsCustomerArrivalModalVisible={setIsCustomerArrivalModalVisible}
        confirmCustomerArrival={confirmCustomerArrival}
        isCustomerArrivalModalVisible={isCustomerArrivalModalVisible}
        colorScheme={colorScheme}
      />
    </View>
  );
};

const ActionButtons = ({
  currentBooking,
  user,
  onStartTrip,
  handleArrived,
  handleEndTrip,
  openWhatsApp,
  onPressCall,
  onHandle,

  isButtonDisabled,
  handleCustomerArrival,
  confirmCustomerArrival,
  isCustomerArrivalModalVisible,
  setIsCustomerArrivalModalVisible,
  colorScheme,
}) => {
  const styles = colorScheme === "dark" ? darkStyles : lightStyles; // Estilos dinámicos

  return (
    <View style={styles.actionsContainer}>
      {user?.usertype === "customer" ? (
        <>
          <TouchableOpacity style={styles.messageButton} onPress={openWhatsApp}>
            <Text style={styles.messageButtonText}>MENSAJES</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.callButton} onPress={onPressCall}>
            <Text style={styles.callButtonText}>LLAMADA</Text>
          </TouchableOpacity>
          {currentBooking && currentBooking.status === "ARRIVED" && (
            <TouchableOpacity
              style={styles.iniciarButton}
              onPress={handleCustomerArrival}
            >
              <Text style={styles.callButtonText}>INICIAR!</Text>
            </TouchableOpacity>
          )}
          <CustomerArrivalModal
            visible={isCustomerArrivalModalVisible}
            onConfirm={confirmCustomerArrival}
            onCancel={() => setIsCustomerArrivalModalVisible(false)}
            colorScheme={colorScheme}
          />
        </>
      ) : (
        <View style={styles.actionsContainer}>
          {user?.usertype === "customer" ? (
            <>
              <TouchableOpacity
                style={styles.messageButton}
                onPress={openWhatsApp}
              >
                <Text style={styles.messageButtonText}>MENSAJES</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.callButton} onPress={onPressCall}>
                <Text style={styles.callButtonText}>LLAMADA</Text>
              </TouchableOpacity>
              {currentBooking && currentBooking.status === "ARRIVED" && (
                <TouchableOpacity
                  style={styles.iniciarButton}
                  onPress={handleCustomerArrival}
                >
                  <Text style={styles.callButtonText}>INICIAR!</Text>
                </TouchableOpacity>
              )}
              <CustomerArrivalModal
                visible={isCustomerArrivalModalVisible}
                onConfirm={confirmCustomerArrival}
                onCancel={() => setIsCustomerArrivalModalVisible(false)}
                colorScheme={colorScheme}
              />
            </>
          ) : (
            <View style={styles.actionsContainer}>
              {user?.usertype === "customer" ? (
                <>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={openWhatsApp}
                  >
                    <FontAwesome name="whatsapp" size={24} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={onPressCall}
                  >
                    <MaterialIcons name="phone" size={24} color="white" />
                  </TouchableOpacity>
                  {currentBooking && currentBooking.status === "ARRIVED" && (
                    <TouchableOpacity
                      style={styles.iniciarButton}
                      onPress={handleCustomerArrival}
                    >
                      <Text style={styles.callButtonText}>INICIAR!</Text>
                    </TouchableOpacity>
                  )}
                  <CustomerArrivalModal
                    visible={isCustomerArrivalModalVisible}
                    onConfirm={confirmCustomerArrival}
                    onCancel={() => setIsCustomerArrivalModalVisible(false)}
                    colorScheme={colorScheme}
                  />
                </>
              ) : (
                <View style={{ flexDirection: "column", width: "100%" }}>
                  {(currentBooking && currentBooking.status === "ACCEPTED") ||
                  currentBooking.status === "ARRIVED" ? (
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                      }}
                    >
                      {currentBooking?.status !== "ARRIVED" && (
                        <TouchableOpacity
                          onPress={handleArrived}
                          style={[
                            styles.messageButton,
                            isButtonDisabled && { opacity: 0.5 },
                          ]} // Cambiar la opacidad si el botón está deshabilitado
                          disabled={isButtonDisabled} // Deshabilitar el botón
                        >
                          <Text style={styles.messageButtonText}>
                            REPORTAR LLEGADA
                          </Text>
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity
                        style={[styles.callButton, { flex: 1, marginLeft: 10 }]}
                        onPress={onStartTrip}
                      >
                        <Text style={styles.callButtonText}>INICIAR VIAJE</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={{ marginBottom: 10 }}>
                      <SliderButton onSlideCompleted={handleEndTrip} />
                    </View>
                  )}
                </View>
              )}
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const CarDetails = ({ currentBooking, colorScheme }) => {
  const styles = colorScheme === "dark" ? darkStyles : lightStyles; // Estilos dinámicos

  return (
    <View style={styles.carDetails}>
      <Text style={styles.carModel}>
        {currentBooking && currentBooking.car_model}
      </Text>
      <Text style={styles.plateNumber}>
        {currentBooking && currentBooking.plate_number}
      </Text>
    </View>
  );
};

const DriverInfo = ({ currentBooking, user, colorScheme }) => {
  // Default image fallback for both driver and customer
  const defaultDriverImage = require("../../assets/images/Avatar/1.png");

  // Safeguard against missing or invalid image URIs
  const driverImageSource = currentBooking?.driver_image
    ? { uri: currentBooking.driver_image }
    : defaultDriverImage;

  const customerImageSource = currentBooking?.customer_image
    ? { uri: currentBooking.customer_image }
    : defaultDriverImage;

  const carImageSource = currentBooking?.car_image
    ? { uri: currentBooking.car_image }
    : defaultDriverImage; // You can use a separate default image for car if needed
  const styles = colorScheme === "dark" ? darkStyles : lightStyles; // Estilos dinámicos

  return (
    <View style={styles.driverInfoContainer}>
      {/* Render a default image if status is "NEW", else use driver or customer image */}
      {currentBooking?.status === "NEW" ? (
        <Image source={defaultDriverImage} style={styles.driverImage} />
      ) : (
        <Image
          source={
            user?.usertype === "customer"
              ? driverImageSource
              : customerImageSource
          }
          style={styles.driverImage}
        />
      )}

      <View style={styles.driverDetails}>
        <Text style={styles.driverName}>
          {user?.usertype === "customer"
            ? currentBooking?.driver_name || "Driver Name"
            : currentBooking?.customer_name || "Customer Name"}
        </Text>

        {/* Ensure the driver rating is available and valid */}
        <Text style={styles.driverRating}>
          <FontAwesome5 name="star" size={14} color="#F20505" />{" "}
          {currentBooking?.driverRating ?? "No Rating"}
        </Text>

        <Text style={styles.driverTime}>
          {currentBooking?.arrivalTime || "Usuario Verificado"}
        </Text>
      </View>

      {/* Render car image with a fallback */}
      <Image source={carImageSource} style={styles.carImage} />
    </View>
  );
};

const CustomerArrivalModal = ({
  visible,
  onConfirm,
  onCancel,
  colorScheme,
}) => {
  const styles = colorScheme === "dark" ? darkStyles : lightStyles; // Estilos dinámicos

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onCancel}
    >
      <View style={styles.modalCenteredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalText}>
            ¿Estás seguro de que quieres iniciar el viaje sin estar presente?
          </Text>
          <View style={styles.modalButtonsContainer}>
            <TouchableOpacity
              style={styles.modalConfirmButton}
              onPress={onConfirm}
            >
              <Text style={styles.modalConfirmButtonText}>Sí</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={onCancel}
            >
              <Text style={styles.modalCancelButtonText}>No</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const ProfileImage = ({ currentBooking, user, colorScheme }) => {
  const defaultImage = require("../../assets/images/Avatar/1.png");
  const styles = colorScheme === "dark" ? darkStyles : lightStyles; // Estilos dinámicos

  const imageSource =
    user?.usertype === "customer"
      ? currentBooking?.customer_image
        ? { uri: currentBooking.customer_image }
        : defaultImage
      : currentBooking?.driver_image
      ? { uri: currentBooking.driver_image }
      : defaultImage;

  return (
    <TouchableOpacity style={styles.profileButton}>
      <Image source={imageSource} style={styles.profileImage} />
    </TouchableOpacity>
  );
};
const lightStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  header: {
    position: "absolute",
    top: 10,
    width: width - 40,
    left: 20,
    right: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 5,
    marginTop: 60,
  },
  address: {
    fontSize: 16,
    fontWeight: "bold",
  },
  profileButton: {
    backgroundColor: "#fff",
    borderRadius: 25,
    padding: 5,
    elevation: 5,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  detailsContainer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 5,
  },
  arrivalText: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  cancelButtonModal: {
    position: "absolute",
    top: 20,
    right: 20,
  },
  cancelButtonText: {
    color: "red",
    fontSize: 16,
  },
  driverInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  driverImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 10,
    elevation: 5,
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  driverRating: {
    fontSize: 16,
    color: "#777",
  },
  driverTime: {
    fontSize: 16,
    color: "#777",
  },
  carImage: {
    width: 60,
    height: 40,
    resizeMode: "contain",
    borderRadius: 50,
  },
  carDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  carModel: {
    fontSize: 16,
  },
  plateNumber: {
    fontSize: 16,
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between", // Espacio uniforme entre botones
    marginTop: 10, // Espacio superior opcional
    paddingHorizontal: 5, // Relleno lateral opcional
  },
  iniciarButton: {
    backgroundColor: "#610000", // Color verde para diferenciar el botón de iniciar
    borderRadius: 10,
    padding: 10,
    flex: 1,
    alignItems: "center",
    marginHorizontal: 5, // Espacio horizontal entre botones
    elevation: 5,
  },
  messageButton: {
    backgroundColor: "#a1a3a6",
    borderRadius: 10,
    padding: 15,
    flex: 1,
    alignItems: "center",
    marginRight: 10,
    elevation: 5,
  },
  messageButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  callButton: {
    backgroundColor: "#F20505",
    borderRadius: 10,
    padding: 10,
    flex: 1,
    alignItems: "center",
    elevation: 5,
  },
  callButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",

    marginTop: 5,
  },
  driverMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },

  header2: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  driverArrivalText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  cancelRideText: {
    fontSize: 14,
    color: "red",
  },
  driverInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  rating: {
    marginLeft: 5,
    fontSize: 14,
  },
  time: {
    marginLeft: 10,
    fontSize: 14,
    color: "grey",
  },

  carName: {
    fontSize: 14,
    fontWeight: "bold",
  },

  tripDetails: {
    marginBottom: 20,
  },
  tripTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  tripStops: {
    marginBottom: 10,
    color: "#000",
  },
  tripStopText: {
    fontSize: 14,
    marginBottom: 5,
    color: "#000",
  },
  editRideText: {
    fontSize: 14,
    color: "red",
  },
  paymentDetails: {
    marginBottom: 20,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  amount: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  paymentLogo: {
    width: 30,
    height: 20,
    marginRight: 10,
  },
  cardText: {
    fontSize: 14,
  },
  cardNumber: {
    fontSize: 14,
    color: "grey",
    marginLeft: 5,
  },
  splitCostText: {
    fontSize: 14,
    color: "red",
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  contentContainer: {
    padding: 20,
  },
  arrivalMapContainer: {
    height: 200,
    marginTop: 10,
  },
  arrivalMap: {
    ...StyleSheet.absoluteFillObject,
  },
  cancelButton: {
    position: "absolute",
    top: 20,
    right: 20,
  },

  reopenButton: {
    borderWidth: 0.4,
    borderColor: "#333",
    alignItems: "center",
    justifyContent: "center",
    width: 50,
    height: 50,
    backgroundColor: "#eee",
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 5,
  },
  unreadIndicator: {
    position: "absolute",
    top: -5,
    right: -5,
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: "green",
    borderWidth: 1,
    borderColor: "white",
  },
  reopenButtonText: {
    fontSize: 24,
    color: "#000",
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },

  confirmButton: {
    backgroundColor: "green",
    borderRadius: 5,
    padding: 10,
    marginRight: 10,
    elevation: 2,
    flex: 1,
    alignItems: "center",
  },
  iconButton: {
    backgroundColor: "#F20505", // Color de fondo del botón
    padding: 10, // Espacio interno del botón
    borderRadius: 5, // Bordes redondeados
    alignItems: "center", // Alineación centrada del contenido
    justifyContent: "center", // Alineación vertical centrada
    marginHorizontal: 5, // Espacio horizontal entre botones
  },
  confirmButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  confirmButtonModal: {
    backgroundColor: "green",
    borderRadius: 5,
    padding: 10,
    marginRight: 10,
    elevation: 2,
    flex: 1,
    alignItems: "center",
  },
  confirmButtonTextModal: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },

  cancelButtonTextModal: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  modalCenteredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    width: "120%",
  },
  modalView: {
    width: 300,
    margin: 20,
    backgroundColor: "white",
    borderRadius: 10,
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
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  modalButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalConfirmButton: {
    backgroundColor: "#F20505",
    borderRadius: 5,
    padding: 10,
    marginTop: 10,
    elevation: 2,
    alignItems: "center",
  },
  modalConfirmButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalCancelButton: {
    backgroundColor: "#f44336",
    borderRadius: 5,
    padding: 10,
    marginTop: 10,
    elevation: 2,
    alignItems: "center",
  },
  modalCancelButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  radioContainerStyle: { paddingTop: 30, marginLeft: 10 },
  radioStyle: { paddingBottom: 25 },
  cancelModalButtosContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-evenly",
    marginBottom: 10,
  },
  radioText: { fontSize: 16, color: "#000" },
  cancelModalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(22,22,22,0.8)",
  },
  cancelReasonText: {
    top: 10,
    color: "#000",

    fontSize: 20,
    alignSelf: "center",
  },
  cancelModalInnerContainer: {
    height: 400,
    width: width * 0.85,
    padding: 0,
    backgroundColor: "#fff",
    alignItems: "center",
    alignSelf: "center",
    borderRadius: 7,
  },
  cancelModalButttonStyle: { backgroundColor: "gray", borderRadius: 0 },
  buttonSeparataor: {
    height: height / 35,
    width: 0.8,
    backgroundColor: "#FFF",
    alignItems: "center",
    marginTop: 3,
  },
  cancelModalButtonContainerStyle: {
    minWidth: 140,
    alignSelf: "center",
    borderRadius: 10,
  },
  floatButton1: {
    borderWidth: 1,
    borderColor: "#F20505",
    alignItems: "center",
    justifyContent: "center",
    width: 50,
    height: 50,
    backgroundColor: "#F20505",
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 5,
    position: "relative", // Asegura que el indicador se posicione relativo al botón
    margin: 2,
  },
  hbox2: {
    width: 1,
    backgroundColor: MAIN_COLOR,
    left: 8,
    bottom: 5,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconImage: {
    width: 30,
    height: 30,
    marginBottom: 6,
  },
  tripDateText: {
    marginLeft: 6,
    color: colors.LIGHT_RED,
  },

  tripStopSeparator: {
    height: 1,
    backgroundColor: colors.GREY,
    marginVertical: 5,
  },

  amountText: {
    fontSize: 16,
    color: "#F20505",
    marginBottom: 10,
  },
  paymentMethodContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    top: 8,
  },
  paymentMethod: {
    flexDirection: "column",
    alignItems: "center",
  },
  iconText: {
    fontSize: 14,
    marginBottom: 5,
  },
  methodText: {
    fontSize: 14,
    textAlign: "center",
  },
  tripDetail: {
    fontSize: 14,
    color: "#777",
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
  modalButton: {
    borderRadius: 10,
    padding: 10,
    flex: 1,
    alignItems: "center",
    marginHorizontal: 5,
  },
  modalButtonCancel: {
    borderRadius: 10,
    padding: 10,
    flex: 1,
    alignItems: "center",
    marginHorizontal: 5,
  },
});

const darkStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  header: {
    position: "absolute",
    top: 10,
    width: width - 40,
    left: 20,
    right: 20,
    backgroundColor: "#000",
    borderRadius: 10,
    padding: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 5,
    marginTop: 60,
  },
  address: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  profileButton: {
    backgroundColor: "#fff",
    borderRadius: 25,
    padding: 5,
    elevation: 5,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  detailsContainer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "#000",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 5,
  },
  arrivalText: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  cancelButtonModal: {
    position: "absolute",
    top: 20,
    right: 20,
  },
  cancelButtonText: {
    color: "red",
    fontSize: 16,
  },
  driverInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  driverImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 10,
    elevation: 5,
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  driverRating: {
    fontSize: 16,
    color: "#777",
  },
  driverTime: {
    fontSize: 16,
    color: "#777",
  },
  carImage: {
    width: 60,
    height: 40,
    resizeMode: "contain",
    borderRadius: 50,
  },
  carDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  carModel: {
    fontSize: 16,
  },
  plateNumber: {
    fontSize: 16,
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between", // Espacio uniforme entre botones
    marginTop: 10, // Espacio superior opcional
    paddingHorizontal: 5, // Relleno lateral opcional
  },
  iniciarButton: {
    backgroundColor: "#610000", // Color verde para diferenciar el botón de iniciar
    borderRadius: 10,
    padding: 10,
    flex: 1,
    alignItems: "center",
    marginHorizontal: 5, // Espacio horizontal entre botones
    elevation: 5,
  },
  messageButton: {
    backgroundColor: "#a1a3a6",
    borderRadius: 10,
    padding: 15,
    flex: 1,
    alignItems: "center",
    marginRight: 10,
    elevation: 5,
  },
  messageButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  callButton: {
    backgroundColor: "#F20505",
    borderRadius: 10,
    padding: 10,
    flex: 1,
    alignItems: "center",
    elevation: 5,
  },
  callButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",

    marginTop: 5,
  },
  driverMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },

  header2: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: "#000",
  },
  driverArrivalText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  cancelRideText: {
    fontSize: 14,
    color: "red",
  },
  driverInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  rating: {
    marginLeft: 5,
    fontSize: 14,
  },
  time: {
    marginLeft: 10,
    fontSize: 14,
    color: "grey",
  },

  carName: {
    fontSize: 14,
    fontWeight: "bold",
  },

  tripDetails: {
    marginBottom: 20,
  },
  tripTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#fff",
  },
  tripStops: {
    marginBottom: 10,
  },
  tripStopText: {
    fontSize: 14,
    marginBottom: 5,
    color: "#fff",
  },
  editRideText: {
    fontSize: 14,
    color: "red",
  },
  paymentDetails: {
    marginBottom: 20,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#fff",
  },
  amount: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  paymentLogo: {
    width: 30,
    height: 20,
    marginRight: 10,
  },
  cardText: {
    fontSize: 14,
  },
  cardNumber: {
    fontSize: 14,
    color: "grey",
    marginLeft: 5,
  },
  splitCostText: {
    fontSize: 14,
    color: "red",
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  contentContainer: {
    padding: 20,
    backgroundColor: "#000",
  },
  arrivalMapContainer: {
    height: 200,
    marginTop: 10,
  },
  arrivalMap: {
    ...StyleSheet.absoluteFillObject,
  },
  cancelButton: {
    position: "absolute",
    top: 20,
    right: 20,
  },

  reopenButton: {
    borderWidth: 0.4,
    borderColor: "#333",
    alignItems: "center",
    justifyContent: "center",
    width: 50,
    height: 50,
    backgroundColor: "#eee",
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 5,
  },
  unreadIndicator: {
    position: "absolute",
    top: -5,
    right: -5,
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: "green",
    borderWidth: 1,
    borderColor: "white",
  },
  reopenButtonText: {
    fontSize: 24,
    color: "#000",
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },

  confirmButton: {
    backgroundColor: "green",
    borderRadius: 5,
    padding: 10,
    marginRight: 10,
    elevation: 2,
    flex: 1,
    alignItems: "center",
  },
  iconButton: {
    backgroundColor: "#F20505", // Color de fondo del botón
    padding: 10, // Espacio interno del botón
    borderRadius: 5, // Bordes redondeados
    alignItems: "center", // Alineación centrada del contenido
    justifyContent: "center", // Alineación vertical centrada
    marginHorizontal: 5, // Espacio horizontal entre botones
  },
  confirmButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  confirmButtonModal: {
    backgroundColor: "green",
    borderRadius: 5,
    padding: 10,
    marginRight: 10,
    elevation: 2,
    flex: 1,
    alignItems: "center",
  },
  confirmButtonTextModal: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },

  cancelButtonTextModal: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  modalCenteredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    width: "120%",
  },
  modalView: {
    width: 300,
    margin: 20,
    backgroundColor: "white",
    borderRadius: 10,
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
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  modalButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalConfirmButton: {
    backgroundColor: "#F20505",
    borderRadius: 5,
    padding: 10,
    marginTop: 10,
    elevation: 2,
    alignItems: "center",
  },
  modalConfirmButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalCancelButton: {
    backgroundColor: "#f44336",
    borderRadius: 5,
    padding: 10,
    marginTop: 10,
    elevation: 2,
    alignItems: "center",
  },
  modalCancelButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  radioContainerStyle: { paddingTop: 30, marginLeft: 10 },
  radioStyle: { paddingBottom: 25 },
  cancelModalButtosContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-evenly",
    marginBottom: 10,
  },
  radioText: { fontSize: 16, color: "#000" },
  cancelModalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(22,22,22,0.8)",
  },
  cancelReasonText: {
    top: 10,
    color: "#000",

    fontSize: 20,
    alignSelf: "center",
  },
  cancelModalInnerContainer: {
    height: 400,
    width: width * 0.85,
    padding: 0,
    backgroundColor: "#fff",
    alignItems: "center",
    alignSelf: "center",
    borderRadius: 7,
  },
  cancelModalButttonStyle: { backgroundColor: "gray", borderRadius: 0 },
  buttonSeparataor: {
    height: height / 35,
    width: 0.8,
    backgroundColor: "#FFF",
    alignItems: "center",
    marginTop: 3,
  },
  cancelModalButtonContainerStyle: {
    minWidth: 140,
    alignSelf: "center",
    borderRadius: 10,
  },
  floatButton1: {
    borderWidth: 1,
    borderColor: "#F20505",
    alignItems: "center",
    justifyContent: "center",
    width: 50,
    height: 50,
    backgroundColor: "#F20505",
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 5,
    position: "relative", // Asegura que el indicador se posicione relativo al botón
    margin: 2,
  },
  hbox2: {
    width: 1,
    backgroundColor: MAIN_COLOR,
    left: 8,
    bottom: 5,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconImage: {
    width: 30,
    height: 30,
    marginBottom: 6,
  },
  tripDateText: {
    marginLeft: 6,
    color: colors.LIGHT_RED,
  },

  tripStopSeparator: {
    height: 1,
    backgroundColor: colors.GREY,
    marginVertical: 5,
  },

  amountText: {
    fontSize: 16,
    color: "#F20505",
    marginBottom: 10,
  },
  paymentMethodContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    top: 8,
  },
  paymentMethod: {
    flexDirection: "column",
    alignItems: "center",
  },
  iconText: {
    fontSize: 14,
    marginBottom: 5,
  },
  methodText: {
    fontSize: 14,
    textAlign: "center",
    color: "#474747",
  },
  tripDetail: {
    fontSize: 14,
    color: "#777",
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
  modalButton: {
    borderRadius: 10,
    padding: 10,
    flex: 1,
    alignItems: "center",
    marginHorizontal: 5,
    backgroundColor: "#F20505",
  },
  modalButtonCancel: {
    borderRadius: 10,
    padding: 10,
    flex: 1,
    alignItems: "center",
    marginHorizontal: 5,
    backgroundColor: "#ffff",
  },
});

export default BookingCabScreen;
