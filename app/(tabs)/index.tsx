import React, {
  useEffect,
  useState,
  useRef,
  useMemo,
  useCallback,
} from "react";
import {
  StyleSheet,
  View,
  Text,
  Dimensions,
  Image,
  Switch,
  Platform,
  Alert,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  useColorScheme,
  Linking,
  FlatList,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/common/store";
import { updateProfile } from "@/common/actions/authactions";
import BookingsView from "@/components/BookingsView";
import {
  acceptBooking,
  listenForNewBookings,
  removeBooking,
} from "@/common/store/bookingsSlice";
import { useNavigation } from "@react-navigation/native";
import {
  getDatabase,
  onValue,
  ref,
  query,
  orderByChild,
  equalTo,
  get,
} from "firebase/database"; // Importa métodos para hacer queries
import { fetchMemberships } from "@/common/reducers/membershipSlice"; // Import the fetchMemberships action
import { differenceInDays } from "date-fns";
import { fetchKilometers } from "@/common/reducers/KilometersSlice";
import {
  listenToSettingsChanges,
  selectSettings,
} from "@/common/reducers/settingsSlice";
import tourImage from "@/assets/images/icon.png"; // Importa la imagen del tour
import * as Animatable from "react-native-animatable";
import { Ionicons, AntDesign, MaterialIcons } from "@expo/vector-icons";
import RNPickerSelect from "react-native-picker-select";
import * as ImagePicker from "expo-image-picker";
import { Button, Input } from "react-native-elements";
import { ActivityIndicator } from "react-native"; // Asegúrate de importar ActivityIndicator
import axios from "axios";
const { width } = Dimensions.get("window");
import { useRoute } from "@react-navigation/native";
import { useFocusEffect } from "@react-navigation/native";
import BottomSheet from "@gorhom/bottom-sheet"; // Importa el BottomSheet
import { database } from "../../config/SupabaseConfig"; // Asegúrate de que la ruta sea correcta
import MapSensor from "./mapaSensors";



const MapScreen = () => {
  const [currentPosition, setCurrentPosition] = useState();
  const [isEnabled, setIsEnabled] = useState(false);
  const dispatch = useDispatch();
  const [bookings, setBookings] = useState([]); // Estado local para las reservas
  const user = (useSelector((state: RootState) => state.auth.user) || {}) as any;
  const navigation = useNavigation();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [checks, setChecks] = useState({
    carExists: user?.carExists || false,
    carApproved: user?.carApproved || false,
    licenseImage: user?.licenseImage || false,
    approved: user?.approved || false,
    verifyId: user?.verifyId || false,
    imageIdApproval: user?.imageIdApproval || false,
    term: user?.term || false,
    SOATImage: user?.SOATImage || false,
  });

  const memberships = useSelector(
    (state: RootState) => state.memberships.memberships
  );
  const [showRenewBanner, setShowRenewBanner] = useState(false);
  const [showKmBanner, setShowKmBanner] = useState(false);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [activeBookingsCount, setActiveBookingsCount] = useState(0);
  const [tourVisible, setTourVisible] = useState(false);
  const settings = useSelector(selectSettings);
  const totalSteps = 9; // Total de pasos en el tour
  const [loading, setLoading] = useState(false); // Estado para controlar el loader
  const [loadingMessage, setLoadingMessage] = useState(
    "Estamos verificando tu cuenta para asegurarnos de que todo esté en orden y así protegerte a ti y a los demás usuarios. Este proceso solo tomará unos 5 minutos. Es muy importante para nosotros garantizar la seguridad tanto de nuestros usuarios como de nuestros conductores. Agradecemos tu paciencia"
  );
  const [currentStep, setCurrentStep] = useState(0);
  const colorScheme = useColorScheme(); // Hook para detectar si es modo oscuro o claro
  const [userData, setUserData] = useState({
    profile_image: user?.profile_image || null,
    mobile: user?.mobile || "",
    docType: user?.docType || "",
    verifyId: user?.verifyId || "",
    bankAccount: user?.bankAccount || "",
    city: user?.city || "",
    addres: user?.addres || "",
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [modalVisibleImage, setModalVisibleImage] = useState(false);
  const [docTypes] = useState(["CC", "Pasaporte", "CE"]);
  const [modalVisibleImageVerify, setModalVisibleImageVerify] = useState(false);
  const route = useRoute();
 // console.log(route,"aaaaahaaaa")
  const [isEmailVerified, setIsEmailVerified] = useState(Boolean(user?.emailVerified));
const [inprocess, setInprocess] = useState("");
  const styles = colorScheme === "dark" ? darkStyles : lightStyles; // Estilos dinámicos
  const stepMessages = [
    "Estás en el paso 1 de 9: Sube tu foto de perfil.",
    "Estás en el paso 2 de 9: Ingresa tu número de teléfono.",
    "Estás en el paso 3 de 9: Selecciona el tipo de documento.",
    "Estás en el paso 4 de 9: Ingresa tu número de documento.",
    "Estás en el paso 5 de 9: Ingresa tu número de DAVIPLATA.",
    "Estás en el paso 6 de 9: Porfavor Selecciona tu Ciudad",
    "Estás en el paso 7 de 9: Porfavor ingresa tu dirección",
    "Estás en el paso 8 de 9: Porfavor Actualiza tus Documentos",
    "Estás en el paso 9 de 9: Resumen de la información.",
  ];
  const cities = [
    "Bogota",
    "Medellin",
    "Cali",
    "Barranquilla",
    "Cartagena",
    "Cucuta",
    "Bucaramanga",
    "Pereira",
    "Santa Marta",
    "Ibague",
    "Pasto",
    "Manizales",
    "Neiva",
    "Villavicencio",
    "Armenia",
    "Valledupar",
    "Montería",
    "Sincelejo",
    "Popayán",
    "Floridablanca",
    "Palmira",
    "Bello",
    "Soledad",
    "Itagüí",
    "San Juan de Pasto",
    "Santa Rosa de Cabal",
    "Tuluá",
    "Yopal",
    "Barrancabermeja",
    "Tumaco",
    "Florencia",
    "Girardot",
    "Zipaquira",
    "Buenaventura",
    "Riohacha",
    "Duitama",
    "Quibdó",
    "Arauca",
    "Tunja",
    "Magangué",
    "Sogamoso",
    "Giron",
    "Chia",
    "Facatativa",
    "Rionegro",
    "Piedecuesta",
    "Ciénaga",
    "La Dorada",
    "Maicao",
    "Barrancas",
    "Calarcá",
    "Fundación",
    "La Ceja",
    "Chiquinquirá",
    "Sahagún",
    "Villa del Rosario",
    "Montelíbano",
    "Arjona",
    "Turbo",
    "Tame",
    "El Banco",
    "Sabanalarga",
    "Ipiales",
    "Tuquerres",
    "Pitalito",
    "Distracción",
    "La Plata",
    "Chiriguaná",
    "Baranoa",
    "El Carmen de Bolívar",
    "San Jacinto",
    "Santo Tomás",
    "Repelón",
    "Planeta Rica",
    "El Retén",
    "Ciénaga de Oro",
    "San Onofre",
    "María la Baja",
    "Clemencia",
    "San Juan Nepomuceno",
    "El Guamo",
    "Carmen de Bolívar",
    "Sampués",
    "San Carlos",
    "Morroa",
    "Corozal",
    "Santa Rosa de Lima",
    "Turbaco",
    "San Juan del Cesar",
    "Ayapel",
    "Cereté",
    "Momil",
    "Sincé",
    "Chinú",
    "Ovejas",
    "Tolu",
    "Tuchin",
    "Bosconia",
    "Aguachica",
    "Gamarra",
    "San Alberto",
    "Curumaní",
    "Manaure",
    "Copey",
    "San Diego",
    "La Paz",
    "Valencia",
    "San Martin",
    "San Andres",
    "Providencia",
    "San Vicente del Caguan",
    "Mocoa",
    "Puerto Asis",
  ];
  const [closestBooking, setClosestBooking] = useState(null);
  const [IsMapVisible, setIsMapVisible] = useState(true);
 // console.log("closestBooking", closestBooking);
  useEffect(() => {

    if (user) {
      setIsEmailVerified(user.emailVerified);
    }
  }, [user]);

  useFocusEffect(
    React.useCallback(() => {
      if (route.params?.openModal) {
        setTourVisible(true);
        // Reset the parameter so it doesn't trigger again
        navigation.setParams({ openModal: undefined });
      }
    }, [route.params?.openModal])
  );
  useEffect(() => {
    if (user.usertype === "driver") {
      const fields = [
        { value: user.profile_image, step: 0 },
        { value: user.mobile, step: 1 },
        { value: user.docType, step: 2 },
        { value: user.verifyId, step: 3 },
        { value: user.bankAccount, step: 4 },
        { value: user.city, step: 5 },
        { value: user.addres, step: 6 },
      ];
     // console.log("fields", fields);
     // console.log("user.emailVerified", user.emailVerified);
      const firstEmptyField = fields.find((field) => !field.value);

      if (firstEmptyField && user.emailVerified && inprocess !== "Process") {
        setTourVisible(true);
     //   setCurrentStep(firstEmptyField.step);
      } else {
        //      setTourVisible(false);
      }
    }
  }, [
    user.verifyIdImage,
    user.verifyId,
    user.docType,
    user.profile_image,
    user.mobile,
    user.bankAccount,
    user.city,
    user.addres,
    user
  ]);
  
  // TEMPORALMENTE DESHABILITADO - Pendiente configurar Supabase email verification
  /* useEffect(() => {
    if (!isEmailVerified) {
      navigation.navigate("EmailVerificationScreen"); // Navega a una pantalla de verificación de email si lo deseas
    }
  }, [isEmailVerified]); */
  
  useEffect(() => {
    if (loading) {
      const messages = [
        "Estamos verificando tu cuenta para asegurarnos de que todo esté en orden y así protegerte a ti y a los demás usuarios. Este proceso solo tomará unos 5 minutos. Es muy importante para nosotros garantizar la seguridad tanto de nuestros usuarios como de nuestros conductores. Agradecemos tu paciencia",
        "Ya casi terminamos, falta un poco...",
        "Está tardando un poco más de lo esperado, gracias por tu paciencia...",
      ];

      let messageIndex = 0;
      setLoadingMessage(messages[messageIndex]); // Muestra el primer mensaje inicialmente
      const interval = setInterval(() => {
        messageIndex = (messageIndex + 1) % messages.length;
        setLoadingMessage(messages[messageIndex]);
      }, 30000); // Cambia el mensaje cada 30 segundos

      return () => clearInterval(interval); // Limpia el intervalo al desmontar
    }
  }, [loading]);

  useEffect(() => {
    // Start listening to settings changes
    dispatch(listenToSettingsChanges());
  }, [dispatch]);

  useEffect(() => {
    if (user?.uid) {
      dispatch(fetchMemberships(user.uid));
      dispatch(fetchKilometers(user.uid));
    }
  }, [dispatch, user?.uid]);

  const activeMembership = memberships.find(
    (membership) => membership.status === "ACTIVA"
  );

  useEffect(() => {
    if (activeMembership) {
      const daysLeft = differenceInDays(
        new Date(activeMembership.fecha_terminada),
        new Date()
      );
      if (daysLeft <= 5) {
        setShowRenewBanner(true);
      }
    }

    if (user?.kilometers !== null && user?.kilometers <= 10) {
      setShowKmBanner(true);
    } else {
      setShowKmBanner(false);
    }
  }, [activeMembership, user?.kilometers]);

  useEffect(() => {
    if (!user?.carType || !user?.location) {
      // Si falta el carType o la ubicación, mostrar el modal para resolver el problema
      const hasUnresolvedIssues = Object.values(checks).some(
        (value) => value === false
      );
      console.log("entro", hasUnresolvedIssues);
      setIsModalVisible(hasUnresolvedIssues);
      return; // Detener la ejecución si falta el carType o la ubicación
    }
  
    const database = getDatabase();
    const bookingsRef = query(
      ref(database, "bookings"),
      orderByChild("status"),
      equalTo("NEW")
    );
  
    const unsubscribe = onValue(bookingsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const bookingsList = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));

  
        // Filtrar reservas por carType y distancia
        const filteredBookings = bookingsList.filter((booking) => {
          const isCarTypeMatch = booking.carType === user?.carType;
          
          // Calcular distancia solo si el pickup location está disponible
          if (isCarTypeMatch && booking.pickup) {
            // Definir el rango dinámico según bookLater
            let maxDistance = 8000; // Rango por defecto si bookLater es false (5 km)
  
            if (booking.bookLater) {
              // Obtener la diferencia en minutos desde el tripDate
              const currentTime = Date.now();
              const tripTime = new Date(booking.bookingDate).getTime();
              const timeDifferenceInMinutes = Math.floor((currentTime - tripTime) / 60000);
  
              // Rango inicial de 40 km y aumentar en 10 km cada 10 minutos, hasta un máximo de 100 km
              maxDistance = Math.min(30000 + Math.floor(timeDifferenceInMinutes / 10) * 10000, 70000); // De 40 km a 100 km máximo
            }
  
            // Calcular la distancia entre el usuario y el pickup de la reserva
            const distance = getDistanceFromLatLonInMeters(
              user.location.lat,
              user.location.lng,
              booking.pickup.lat,
              booking.pickup.lng
            );
            
            // Filtrar solo las reservas dentro del rango calculado dinámicamente
            console.log("distance", distance, "maxDistance", maxDistance);
            return distance <= maxDistance;
          }
  
          return false;
        });
  

        setIsMapVisible(true);
        setFilteredBookings(filteredBookings);
      } else {
        setFilteredBookings([]); // Estado vacío cuando no hay reservas
      }
    });
  
    return () => unsubscribe();
  }, [user?.carType, user?.location]);
  
  // Función para calcular distancia en metros
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

  useEffect(() => {
    bookings.forEach((booking) => {
      if (booking.status !== "NEW") {
        dispatch(removeBooking(booking.id));
      }
    });
  }, [bookings, dispatch]);

  // Effect to watch position changes
  const handleSwipeSuccess = async (newStatus) => {
    const updateData = {
      driverActiveStatus: newStatus,
    };

    //console.log("Despachando actualización de perfil con:", updateData);

    try {
      await dispatch(updateProfile(updateData));

    } catch (error) {
      console.error("Error actualizando estado:", error);
      Alert.alert(
        "Error",
        "No se pudo actualizar el estado. Por favor, inténtalo nuevamente."
      );
    }
  };
  const DailySavings = () => {



    const handlePress = (id) => {
      switch (id) {
        case 1:
          // Navegar a la pantalla de "Carnet"
          navigation.navigate('CarsScreen');
          break;
        case 2:
          // Navegar a la pantalla de "Reservas"
          navigation.navigate('RideList');
          break;
        case 3:
          // Abrir WhatsApp
          Linking.openURL(`https://wa.me/message/BTQOY5GZC7REF1`);
          break;
        case 4:
          // Navegar a la pantalla de "Perfil"
          navigation.navigate('Docs');
          break;
        case 5:
          // Abrir Términos y Condiciones en un navegador web
          Linking.openURL('https://tmasplus.com/terminos-y-condiciones');
          break;
        case 6:
          // Abrir Términos y Condiciones en un navegador web
          Linking.openURL('https://tmasplus.com/condiciones-recargas');
          break;
        case 7:
          // Navegar a la pantalla de "Contactos de seguridad"
          navigation.navigate('SecurityContact');
          break;
        case 8:
          // Realizar una llamada telefónica
          const call_link = Platform.OS === 'android' ? `tel:${settings.panic}` : `telprompt:${settings.panic}`;
          Linking.openURL(call_link);
          break;
        default:
          console.log('Acción no definida');
      }
    };

    const cards = [
      {
        id: 1,
        title: "🚗 ¡Información de tu vehículo!",
        subtitle: `🔍 Toca aquí para ver los detalles de tu vehículo.\nVehiculo activo: ${user.carType}\nPlaca: ${user?.vehicleNumber}`,
        image: user?.car_image ? { uri: user.car_image } : require("@/assets/images/iconos3d/12.png"),
      },
      {
        id: 2,
        title: `¡Tienes ${activeBookingsCount} ${activeBookingsCount === 1 ? 'reserva activa' : 'reservas activas'}!`,
        // Start of Selection
        // Start of Selection
        // Start of Selection
        subtitle: `¡Hola! ${closestBooking ? `Tienes una reserva para el ${new Date(closestBooking.tripdate).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}. El viaje es DESDE ${closestBooking.pickupAddress} HASTA: ${closestBooking.dropAddress}` : 'Pronto tendrás una nueva reserva'} !`,
        image: require("@/assets/images/iconos3d/45.png"),
        badge: activeBookingsCount > 0 ? {
          value: activeBookingsCount,
          color: '#FF4500'
        } : null,
        animation: 'pulse',
      },
      {
        id: 3,
        title: "¡Chatea con nosotros!",
        subtitle: "¿Necesitas ayuda? Comunícate con nosotros por WhatsApp para obtener soporte rápido y personalizado.",
        image: require("@/assets/images/iconos3d/36.png"),
      },
      {
        id: 4,
        title: "Verifica y actualiza tu perfil",
        subtitle: "En T+Plus, tu seguridad es nuestra prioridad. Realizamos un estudio de seguridad para garantizar que todo esté en orden. ¡Actualiza tu perfil con total tranquilidad!",
        image: require("@/assets/images/iconos3d/19.png"),
      },
      {
        id: 5,
        title: "Términos y condiciones",
        subtitle: "Consulta los términos y condiciones de T+Plus para conocer nuestras políticas y cómo aseguramos una experiencia segura y transparente para todos nuestros usuarios.",
        image: require("@/assets/images/iconos3d/25.png"),
      },
      {
        id: 6,
        title: "Términos y condiciones de Recarga",
        subtitle: "Consulta los términos y condiciones de T+Plus para conocer nuestras políticas sobre la recarga de dinero y cómo aseguramos una experiencia segura y transparente para todos nuestros usuarios.",

        image: require("@/assets/images/iconos3d/TerminosApp.png"),


      },
      {
        id: 7,
        title: "Acceso a contacto de seguridad",
        subtitle: "Añade contactos de confianza para que podamos notificarles en caso de emergencia. Mantén a tus seres queridos informados y seguros mientras usas T+Plus.",
        image: require("@/assets/images/iconos3d/24.png"),
      },
      {
        id: 8,
        title: "Botón de Emergencia (SOS)",
        subtitle: "En caso de emergencia, usa el botón de SOS para alertar a tus contactos de seguridad o recibir ayuda inmediata. Tu seguridad es nuestra prioridad.",
        image: require("@/assets/images/iconos3d/17.png"),
      },
    ];

    return (
      <View style={styles.containerDayli}>
        <Text style={styles.headerDayli}>T+Plus</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollContainerDayli}>
          {cards.map((card) => (
            <TouchableOpacity key={card.id} style={styles.cardDayli} onPress={() => handlePress(card.id)}>
              <Image source={card.image} style={styles.cardImageDayli} />
              <Text style={styles.cardTitleDayli}>{card.title}</Text>
              <Text style={styles.cardSubtitleDayli}>{card.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };
  useEffect(() => {
    setIsEnabled(user?.driverActiveStatus || false);
  }, [user]);

  const handleAccept = (booking) => {
   
    navigation.navigate("RideList", { booking });



    if (!activeMembership && settings.Membership && user?.walletBalance === 0) {
      Alert.alert(
        "Error",
        "No tienes una membresía activa. Debes tener una membresía activa para aceptar reservas."
      );
      return;
    }

    // Si todos los checks pasan, procedemos a aceptar la reserva
    if (!user) {
      Alert.alert("Error", "No se encontró el perfil del conductor.");
      return;
    }
    

    dispatch(acceptBooking({ booking, driverProfile: user }))
      .unwrap()
      .then(() => {
        // Enviar notificación
       
        fetch(
          "https://us-central1-treasupdate.cloudfunctions.net/sendMassNotification",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              tokens: [booking.customer_token],
              title: `¡Servicio Aceptado!`,
              body: `Hola ${booking.customer_name}, tu servicio ha sido aceptado con éxito. El conductor ${user.firstName} ${user.lastName} está listo para atenderte. Puedes comunicarte con él a través del chat de la reserva. La placa del vehículo es ${user.vehicleNumber}.`,
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
      })
      .catch((error) => {
        Alert.alert("Error", `No se pudo aceptar la reserva: ${error}`);
      });
  };

  const [lastDeclineTime, setLastDeclineTime] = useState<number | null>(null);
  const [bookingModalDecline, setBookingModalDecline] = useState(false);

  const handleDecline = () => {
    setBookingModalDecline(false); // Cierra el modal
    setLastDeclineTime(Date.now()); // Guarda el tiempo actual
  };

  useEffect(() => {
    const now = Date.now();

    if (
      filteredBookings.length > 0 &&
      (!lastDeclineTime || now - lastDeclineTime > 15000)
    ) {
      setBookingModalDecline(true); // Muestra el modal solo si han pasado más de 15 segundos
    }
  }, [filteredBookings, lastDeclineTime]);
  2;

  useEffect(() => {
    dispatch(listenForNewBookings());
  }, [dispatch]);

  //-----------------..........................................................................................................................................................................................................


  useEffect(() => {
    if (user?.driverActiveStatus && !currentPosition) {
      dispatch(updateProfile({ driverActiveStatus: true }));
      setIsEnabled(false);
    }
  }, [user?.driverActiveStatus, currentPosition, dispatch]);



  useEffect(() => {
    if (user) {
      const database = getDatabase();
      const userRef = ref(database, `users/${user.id}`);

      const unsubscribe = onValue(userRef, (snapshot) => {
        try {
          const updatedUser = snapshot.val();
          if (updatedUser) {
            dispatch(updateProfile(updatedUser));
          }
        } catch (e) {
          console.error("Error processing snapshot data:", e);
        }
      });

      return () => unsubscribe();
    }
  }, [dispatch, user]);

  const takePhoto = async (variable) => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (permissionResult.granted === false) {
      alert("Permiso para acceder a la cámara es necesario!");
      return;
    }

    const pickerResult = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (variable === "profile") {
      if (!pickerResult.canceled && pickerResult.assets.length > 0) {
        setModalVisible(false); // Cerrar el modal después de seleccionar una imagen
        const uri = pickerResult.assets[0].uri;
        setUserData({ ...userData, profile_image: uri }); // Actualiza el estado local
        // dispatch(updateProfile(user, uri)); // Llama a updateProfile con un objeto vacío y la URI
        setModalVisibleImage(false); // Cierra el modal si está abierto
      }
    } else if (variable === "verifyId") {
      if (!pickerResult.canceled && pickerResult.assets.length > 0) {
        setModalVisible(false); // Cerrar el modal después de seleccionar una imagen

        const uri = pickerResult.assets[0].uri;
        setUserData({ ...userData, verifyIdImage: uri }); // Actualiza el estado local

        setModalVisibleImageVerify(false);
      }
    }
  };

  const pickImage = async (variable) => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [5, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      if (variable === "profile") {
        setUserData({ ...userData, profile_image: uri }); // Actualiza el estado local
        setModalVisibleImage(false); // Cierra el modal si está abierto
      } else if (variable === "verifyId") {
        setModalVisible(false); // Cerrar el modal después de seleccionar una imagen

        setUserData({ ...userData, verifyIdImage: uri }); // Actualiza el estado local
        setModalVisibleImageVerify(false);
      }
    }
  };
  const handleFinishTour = async () => {
    try {
      if (!user) {
        console.warn("No hay usuario autenticado.");
        return;
      }
      setLoading(true); // Muestra el loader

      // Despachar la acción updateProfile con el userData actualizado
      //   dispatch(updateProfile({ ...userData, verifyIdImage: downloadURL }, ""));

      // Cierra el modal si está abierto
      dispatch(updateProfile({ ...userData }, userData.profile_image));
      try {
        // Realiza la llamada a la verificación en Topus con axios
        const response = await axios.post(
          "https://us-central1-treasupdate.cloudfunctions.net/getUserVerification",
          {
            doc_type: user.docType || userData.docType,
            identification: user.verifyId || userData.verifyId,
            name:
              user.firstName + " " + user.lastName ||
              userData.firstName + " " + userData.lastName,
            uid: user.uid || user.id,
          },
          {
            timeout: 300000, // 5 minutos de tiempo máximo para la solicitud
          }
        );

        const results = response.data;

        // setData(results);
        console.log("results", results);

        // Procesar los resultados para verificar entidades con paso = '2' excepto 'simit'
        let blockedTopus = false;
        let blockedReasonTopus = [];

        results.forEach((item) => {
          if (item.entidad !== "simit" && item.paso === "2") {
            blockedTopus = true;
            blockedReasonTopus.push(item.entidad);
          }
        });

        const filteredData = {
          blockedTopus: blockedTopus,
          blockedReasonTopus: blockedReasonTopus,
          securityData: [
            {
              antecedents: results,
              date: Date.now(),
              verifyId: user.verifyId,
              doc_type: user.docType || userData.docType,
              firstName: user.firstName,
              lastName: user.lastName,
            },
          ],
        };

        const success = dispatch(updateProfile(filteredData));

        if (success) {
          setLoading(false); // Muestra el loader
          setTourVisible(false); // Oculta el tour si es necesario
          console.log("Verificación completada", results);

        } else {
          console.log("Error en la verificación", results);
        }
      } catch (error) {
        console.error("Error en la verificación:", error);
        console.log("error", error);
      }

      // Cierra el modal del tour
      //setModalVisibleImageVerify(false);
    } catch (error) {
      console.error("Error al subir la imagen:", error);
      // Opcional: Puedes mostrar una alerta al usuario informando del error
      alert("Hubo un error al subir la imagen. Por favor, inténtalo de nuevo.");
    }
    // Despacha la acción updateProfile con los datos del usuario
  };
  const navigateToDocuments = (data) => {
    setInprocess(data);
    navigation.navigate("ImageGallery", { data:data  });
    setTourVisible(false);
  };
  const renderStepContent = () => {
    return (
      <Animatable.View animation="fadeIn" style={styles.stepContainer}>
        <Animatable.Text
          animation="bounceIn" // Animación más llamativa
          duration={700} // Duración más lenta para efecto suave
          style={styles.stepMessage}
          iterationCount={1} // Solo una vez al cargar
          easing="ease-in-out" // Efecto más fluido
        >
          {stepMessages[currentStep]}
        </Animatable.Text>
        {(() => {
          switch (currentStep) {
            case 0:
              return (
                <>
                  <Text style={styles.stepTitle}>Sube tu foto de perfil</Text>
                  <Text style={styles.explanatoryText}>
                    ¡Gracias por registrarte en T+Plus!
                  </Text>
                  <Text style={styles.explanatoryText}>
                    Por tu seguridad y la de los usuarios que atenderás, es
                    necesario completar los siguientes campos y datos para poder
                    iniciar a tomar servicios:
                  </Text>

                  <TouchableOpacity
                    onPress={() =>
                      Platform.OS === "android"
                        ? setModalVisibleImage(true)
                        : null
                    }
                  >
                    {userData.profile_image || "" ? (
                      <Image
                        source={{ uri: userData.profile_image || "" }}
                        style={styles.profileImage}
                      />
                    ) : (
                      <View style={styles.imagePlaceholder}>
                        <AntDesign name="camerao" size={50} color="#ccc" />
                        <Text>Subir imagen</Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  {Platform.OS === "ios" && (
                    <View style={styles.modalContainerIos}>
                      <View style={styles.modalViewIos}>
                        <TouchableOpacity
                          style={styles.botonCamera}
                          onPress={() => takePhoto("profile")}
                        >
                          <Ionicons name="camera" size={24} color="white" />
                          <Text style={styles.modalButtonText}>Tomar Foto</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.botonGallery}
                          onPress={() => pickImage("profile")}
                        >
                          <Ionicons name="images" size={24} color="white" />
                          <Text style={styles.modalButtonText}>
                            Cargar desde Dispositivo
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </>
              );
            case 1:
              return (
                <>
                  <Text style={styles.explanatoryText}>
                    Es muy importante que tengamos un número para contactarte y
                    que tus clientes también lo hagan. Recuerda que deberás
                    incluir el indicativo:
                    <Text
                      style={{
                        backgroundColor:
                          colorScheme === "dark" ? "#000" : "#D3D3D3",
                        fontStyle: "italic",
                      }}
                    >
                      ejm: +572223334455
                    </Text>
                  </Text>
                  <Text style={styles.stepTitle}>
                    Ingresa tu número de teléfono
                  </Text>
                  <Input
                    placeholder="Teléfono"
                    value={userData.mobile}
                    onChangeText={(text) =>
                      setUserData({ ...userData, mobile: text })
                    }
                    keyboardType="phone-pad"
                    leftIcon={{
                      type: "antdesign",
                      name: "phone",
                      color: "#f20505",
                    }}
                    inputStyle={styles.input}
                  />
                </>
              );
            case 2:
              return (
                <>
                  <Text style={styles.stepTitle}>
                    Selecciona el tipo de documento
                  </Text>
                  <Text style={styles.explanatoryText}>
                    En este paso nos indicarás el tipo de documento que te
                    identifica en el país en el cual resides en este momento. Lo
                    hacemos para que hagas parte de este cambio en movilidad y
                    podamos reportar tu documento completo a las aseguradoras
                    que respaldan tu movilidad:
                  </Text>
                  <View style={styles.pickerContainer}>
                    <RNPickerSelect
                      onValueChange={(itemValue) =>
                        setUserData({ ...userData, docType: itemValue })
                      }
                      items={docTypes.map((docName) => ({
                        label: docName,
                        value: docName,
                      }))}
                      placeholder={{
                        label: userData.docType
                          ? userData.docType
                          : "Seleccione un tipo de documento",
                        value: userData.docType ? userData.docType : null,
                        color: "#000",
                      }}
                      style={pickerSelectStyles}
                      useNativeAndroidPickerStyle={false}
                      Icon={() => {
                        return <AntDesign name="down" size={24} color="gray" />;
                      }}
                    />
                  </View>
                </>
              );
            case 3:
              return (
                <TouchableWithoutFeedback
                  onPress={Platform.OS === "ios" ? Keyboard.dismiss : null}
                >
                  <>
                    <Text style={styles.stepTitle}>
                      Ingresa tu número de documento
                    </Text>
                    <Text style={styles.explanatoryText}>
                      Por favor digita tu número de documento. En el caso de
                      pasaporte, escribe las letras y números tal como aparecen
                      en tu documento. Si es cédula o cédula de extranjería,
                      escribe los números sin puntos ni comas, tal como aparecen
                      en tu documento.
                    </Text>
                    <View style={styles.pickerContainer}></View>
                    <Input
                      placeholder="Número de documento"
                      value={userData.verifyId}
                      onChangeText={(text) =>
                        setUserData({ ...userData, verifyId: text })
                      }
                      keyboardType="number-pad"
                      leftIcon={{
                        type: "antdesign",
                        name: "idcard",
                        color: "#f20505",
                      }}
                      inputStyle={styles.input}
                    />
                  </>
                </TouchableWithoutFeedback>
              );
            case 4:
              return (
                <TouchableWithoutFeedback
                  onPress={Platform.OS === "ios" ? Keyboard.dismiss : null}
                >
                  <>
                    <Text style={styles.stepTitle}>
                      Ingresa tu número de DAVIPLATA
                    </Text>
                    <Text style={styles.explanatoryText}>
                      Manteniendo nuestro compromiso, tu trabajo no tendrá
                      descuentos, con nuestro aliado Daviplata tus recargas y
                      los pagos que realizaremos desde T+Plus, se harán sin
                      descuentos. Si ya cuentas con tu número Daviplata,
                      ingrésalo ahora mismo:
                    </Text>
                    <View style={styles.pickerContainer}></View>
                    <Input
                      placeholder="Daviplata"
                      value={userData.bankAccount}
                      onChangeText={(text) =>
                        setUserData({ ...userData, bankAccount: text })
                      }
                      keyboardType="number-pad"
                      leftIcon={{
                        type: "materialicons",
                        name: "account-balance",
                        color: "#f20505",
                      }}
                      inputStyle={styles.input}
                    />
                  </>
                </TouchableWithoutFeedback>
              );
            case 5:
              return (
                <>
                  <Text style={styles.stepTitle}>
                    Selecciona tu ciudad de residencia
                  </Text>
                  <Text style={styles.explanatoryText}>
                    Es muy importante que nos indiques la ciudad en la que
                    resides, para que los usuarios puedan ubicarte y así poder
                    ofrecerte servicios en tu ciudad.
                  </Text>
                  <View style={styles.pickerContainer}>
                    <RNPickerSelect
                      onValueChange={(itemValue) =>
                        setUserData({ ...userData, city: itemValue })
                      }
                      items={cities.map((cityName) => ({
                        label: cityName,
                        value: cityName,
                      }))}
                      placeholder={{
                        label: userData.city
                          ? userData.city
                          : "Seleccione una ciudad",
                        value: userData.city ? userData.city : null,
                        color: "#000",
                      }}
                      style={pickerSelectStyles}
                      useNativeAndroidPickerStyle={false}
                      Icon={() => {
                        return <AntDesign name="down" size={24} color="gray" />;
                      }}
                    />
                  </View>
                </>
              );
            case 6:
              return (
                <TouchableWithoutFeedback
                  onPress={Platform.OS === "ios" ? Keyboard.dismiss : null}
                >
                  <>
                    <Text style={styles.stepTitle}>
                      Dirección de residencia
                    </Text>
                    <Text style={styles.explanatoryText}>
                      Por requerimiento de facturación electrónica y
                      verificación de seguridad, es muy importante que nos
                      indiques tu actual dirección de residencia:
                    </Text>
                    <View style={styles.pickerContainer}></View>
                    <Input
                      placeholder="Calle 123, Ciudad"
                      value={userData.addres}
                      onChangeText={(text) =>
                        setUserData({ ...userData, addres: text })
                      }
                      //keyboardType="number-pad"
                      leftIcon={{
                        type: "materialicons",
                        name: "location-on",
                        color: "#f20505",
                      }}
                      inputStyle={styles.input}
                    />
                  </>
                </TouchableWithoutFeedback>
              );
            case 7:
              return (
                <>
                  <Text style={styles.stepTitle}>Sube tus documentos</Text>
             

                  {/* Verificar documentos faltantes */}
                  <Text style={styles.explanatoryText}>
                    Documentos faltantes:
                  </Text>
                  {!user.verifyIdImage ||
                    !user.verifyIdImageBk ||
                    !user.SOATImage ||
                    !user.licenseImage ||
                    !user.licenseImageBack ||
                    !user.cardPropImage ||
                    !user.cardPropImageBK ? (
                    <View>
                      {!user.verifyIdImage && (
                        <Text style={styles.summaryText}>
                          Documento de identidad
                        </Text>
                      )}
                      {!user.verifyIdImageBk && (
                        <Text style={styles.summaryText}>
                          Documento de identidad posterior
                        </Text>
                      )}
                      {!user.SOATImage && (
                        <Text style={styles.summaryText}>Imagen del SOAT</Text>
                      )}
                      {!user.verifyIdImageBk && (
                        <Text style={styles.summaryText}>Imagen del coche</Text>
                      )}
                      {!user.licenseImage && (
                        <Text style={styles.summaryText}>
                          Licencia de conducir
                        </Text>
                      )}
                      {!user.licenseImageBack && (
                        <Text style={styles.summaryText}>
                          Licencia de conducir trasera
                        </Text>
                      )}
                      {!user.cardPropImage && (
                        <Text style={styles.summaryText}>
                          Tarjeta de propiedad
                        </Text>
                      )}
                      {!user.cardPropImageBK && (
                        <Text style={styles.summaryText}>
                          Tarjeta de propiedad trasera
                        </Text>
                      )}
                      <Button
                        title={
                          loading ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            "Ir A Documentos"
                          )
                        }
                        buttonStyle={styles.finishButton}
                        onPress={() => navigateToDocuments("Process")}
                        disabled={
                          !!user.verifyIdImage &&
                          !!user.verifyIdImageBk &&
                          !!user.SOATImage &&
                          !!user.licenseImage &&
                          !!user.licenseImageBack &&
                          !!user.cardPropImage &&
                          !!user.cardPropImageBK
                        }
                      />
                    </View>
                  ) : (
                    <Text style={styles.allDocumentsUpToDate}>
                      Todos tus documentos están al día Puedes continuar.
                    </Text>
                  )}
                </>
              );
            case 8:
              return (
                <>
                  <Text style={styles.stepTitle}>Resumen</Text>
                  <Text style={styles.explanatoryText}>
                    Por favor verifica que la información registrada corresponda
                    y sea conforme a la realidad, ya que con ella haremos una
                    verificación en línea, para garantizar la seguridad de los
                    usuarios como la de nuestros conductores, si quieres
                    revisarlas ingresa al siguiente link:
                  </Text>
                  <TouchableOpacity
                    style={styles.linkButton}
                    onPress={() =>
                      Linking.openURL(
                        "https://tmasplus.com/politica-de-privacidad"
                      )
                    }
                  >
                    <Text style={styles.linkButton}>
                      https://tmasplus.com/politica-de-privacidad
                    </Text>
                  </TouchableOpacity>
                  <Text style={styles.summaryText}>
                    Teléfono: {userData.mobile}
                  </Text>
                  <Text style={styles.summaryText}>
                    Tipo de Documento: {userData.docType}
                  </Text>
                  <Text style={styles.summaryText}>
                    N° Documento: {userData.verifyId}
                  </Text>
                  <Text style={styles.summaryText}>
                    Daviplata: {userData.bankAccount}
                  </Text>
                  <Text style={styles.summaryText}>
                    Ciudad: {userData.city}
                  </Text>

                  {userData.verifyIdImage && (
                    <Image
                      source={{ uri: userData.verifyIdImage }}
                      style={styles.profileImage}
                    />
                  )}
                  <Button
                    title={
                      loading ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        "Finalizar"
                      )
                    }
                    buttonStyle={styles.finishButton}
                    onPress={handleFinishTour}
                    disabled={
                      !userData.mobile ||
                      !userData.docType ||
                      !userData.verifyId ||
                      !userData.bankAccount ||
                      !userData.city
                    }
                  />
                </>
              );
            default:
              return null;
          }
        })()}
      </Animatable.View>
    );
  };
  const pickerSelectStyles = StyleSheet.create({
    inputIOS: {
      fontSize: 16,
      paddingVertical: 12,
      paddingHorizontal: 10,
      borderWidth: 1,
      borderColor: "#a1a3a6",
      borderRadius: 4,
      color: "black",
      paddingRight: 30, // Para asegurar que el texto no se superponga al icono
    },
    inputAndroid: {
      fontSize: 16,
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: "#a1a3a6",
      borderRadius: 8,
      color: "black",
      paddingRight: 30, // Para asegurar que el texto no se superponga al icono
    },
  });

  const fetchBalanceBookings = async () => {
    if (!user || !user.id) {
      console.warn("Usuario no autenticado.");
      return;
    }

   // console.log("Iniciando fetchBalanceBookings para el usuario:", user.id);

    try {
      const bookingsRef = ref(database, "bookings");
      const statuses = ["ACCEPTED", "REACHED", "NEW", "STARTED", "ARRIVED"];
      let balance = 0;

      //console.log("Estados a consultar:", statuses);

      // Crear todas las consultas de manera concurrente
      const queries = statuses.map((status) => {
        const q = query(
          bookingsRef,
          orderByChild("driver_status"),
          equalTo(`${user.id}_${status}`)
        );
      //  console.log(`Creando consulta para estado: ${status}`);
        return q;
      });

      // Ejecutar todas las consultas en paralelo
     // console.log("Ejecutando consultas concurrentes...");
      const snapshots = await Promise.all(queries.map((q) => get(q)));
    //  console.log("Consultas completadas. Procesando resultados...");

      snapshots.forEach((snapshot, index) => {
        const status = statuses[index];
        //console.log( `Procesando snapshot para estado "${status}":`, snapshot.exists() );

        if (snapshot.exists()) {
          const bookings = snapshot.val();
          console.log(
            `Bookings encontrados para estado "${status}":`,
            bookings
          );

          Object.entries(bookings).forEach(
            ([bookingId, booking]: [string, any]) => {
              //console.log(`Procesando booking ID: ${bookingId}`, booking);

              if (
                booking.trip_cost !== undefined &&
                booking.trip_cost !== null
              ) {
                const tripCost = parseFloat(booking.trip_cost);
                if (!isNaN(tripCost)) {
                  console.log(
                    `Trip cost válido para booking ID ${bookingId}: ${tripCost}`
                  );
                  balance += tripCost;
                } else {
                  console.warn(
                    `trip_cost inválido para booking ID: ${bookingId}`,
                    booking.trip_cost
                  );
                }
              } else {
                console.warn(
                  `trip_cost no está definido para booking ID: ${bookingId}`,
                  booking
                );
              }
            }
          );
        } else {
        //  console.log(`No se encontraron bookings para estado "${status}".`);
        }
      });

      const roundedBalance = Math.round(balance * 100) / 100;
      setBalance(roundedBalance);
     // console.log("Balance calculado:", roundedBalance);
    } catch (error) {
      console.error("Error al obtener las ganancias:", error);
    }
  };

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      await fetchBalanceBookings();
    };

    fetchData();
  }, [dispatch, user?.uid, user?.uid]);

  useEffect(() => {
    if (!user || !user.id) return;

    const bookingsRef = ref(database, "bookings");
    const statuses = ["ACCEPTED", "COMPLETE"];
    let balance = 0;

    const listeners = statuses.map((status) => {
      const bookingsQuery = query(
        bookingsRef,
        orderByChild("driver_status"),
        equalTo(`${user.id}_${status}`)
      );
      return onValue(bookingsQuery, (snapshot) => {
        let currentBalance = 0;
        if (snapshot.exists()) {
          const bookings = snapshot.val();
          Object.values(bookings).forEach((booking: any) => {
            const tripCost = parseFloat(booking.trip_cost);
            if (!isNaN(tripCost)) {
              currentBalance += tripCost;
            }
          });
        }
        // Actualizar el balance acumulado
        setBalance((prevBalance) => prevBalance + currentBalance);
      });
    });

    // Limpieza de listeners al desmontar el componente
    return () => {
      listeners.forEach((unsub) => unsub());
    };
  }, [user?.id]);

  //-----------------..........................................................................................................................................................................................................

  const [balance, setBalance] = useState(0);

 
    useEffect(() => {
      const fetchActiveBookings = async () => {
        try {
  
          const bookingsRef = ref(database, 'bookings');
          const statuses = ['ACCEPTED', 'REACHED', 'NEW', 'STARTED', 'ARRIVED'];
          let count = 0;
          let closestBooking = null;
          let closestDifference = Number.MAX_SAFE_INTEGER;
          const currentTime = Date.now();
  
          for (const status of statuses) {
            const bookingsQuery = query(
              bookingsRef,
              orderByChild("driver_status"),
              equalTo(`${user.id}_${status}`)
            );
  
            const snapshot = await get(bookingsQuery);
            if (snapshot.exists()) {
              const bookings = snapshot.val();
              count += Object.keys(bookings).length;
  
              Object.values(bookings).forEach((booking: any) => {
                if (booking.tripdate) {
                  const difference = Math.abs(new Date(booking.tripdate).getTime() - currentTime);
                  if (difference < closestDifference) {
                    closestDifference = difference;
                    closestBooking = booking;
                  }
                }
              });
            }
          }
  
          setActiveBookingsCount(count);
          setClosestBooking(closestBooking);
        } catch (error) {
  
          console.error('Error al obtener las reservas activas:', error);
  
        }
      };
  
      fetchActiveBookings();
  
  

    const fetchBalanceBookings = async () => {
      if (!user || !user.id) {
        console.warn("Usuario no autenticado.");
        return;
      }

      //console.log("Iniciando fetchBalanceBookings para el usuario:", user.id);

      try {
        const bookingsRef = ref(database, "bookings");
        const statuses = ["ACCEPTED", "REACHED", "NEW", "STARTED", "ARRIVED"];
        let balance = 0;

        //console.log("Estados a consultar:", statuses);

        // Crear todas las consultas de manera concurrente
        const queries = statuses.map((status) => {
          const q = query(
            bookingsRef,
            orderByChild("driver_status"),
            equalTo(`${user.id}_${status}`)
          );
       //   console.log(`Creando consulta para estado: ${status}`);
          return q;
        });

        // Ejecutar todas las consultas en paralelo
      //  console.log("Ejecutando consultas concurrentes...");
        const snapshots = await Promise.all(queries.map((q) => get(q)));
       // console.log("Consultas completadas. Procesando resultados...");

        snapshots.forEach((snapshot, index) => {
          const status = statuses[index];
         // console.log( `Procesando snapshot para estado "${status}":`,snapshot.exists());

          if (snapshot.exists()) {
            const bookings = snapshot.val();
            console.log(
              `Bookings encontrados para estado "${status}":`,
              bookings
            );

            Object.entries(bookings).forEach(
              ([bookingId, booking]: [string, any]) => {
                console.log(`Procesando booking ID: ${bookingId}`, booking);

                if (
                  booking.trip_cost !== undefined &&
                  booking.trip_cost !== null
                ) {
                  const tripCost = parseFloat(booking.trip_cost);
                  if (!isNaN(tripCost)) {
                    console.log(
                      `Trip cost válido para booking ID ${bookingId}: ${tripCost}`
                    );
                    balance += tripCost;
                  } else {
                    console.warn(
                      `trip_cost inválido para booking ID: ${bookingId}`,
                      booking.trip_cost
                    );
                  }
                } else {
                  console.warn(
                    `trip_cost no está definido para booking ID: ${bookingId}`,
                    booking
                  );
                }
              }
            );
          } else {
          //  console.log(`No se encontraron bookings para estado "${status}".`);
          }
        });

        const roundedBalance = Math.round(balance * 100) / 100;
        setBalance(roundedBalance);
      //  console.log("Balance calculado:", roundedBalance);
      } catch (error) {
        console.error("Error al obtener las ganancias:", error);
      }
    };

    fetchBalanceBookings();
  }, []);

  // Ref para controlar el Bottom Sheet
  const bottomSheetRef = useRef<BottomSheet>(null);

  // Definir los snap points (porcentajes de la pantalla)
  const snapPoints = useMemo(() => ["17%", "50%", "75%", "95%"], ["100%"]);

  // Función para abrir el Bottom Sheet
  const openBottomSheet = () => {
    bottomSheetRef.current?.expand();
  };

  const sos = () => {
    Alert.alert(
      "SOS",
      "¿Desea llamar a emergencia?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "ok",
          onPress: () => {
            const call_link =
              Platform.OS === "android"
                ? `tel:${settings.panic}`
                : `telprompt:${settings.panic}`;
            Linking.openURL(call_link);
          },
        },
      ],
      { cancelable: false }
    );
  };

  const sugerencias = [
    {
      id: "1",
      nombre: "Carnet",
      icono: require("@/assets/images/iconos3d/43.png"),
      route: "Carnet",
    },
    {
      id: "2",
      nombre: "SOS",
      icono: require("@/assets/images/iconos3d/42.png"),
      route: "SOS",
    },
    {
      id: "3",
      nombre: "Vehículo",
      icono: require("@/assets/images/iconos3d/12.png"),
      route: "CarsScreen",
    },
    {
      id: "4",
      nombre: "Soporte",
      icono: require("@/assets/images/iconos3d/46.png"),
      route: "Soporte",
    },
  ];

  const promociones = [
    {
      id: "1",
      titulo: "Reservas Activas",
      descripcion:
        activeBookingsCount === 0
          ? "No tienes Reservas por el momento"
          : `¡Tienes ${activeBookingsCount} ${
              activeBookingsCount === 1 ? "reserva activa" : "reservas activas"
            }!  `,
      image: require("@/assets/images/iconos3d/11.png"),
      route: "RideList",
    },
    {
      id: "2",
      titulo: "Kilometros",
      descripcion: `¡Tienes ${user?.kilometers} kilometros! `,
      image: require("@/assets/images/iconos3d/16.png"),
      route: "Wallet",
    },
    {
      id: "3",
      titulo: "Ganancias",
      descripcion: `Has ganado $${balance.toLocaleString()} pesos! `,
      image: require("@/assets/images/iconos3d/33.png"),
      route: "Wallet",
    },
    {
      id: "5",
      titulo: "Membresia",
      descripcion: activeMembership
        ? `Tu membresía caduca el ${activeMembership.fecha_terminada}`
        : "No tienes membresía",
      image: require("@/assets/images/iconos3d/8.png"),
      route: "Memberships",
    },
  ];

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

  const HorizontalImageBanner = () => {
    const banners = [
      {
        image: require("@/assets/images/Combuscol.png"),
        url: "https://tmasplus.com/beneficios",
      },
      {
        image: require("@/assets/images/Fitvision.png"),
        url: "https://tmasplus.com/beneficios",
      },

    ];

    const handlePress = (url) => {
      Linking.openURL(url);
    };

    return (
      <View style={styles.containerHorizontal}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {banners.map((banner, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handlePress(banner.url)}
            >
              <Image source={banner.image} style={styles.bannerImage} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.container}>

     
      <View style={[styles.infoContainer, styles.infoContainerDark]}>
        <Text
          style={[
            styles.statusText,
            {
              color: user?.driverActiveStatus
                ? colorScheme === "dark"
                  ? "#FF6B6B" // Rojo claro para modo oscuro
                  : "red"
                : colorScheme === "dark"
                ? "#A9A9A9" // Gris claro para modo oscuro
                : "gray",
            },
          ]}
        >
          {user?.driverActiveStatus ? "Activo" : "Descanso"} {"  "}
        </Text>
        <TouchableOpacity
          style={{
            backgroundColor: user?.driverActiveStatus ? "#F20505" : "#767577",
            borderRadius: 20,
            padding: 10,
            alignItems: "center",
            justifyContent: "center",
            width: 50,
            height: 30,
          }}
          onPress={() => {
            const newStatus = !user?.driverActiveStatus;
            handleSwipeSuccess(newStatus);
            setIsEnabled(newStatus);
          }}
        >
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 15,
              width: 25,
              height: 25,
              transform: [{ translateX: user?.driverActiveStatus ? 20 : 0 }],
              transition: "transform 0.2s ease-in-out",
            }}
          />
        </TouchableOpacity>
      </View>

      {IsMapVisible ? (
        <>
          <MapSensor currentPosition={currentPosition} />
          <View style={[styles.infoContainer, styles.infoContainerDark]}>
            <Text
              style={[
                styles.statusText,
                {
                  color: user?.driverActiveStatus
                    ? colorScheme === "dark"
                      ? "#FF6B6B" // Rojo claro para modo oscuro
                      : "red"
                    : colorScheme === "dark"
                      ? "#A9A9A9" // Gris claro para modo oscuro
                      : "gray",
                },
              ]}
            >
              {user?.driverActiveStatus ? "Activo" : "Descanso"} {"  "}
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: user?.driverActiveStatus ? "#F20505" : "#767577",
                borderRadius: 20,
                padding: 10,
                alignItems: "center",
                justifyContent: "center",
                width: 50,
                height: 30,
              }}
              onPress={() => {
                const newStatus = !user?.driverActiveStatus;
                handleSwipeSuccess(newStatus);
                setIsEnabled(newStatus);
              }}
            >
              <View
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 15,
                  width: 25,
                  height: 25,
                  transform: [{ translateX: user?.driverActiveStatus ? 20 : 0 }],
                  transition: "transform 0.2s ease-in-out",
                }}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.bookNow} onPress={() => setIsMapVisible(false)} >
            <Text style={styles.infoText}>Novedades {user?.cartype}</Text>
          </TouchableOpacity>
        </>
      ) : (
        <ScrollView style={styles.bottomSheetContent}>
          {/* Contenedor para la flecha y el saludo */}
          <View >
            {/* Flecha hacia atrás */}
            <TouchableOpacity
              onPress={() => setIsMapVisible(true)} // Cambia a mostrar el mapa
            >
              <Ionicons name="arrow-back" size={24} color={colorScheme === "dark" ? "#fff" : "#000"} />
            </TouchableOpacity>

            {/* Mensaje de saludo */}
            <View style={styles.greetingContainer}>
              <View style={styles.notificationCard}>
                <Text style={styles.notificationText}>
                  👋🏻{' '}
                  {(() => {
                    const currentHour = new Date().getHours();
                    let greeting;
                    if (currentHour < 12) {
                      greeting = "Buenos días";
                    } else if (currentHour < 18) {
                      greeting = "Buenas tardes";
                    } else {
                      greeting = "Buenas noches";
                    }
                    return `${greeting}, ${user?.firstName} ${user?.lastName}`;
                  })()}
                </Text>
              </View>
            </View>
          </View>

          {/* Sugerencias de servicios */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sugerencias</Text>
          </View>
          <FlatList
            horizontal
            data={sugerencias}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => navigation.navigate(item.route)}>
                <View style={styles.suggestionCard}>
                  <Image source={item.icono} style={styles.suggestionIcon} />
                  <Text style={styles.suggestionText}>{item.nombre}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
          {DailySavings()}

          {/* Promociones o beneficios */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Novedades</Text>
          </View>
          {promociones.map((promo) => (
            <TouchableOpacity
              key={promo.id}
              style={styles.promoCard}
              onPress={() => navigation.navigate(promo.route)}
            >
              <Image source={promo.image} style={styles.promoImage} />
              <View>
                <Text style={styles.promoTitle}>{promo.titulo} →</Text>
                <Text style={styles.promoDescription}>{promo.descripcion}</Text>
              </View>
            </TouchableOpacity>
          ))}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Beneficios</Text>
          </View>
            <HorizontalImageBanner />
      

          {/* Botón para cerrar el BottomSheet */}
          <TouchableOpacity
            onPress={() => setIsMapVisible(true)}
            style={[styles.closeButton, { marginTop: 20, alignSelf: "center" }]}
          >
            <Text style={styles.closeButtonText}>Cerrar</Text>
          </TouchableOpacity>
        </ScrollView>

      )}


      {/* Modal de Tour */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={tourVisible}
        onRequestClose={() => setTourVisible(!tourVisible)}
      >
        <TouchableWithoutFeedback
          onPress={Platform.OS === "ios" ? Keyboard.dismiss : null}
        >
          <ScrollView contentContainerStyle={styles.tourContainer}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Image source={tourImage} style={styles.tourImage} />
              {loading ? (
                <Text style={[styles.tourText, { flexShrink: 1 }]}>
                  {loadingMessage}
                </Text>
              ) : currentStep === 5 ? (
                <Text style={[styles.tourText, { flexShrink: 1 }]}>
                  🎉¡Felicidades!🎉 Estas a un paso de completar tu registro en
                  T+Plus.
                </Text>
              ) : (
                <Text style={[styles.tourText, { flexShrink: 1 }]}>
                  Hola, bienvenido a T+Plus, asegúrate de completar los
                  siguientes campos y podrás empezar a tomar servicios.
                </Text>
              )}
            </View>

            {renderStepContent()}

            {/* Botones de navegación */}
            <View style={styles.navigationButtons}>
              {currentStep > 0 && (
                <TouchableOpacity
                  style={styles.prevButton}
                  onPress={() => setCurrentStep(currentStep - 1)}
                >
                  <Text style={styles.prevButtonText}>Anterior</Text>
                </TouchableOpacity>
              )}
              {currentStep < totalSteps - 1 && (
                <TouchableOpacity
                  style={styles.nextButton}
                  onPress={() => setCurrentStep(currentStep + 1)}
                >
                  <Text style={styles.nextButtonText}>Siguiente</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </Modal>
      <Modal
        transparent={true}
        animationType="slide"
        visible={modalVisibleImage}
        onRequestClose={() => setModalVisibleImage(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>Selecciona una opción</Text>
            <TouchableOpacity
              style={styles.botonCamera}
              onPress={() => takePhoto("profile")}
            >
              <Ionicons name="camera" size={24} color="white" />
              <Text style={styles.modalButtonText}>Tomar Foto</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.botonGallery}
              onPress={() => pickImage("profile")}
            >
              <Ionicons name="images" size={24} color="white" />
              <Text style={styles.modalButtonText}>
                Cargar desde Dispositivo
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setModalVisibleImage(false)}
            >
              <MaterialIcons name="cancel" size={24} color="#f20505" />
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal
        transparent={true}
        animationType="slide"
        visible={modalVisibleImageVerify}
        onRequestClose={() => setModalVisibleImageVerify(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>Selecciona una opción</Text>
            <TouchableOpacity
              style={styles.botonCamera}
              onPress={() => takePhoto("verifyId")}
            >
              <Ionicons name="camera" size={24} color="white" />
              <Text style={styles.modalButtonText}>Tomar Foto</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.botonGallery}
              onPress={() => pickImage("verifyId")}
            >
              <Ionicons name="images" size={24} color="white" />
              <Text style={styles.modalButtonText}>
                Cargar desde Dispositivo
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setModalVisibleImageVerify(false)}
            >
              <MaterialIcons name="cancel" size={24} color="#f20505" />
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {!activeMembership &&
        settings.Membership &&
        user?.carType !== "TREAS-X" && user.profile_image && user.mobile && user.docType && user.verifyId && user.bankAccount && user.city && user.addres&& user.emailVerified && (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>
              ¡No tienes una membresía activa!
            </Text>
            <Text style={styles.bannerSubText}>
              Obtén una membresía para disfrutar de beneficios exclusivos.
            </Text>
            <TouchableOpacity
              style={styles.createMembershipButton}
              onPress={() =>
                navigation.navigate("ChosePlan", { mode: "membership" })
              }
            >
              <Text style={styles.createMembershipButtonText}>
                Obtener Membresía
              </Text>
            </TouchableOpacity>
          </View>
        )}

      {settings.membership_TreasX &&
        !activeMembership &&
        user?.carType === "TREAS-X" && user.profile_image && user.mobile && user.docType && user.verifyId && user.bankAccount && user.city && user.addres&& user.emailVerified && (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>
              ¡No tienes una membresía activa!
            </Text>
            <Text style={styles.bannerSubText}>
              Obtén una membresía para disfrutar de beneficios exclusivos.
            </Text>
            <TouchableOpacity
              style={styles.createMembershipButton}
              onPress={() =>
                navigation.navigate("ChosePlan", { mode: "membership" })
              }
            >
              <Text style={styles.createMembershipButtonText}>
                Obtener Membresía
              </Text>
            </TouchableOpacity>
          </View>
        )}

      {showRenewBanner && settings.Membership && (
        <View style={styles.renewBanner}>
          <Image
            source={require("@/assets/images/iconos3d/4.png")}
            style={{ height: 70, width: 100, margin: 20 }}
          />
          <Text style={styles.renewBannerText}>
            Tu membresía está a punto de expirar. ¡Renueva ahora para seguir
            disfrutando de los beneficios!
          </Text>
          <View style={styles.renewBannerButtons}>
            <TouchableOpacity
              style={styles.renewButton}
              onPress={() =>
                navigation.navigate("ChosePlan", { mode: "membership" })
              }
            >
              <Text style={styles.renewButtonText}>Renovar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowRenewBanner(false)}
            >
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {showKmBanner &&
        settings.KilimetrsWallet &&
        user?.carType === "TREAS-X" && (
          <View style={styles.renewBanner}>
            <Image
              source={require("@/assets/images/iconos3d/5.png")}
              style={{ height: 80, width: 100, margin: 20 }}
            />
            <Text style={styles.kmBannerText}>
              ¡Te quedan menos de 10 km!{"\n"}
              Recarga ahora para seguir disfrutando de los viajes.
            </Text>
            <View style={styles.kmBannerButtons}>
              <TouchableOpacity
                style={styles.rechargeButton}
                onPress={() =>
                  navigation.navigate("ChosePlan", { mode: "kms" })
                }
              >
                <Text style={styles.createMembershipButtonText}>
                  Recargar Kilómetros
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowKmBanner(false)}
              >
                <Text style={styles.createMembershipButtonText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

      {bookingModalDecline && (
        <BookingsView
          bookings={filteredBookings}
          onAccept={handleAccept}
          onDecline={handleDecline} // Botón de "ignorar" cerrará el modal
        />
      )}

  
    </View>
  );
};

const lightStyles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  infoContainer: {
    position: "absolute",
    top: 20,
    right: 10,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    padding: 10,
    borderRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  infoText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  bookNow: {
    position: "absolute",
    bottom: 20,
    left: (width - 90) / 2,
    width: 240,
    height: 55,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 23,
    padding: 20,
    shadowColor: "gray",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
  },
  banner: {
    padding: 20,
    backgroundColor: "#f8d7da",
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  bannerText: {
    fontSize: 18,
    color: "#721c24",
    fontWeight: "bold",
    marginBottom: 10,
  },
  bannerSubText: {
    fontSize: 16,
    color: "#721c24",
    marginBottom: 20,
    textAlign: "center",
  },
  createMembershipButton: {
    backgroundColor: "#f20505",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  createMembershipButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  renewBanner: {
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
    backgroundColor: "#ffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
    margin: 20,
  },
  renewBannerText: {
    fontSize: 16,
    color: "#856404",
    marginBottom: 10,
    textAlign: "center",
  },
  renewBannerButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  renewButton: {
    backgroundColor: "#f20505",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginRight: 10,
  },
  renewButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  closeButton: {
    backgroundColor: "#333",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 10,
    marginBottom: 50
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
    padingBottom: 50
  },
  kmBanner: {
    padding: 20,
    backgroundColor: "#ffff",
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  kmBannerText: {
    fontSize: 16,
    color: "#f24452",
    marginBottom: 10,
    textAlign: "center",
  },
  headerContainer: {
    flexDirection: 'column', // Organiza los elementos en columna
    alignItems: 'flex-start', // Alinea los elementos al inicio (izquierda)
    // Añade padding para espaciar los elementos del borde
  },
  backButton: {
    marginBottom: 10, // Espacio debajo de la flecha
  },
  greetingContainer: {
    width: '100%', // Asegura que el contenedor ocupe todo el ancho disponible
    marginTop: 10,
    elevation:5
  },
  notificationCard: {
    backgroundColor: "#ff9797",
    padding: 16,
    borderRadius: 8,
    width: '100%', // Opcional: establece el ancho al 100% del contenedor
  },
  notificationText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
  },
  kmBannerButtons: {
    flexDirection: "column", // Cambiado a 'column' para que los botones sean verticales
    justifyContent: "space-between",
    alignItems: "center", // Opcional: Centrar los botones horizontalmente
    width: "100%",
  },
  rechargeButton: {
    backgroundColor: "#f20505",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginRight: 10,
  },
  rechargeButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  tourContainer: {
    flex: 1,
    paddingTop: 50,
    backgroundColor: "#fff",
  },
  tourImage: {
    width: 200,
    height: 100,
    resizeMode: "contain",
    marginBottom: 20,
  },
  tourText: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#000",
  },
  navigationButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  prevButton: {
    backgroundColor: "#cccccc",
    width: 150,
    borderRadius: 10,
    padding: 10,
  },
  prevButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  nextButton: {
    backgroundColor: "#f20505",
    width: 150,
    padding: 10,
    borderRadius: 10,
  },
  nextButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  stepContainer: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  stepMessage: {
    fontSize: 22, // Aumentar tamaño para más impacto
    fontWeight: "600", // Peso mediano para no saturar
    marginBottom: 20, // Más espacio entre elementos
    textAlign: "center",
    color: "#ff6f61", // Color más suave pero llamativo
    textShadowColor: "rgba(0, 0, 0, 0.15)", // Sombras más suaves
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 8, // Sombra más dispersa
    letterSpacing: 0.8, // Espaciado entre letras para mejor legibilidad
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  explanatoryText: {
    fontSize: 16,
    color: "#000",
    textAlign: "center",
    marginVertical: 10,
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 10,
    marginBottom: 10,
  },
  imagePlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 10,
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  modalContainerIos: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalViewIos: {
    width: 300,
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
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
  pickerContainer: {
    width: "100%",
    marginTop: 20,
  },
  modalButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  input: {
    height: 50,
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 20,
    fontSize: 16,
    marginTop: 10,
  },
  linkButton: {
    color: "#f20505",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    textDecorationLine: "underline",
  },
  summaryText: {
    fontSize: 18,
    marginVertical: 5,
  },
  finishButton: {
    backgroundColor: "#f20505",
    marginTop: 20,
    width: 200,
    borderRadius: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    width: 300,
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
    fontSize: 16,
  },
  cancelButtonText: {
    color: "#f20505",
    fontSize: 16,
    fontWeight: "bold",
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
    width: "100%",
    justifyContent: "center",
    elevation: 5,
    borderWidth: 1,
    borderColor: "#f20505",
  },
  bottomSheetContent: {
    padding: 16,
    backgroundColor: "#f5f5f5",
  },

  notificationLink: {
    color: "#007aff",
    fontWeight: "bold",
  },
  section: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  viewAll: {
    color: "#007aff",
  },
  suggestionCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    elevation: 5,
    margin:10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  suggestionIcon: {
    width: 40,
    height: 40,
    marginBottom: 8,
  },
  suggestionText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  promoCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  promoImage: {
    width: 100,
    height: 100,
    marginRight: 16,
    borderRadius: 8,
  },
  promoTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  promoDescription: {
    fontSize: 14,
    color: "#555",
  },

  containerHorizontal: {
    marginVertical: 5,
  },
  bannerImage: {
    width: 300,
    height: 150,
    borderRadius: 10,
    marginRight: 10,
    elevation: 5
  },
  containerDayli: {
    marginVertical: 20,
    paddingHorizontal: 10,
  },
  headerDayli: {
    color: "#000",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  scrollContainerDayli: {
    flexDirection: "row",

  },
  cardDayli: {
    backgroundColor: "#fff",
    borderRadius: 15,
    width: 200,
    marginRight: 15,
    padding: 10,
  },
  cardImageDayli: {
    width: "70%",
    height: 100,
    borderRadius: 10,
    marginBottom: 10,
    alignSelf: "center",
  },
  cardTitleDayli: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
  },
  cardSubtitleDayli: {
    color: "#a1a1a1",
    fontSize: 14,
    marginTop: 5,
  },
  backButton: {
    position: "absolute",
    top: 40,
    left: 20,
    zIndex: 10, // Para asegurarse de que esté por encima de otros elementos
  },
});
const darkStyles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  infoContainer: {
    position: "absolute",
    top: 20,
    right: 10,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    padding: 10,
    borderRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  infoText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  bookNow: {
    position: "absolute",
    bottom: 20,
    left: (width - 90) / 2,
    width: 240,
    height: 55,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 23,
    padding: 20,
    shadowColor: "gray",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
  },
  banner: {
    padding: 20,
    backgroundColor: "#f8d7da",
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  bannerText: {
    fontSize: 18,
    color: "#721c24",
    fontWeight: "bold",
    marginBottom: 10,
  },
  bannerSubText: {
    fontSize: 16,
    color: "#721c24",
    marginBottom: 20,
    textAlign: "center",
  },
  createMembershipButton: {
    backgroundColor: "#f20505",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  createMembershipButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  renewBanner: {
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
    backgroundColor: "#ffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
    margin: 20,
  },
  renewBannerText: {
    fontSize: 16,
    color: "#856404",
    marginBottom: 10,
    textAlign: "center",
  },
  renewBannerButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  renewButton: {
    backgroundColor: "#f20505",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginRight: 10,
  },
  renewButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  closeButton: {
    backgroundColor: "#333",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 10,
    marginBottom: 50
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  kmBanner: {
    padding: 20,
    backgroundColor: "#ffff",
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  kmBannerText: {
    fontSize: 16,
    color: "#f24452",
    marginBottom: 10,
    textAlign: "center",
  },
  kmBannerButtons: {
    flexDirection: "column", // Cambiado a 'column' para que los botones sean verticales
    justifyContent: "space-between",
    alignItems: "center", // Opcional: Centrar los botones horizontalmente
    width: "100%",
  },
  headerContainer: {
    flexDirection: 'column', // Organiza los elementos en columna
    alignItems: 'flex-start', // Alinea los elementos al inicio (izquierda)
    padding: 10, // Añade padding para espaciar los elementos del borde
  },
  backButton: {
    marginBottom: 10, // Espacio debajo de la flecha
  },
  greetingContainer: {
    width: '100%', // Asegura que el contenedor ocupe todo el ancho disponible
    marginTop: 10,
  },

  notificationText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
  },
  rechargeButton: {
    backgroundColor: "#f20505",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginRight: 10,
  },
  rechargeButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  tourContainer: {
    flex: 1,
    paddingTop: 50,
    backgroundColor: "#474747",
  },
  tourImage: {
    width: 200,
    height: 100,
    resizeMode: "contain",
    marginBottom: 20,
    borderRadius: 100,
  },
  tourText: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#fff",
  },
  navigationButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  prevButton: {
    backgroundColor: "#cccccc",
    width: 150,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#f20505",
    padding: 10,
  },
  prevButtonText: {
    color: "#f20505",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    alignSelf: "center",
    alignItems: "center",
  },
  nextButton: {
    backgroundColor: "#f20505",
    width: 150,
    padding: 10,
    borderRadius: 10,
  },
  nextButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  stepContainer: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  stepMessage: {
    fontSize: 22, // Aumentar tamaño para más impacto
    fontWeight: "600", // Peso mediano para no saturar
    marginBottom: 20, // Más espacio entre elementos
    textAlign: "center",
    color: "#ff6f61", // Color más suave pero llamativo
    textShadowColor: "rgba(0, 0, 0, 0.15)", // Sombras más suaves
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 8, // Sombra más dispersa
    letterSpacing: 0.8, // Espaciado entre letras para mejor legibilidad
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#fff",
  },
  explanatoryText: {
    fontSize: 16,
    color: "#D7D7D7",
    textAlign: "center",
    marginVertical: 10,
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 10,
    marginBottom: 10,
  },
  imagePlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 10,
    backgroundColor: "#707070",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  modalContainerIos: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalViewIos: {
    width: 300,
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
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
  pickerContainer: {
    width: "100%",
    marginTop: 20,
  },
  modalButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  input: {
    height: 50,

    borderRadius: 10,
    paddingHorizontal: 20,
    fontSize: 16,
    marginTop: 10,
    color: "#fff",
  },
  linkButton: {
    color: "#f20505",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    textDecorationLine: "underline",
  },
  summaryText: {
    fontSize: 18,
    marginVertical: 5,
    color: "#fff",
  },
  finishButton: {
    backgroundColor: "#f20505",
    marginTop: 20,
    width: 200,
    borderRadius: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    width: 300,
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
    fontSize: 16,
  },
  cancelButtonText: {
    color: "#f20505",
    fontSize: 16,
    fontWeight: "bold",
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
    width: "100%",
    justifyContent: "center",
    elevation: 5,
    borderWidth: 1,
    borderColor: "#f20505",
  },
  bottomSheetContent: {
    padding: 16,
    backgroundColor: "#474747", // Darker background for Bottom Sheet
  },

  notificationCard: {
    backgroundColor: "#4f0000", // Dark red for notifications
    padding: 16,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  notificationText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffffff", // White text for better contrast
  },
  notificationLink: {
    color: "#1e90ff", // Bright blue for links
    fontWeight: "bold",
  },
  section: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff", // White text for section titles
  },
  viewAll: {
    color: "#1e90ff", // Bright blue for 'View All' links
  },
  suggestionCard: {
    backgroundColor: "#333333", // Dark background for suggestion cards
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  suggestionIcon: {
    width: 40,
    height: 40,
    marginBottom: 8,
  },
  suggestionText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#ffffff", // White text for suggestions
  },
  promoCard: {
    flexDirection: "row",
    backgroundColor: "#000", // Dark background for promo cards
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    elevation: 5,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  promoImage: {
    width: 100,
    height: 100,
    marginRight: 16,
    borderRadius: 8,
  },
  promoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffffff", // White text for promo titles
  },
  promoDescription: {
    fontSize: 14,
    color: "#cccccc", // Light gray for promo descriptions
  },
  statusText: {
    fontSize: 16,
    fontWeight: "bold",
    top: 3,
    marginRight: 10,
  },

  infoContainerDark: {
    backgroundColor: "#545454", // Modo oscuro
  },

  containerHorizontal: {
  },
  bannerImage: {
    width: 300,
    height: 150,
    borderRadius: 10,
    marginRight: 10,
    elevation:5
  },
  containerDayli: {
    marginVertical: 20,
    paddingHorizontal: 10,
  },
  headerDayli: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  scrollContainerDayli: {
    flexDirection: "row",
  },
  cardDayli: {
    backgroundColor: "#1c1c1e",
    borderRadius: 15,
    width: 200,
    marginRight: 15,
    padding: 10,
  },
  cardImageDayli: {
    width: "70%",
    height: 100,
    borderRadius: 10,
    marginBottom: 10,
    alignSelf: "center",

  },
  cardTitleDayli: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  cardSubtitleDayli: {
    color: "#a1a1a1",
    fontSize: 14,
    marginTop: 5,
  },
  backButton: {
    position: "absolute",

    left: 20,
    zIndex: 10, // Para asegurarse de que esté por encima de otros elementos
  },
});

export default MapScreen;
