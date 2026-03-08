import React, { useState, useRef, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Image,
  StatusBar,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  useColorScheme,
  Linking,  // Importamos useColorScheme para detectar el modo

} from "react-native";
import Mapbox, { MapboxStyles, GYROSCOPE_CONFIG } from '@/config/MapboxConfig';
import MapView, { Marker } from 'react-native-maps';
import * as Location from "expo-location";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import markerIcon from "@/assets/images/green_pin.png";
import { RootState } from "@/common/store";
import { useSelector } from "react-redux";
import {
  listenToSettingsChanges, 
  selectSettings,
} from "@/common/reducers/settingsSlice";
import { useDispatch } from "react-redux";
import { fetchPromos } from "@/common/actions/promoactions";
import { debounce } from "lodash"; // Importa debounce
import { useFocusEffect } from "@react-navigation/native"; // Importa useFocusEffect
import { API_KEY, getMapboxAccessToken } from '@/config/AppConfig'; // Asegúrate de importar la clave API
import { Ionicons } from "@expo/vector-icons";
import supabase from '@/config/SupabaseConfig';

import tourImage from "@/assets/images/icon.png"; // Importa la imagen del tour
import RNPickerSelect from "react-native-picker-select";

import * as Animatable from "react-native-animatable";
type Props = NativeStackScreenProps<any>;
import { Button, Input } from "react-native-elements";
import { AntDesign, MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { updateProfile } from "@/common/actions/authactions";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { getUserVerification } from "@/common/topus-integration";
import { ActivityIndicator } from "react-native"; // Asegúrate de importar ActivityIndicator
import axios from "axios";
const GOOGLE_MAPS_APIKEY_PROD = API_KEY; // Asignar la clave API
const CustomerMap = ({ navigation }: Props) => {
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [origin, setOrigin] = useState<any>(null);
  const [destination, setDestination] = useState<any>(null);
 // console.log(destination, "destination")
  const mapRef = useRef<MapView>(null);
  const user = (useSelector((state: RootState) => state.auth.user) || {}) as any;
  const savedAddresses = useSelector(
    (state: RootState) => state.savedAddresses
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [addresses, setAddresses] = useState([]);
  const [newAddress, setNewAddress] = useState("");
  const settings = useSelector(selectSettings);
  const promos = useSelector((state: RootState) => state.promodata?.promos || []);
  const dispatch = useDispatch();

  const colorScheme = useColorScheme(); // Hook para detectar si es modo oscuro o claro
  const [isEmailVerified, setIsEmailVerified] = useState(Boolean(user?.emailVerified));

  const [requestCount, setRequestCount] = useState(0); // Contador de peticiones
  const [searchText, setSearchText] = useState(""); // Estado para el texto de búsqueda
  const [focus, setFocus] = useState("origin"); // Estado para controlar el foco
  const originAutocompleteRef = useRef(null);
  const destinationAutocompleteRef = useRef(null);
  const [tourVisible, setTourVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [modalVisibleImage, setModalVisibleImage] = useState(false);
 // console.log(modalVisibleImage, "status")
  const [userData, setUserData] = useState({
    profile_image: user?.profile_image || "",
    mobile: user?.mobile || "",
    docType: user?.docType || "",
    verifyId: user?.verifyId || "",
    verifyIdImage: user?.verifyIdImage || "",
  });
  const [docTypes] = useState(["CC", "Pasaporte", "CE"]);
  const customStyles = {
    stepIndicatorSize: 30,
    currentStepIndicatorSize: 40,
    separatorStrokeWidth: 2,
    currentStepStrokeWidth: 3,
    stepStrokeCurrentColor: "#f20505",
    stepStrokeWidth: 3,
    stepStrokeFinishedColor: "#f20505",
    stepStrokeUnFinishedColor: "#aaaaaa",
    separatorFinishedColor: "#f20505",
    separatorUnFinishedColor: "#aaaaaa",
    stepIndicatorFinishedColor: "#f20505",
    stepIndicatorUnFinishedColor: "#ffffff",
    stepIndicatorCurrentColor: "#ffffff",
    stepIndicatorLabelFontSize: 15,
    currentStepIndicatorLabelFontSize: 15,
    stepIndicatorLabelCurrentColor: "#f20505",
    stepIndicatorLabelFinishedColor: "#ffffff",
    stepIndicatorLabelUnFinishedColor: "#aaaaaa",
    labelColor: "#999999",
    labelSize: 13,
    currentStepLabelColor: "#f20505",
  };
  const [modalVisibleImageVerify, setModalVisibleImageVerify] = useState(false);
  const totalSteps = 6; // Total de pasos en el tour
  const [uriImage, setUriImage] = useState("");
  // Array de mensajes para cada paso
  const stepMessages = [
    "Estás en el paso 1 de 6: ",
    "Estás en el paso 2 de 6: ",
    "Estás en el paso 3 de 6: ",
    "Estás en el paso 4 de 6: ",
    "Estás en el paso 5 de 6: ",
    "Estás en el paso 6 de 6: ",
  ];
  const [loading, setLoading] = useState(false); // Estado para controlar el loader
  const [loadingMessage, setLoadingMessage] = useState("Estamos verificando tu cuenta para asegurarnos de que todo esté en orden y así protegerte a ti y a los demás usuarios. Este proceso solo tomará unos 5 minutos. Es muy importante para nosotros garantizar la seguridad tanto de nuestros usuarios como de nuestros conductores. Agradecemos tu paciencia");
  
  // TEMPORALMENTE DESHABILITADO - Pendiente configurar Supabase email verification
  /* useEffect(() => {
    if (!isEmailVerified) {
      navigation.navigate("EmailVerificationScreen"); // Navega a una pantalla de verificación de email si lo deseas
    }
  }, [isEmailVerified]); */
  useEffect(() => {
    if (loading) {
      const messages = [
        "Estamos verificando tu cuenta para asegurarnos de que todo esté en orden y así protegerte a ti y a los demás usuarios. Este proceso solo tomará unos 5 minutos. Es muy importante para nosotros garantizar la seguridad tanto de nuestros usuarios como de nuestros conductores. Agradecemos tu paciencia.",
        "Ya casi terminamos, falta poco...",
        "Está tardando un poco más de lo esperado. Gracias por tu paciencia..."
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
    const fields = [
      { value: user.profile_image, step: 0 },
      { value: user.mobile, step: 1 },
      { value: user.docType, step: 2 },
      { value: user.verifyId, step: 3 },
      { value: user.verifyIdImage, step: 4 }
    ];
   // console.log(user.verifyIdImage, "fields");
    const firstEmptyField = fields.find(field => !field.value);

    if (firstEmptyField && user.emailVerified) {
      setTourVisible(true);
    } else {
      //      setTourVisible(false);
    }
  }, [
    user.verifyIdImage,
    user.verifyId,
    user.docType,
    user.profile_image,
    user.mobile,
    user
  ]); // Este useEffect se activa cada vez que cambian user.verifyIdImage, user.verifyId, user.docType, user.profile_image o user.mobile




  const sessionTokenOriginRef = useRef(null);
  const sessionTokenDestinationRef = useRef(null);


  const [isMapVisible, setIsMapVisible] = useState(false); // Nuevo estado para controlar la visibilidad del mapa
  const [buttonsVisible, setButtonsVisible] = useState(true);
  const [activeBookingsCount, setActiveBookingsCount] = useState(0);
  const [type, setType] = useState(null);
  const [routeGeometry, setRouteGeometry] = useState<any>(null);
  const suggestions = [
    { id: 1, image: require("@/assets/images/TREAS-E.png"), label: "TREAS-E", description: "Servicio Especial" },
    { id: 2, image: require("@/assets/images/TREAS-X.png"), label: "TREAS-X", description: "Vehículo Particular" },
    { id: 3, image: require("@/assets/images/TREAS-Van.png"), label: "TREAS-Van", description: "Van 11 Pax" },
    { id: 4, image: require("@/assets/images/TREAS-T.png"), label: "TREAS-T", description: "Taxi" },

  ];
 // console.log(destination, "dest")

  useEffect(() => {
    dispatch(listenToSettingsChanges());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchPromos());
  }, [dispatch]);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Permission to access location was denied");
        return;
      }

      // Get initial position
      try {
        const initialLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setLatitude(initialLocation.coords.latitude);
        setLongitude(initialLocation.coords.longitude);
        setOrigin({
          latitude: initialLocation.coords.latitude,
          longitude: initialLocation.coords.longitude,
          title: "Mi ubicación actual",
        });
        if (mapRef.current) {
          mapRef.current.animateToRegion({
            latitude: initialLocation.coords.latitude,
            longitude: initialLocation.coords.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }, 1000);
        }
      } catch (error) {
        console.log("Error getting initial location:", error);
      }

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000,
          distanceInterval: 50,
        },
        (location) => {
          setLatitude(location.coords.latitude);
          setLongitude(location.coords.longitude);
          setOrigin({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            title: "Mi ubicación actual",
          });
          if (mapRef.current) {
            mapRef.current.animateToRegion({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }, 1000);
          }
        }
      );

      return () => {
        if (subscription) {
          subscription.remove();
        }
      };
    })();
  }, []);
  useEffect(() => {
    const fetchActiveBookings = async () => {
      try {
        if (!user?.id) {
          setActiveBookingsCount(0);
          return;
        }

        const statuses = ['ACCEPTED', 'REACHED', 'NEW', 'STARTED', 'ARRIVED'];

        const compositeStatuses = statuses.map((status) => `${user.id}_${status}`);

        const { count, error } = await supabase
          .from('bookings')
          .select('id', { count: 'exact', head: true })
          .eq('customer', user.id)
          .in('customer_status', compositeStatuses);

        if (error) {
          console.error('Error fetching active bookings from Supabase:', error.message);
          setActiveBookingsCount(0);
          return;
        }

        setActiveBookingsCount(count ?? 0);
      } catch (error) {
        console.error('Error fetching active bookings:', error);
      }
    };

    fetchActiveBookings();
  }, [user?.id]);
  const handleLocationSelect = (
    data: any,
    details: any = null,
    type: string
  ) => {

    const { lat, lng } = details.geometry.location;
    if (type === "origin") {
      setOrigin({
        latitude: lat,
        longitude: lng,
        title: data.description,
      });
    //  console.log("Origin:", origin);
      setRequestCount((prevCount) => prevCount + 1);
      originAutocompleteRef.current?.setAddressText(data.description);
      // Incrementa el contador
      //console.log("Total de peticiones a la API:", requestCount + 1); // Log de la cantidad de peticiones
    } else if (type === "destination") {
      setDestination({
        latitude: lat,
        longitude: lng,
        title: data.description,
      });
     // console.log("Destination:", destination);
      setRequestCount((prevCount) => prevCount + 1); // Incrementa el contador
     // console.log("Total de peticiones a la API:", requestCount + 1); // Log de la cantidad de peticiones
      destinationAutocompleteRef.current?.setAddressText(data.description);
    }
  };

  useEffect(() => {
    if (origin && destination) {
      handleBookNowPress(); // Navega automáticamente cuando ambas ubicaciones están seleccionadas
    }
  }, [origin, destination]);

  useEffect(() => {
    const fetchRoute = async () => {
      if (!origin || !destination) {
        setRouteGeometry(null);
        return;
      }

      try {
        const token = getMapboxAccessToken();
        const coordinates = `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`;
        const directionsUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}`;

        const response = await axios.get(directionsUrl, {
          params: {
            geometries: 'geojson',
            overview: 'full',
            access_token: token,
          },
        });

        const geometry = response?.data?.routes?.[0]?.geometry;
        if (geometry?.coordinates?.length) {
          setRouteGeometry({
            type: 'Feature',
            geometry,
            properties: {},
          });
        } else {
          setRouteGeometry(null);
        }
      } catch (error) {
        console.error('Error fetching Mapbox route:', error);
        setRouteGeometry(null);
      }
    };

    fetchRoute();
  }, [origin, destination]);

  const renderFavoriteButtons = () => {
    const favoriteAddresses = user?.savedAddresses
      ? Object.values(user.savedAddresses).filter(
        (address) => address.isFavorite
      )
      : [];
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.favoriteScroll}
      >
        {favoriteAddresses.map((address) => (
          <TouchableOpacity
            key={address.id} // Asegúrate de que 'address.id' sea único
            style={styles.favoriteButton}
            onPress={() =>
              handleLocationSelect(
                { description: address.description },
                {
                  geometry: {
                    location: { lat: address.lat, lng: address.lng },
                  },
                },
                focus
              )
            }
          >
            <Text style={styles.favoriteButtonText}>{address.typeAddress}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };
  const verifyUserInTopus = async (data) => {

    return await getUserVerification({
      doc_type: data.docType,
      identification: data.verifyId,
      name: data.firstName,
    });
  };
  const handleFinishTour = async () => {
    try {
      
      
  
      if (!user) {
        console.warn("No hay usuario autenticado.");
        return;
      }
  
      setLoading(true);
  
      const storage = getStorage();
      const imageRef = storageRef(storage, `users/${user.uid}/verifyIdImage.jpg`);
  
      try {
        const response = await fetch(userData.verifyIdImage);
        const blob = await response.blob();
  
        // Subir la imagen a Firebase Storage
        await uploadBytes(imageRef, blob);
        blob.close && blob.close(); // Liberar el blob después de usarlo
  
        const downloadURL = await getDownloadURL(imageRef);
        setUserData({ ...userData, verifyIdImage: downloadURL });
  
        dispatch(updateProfile({ ...userData, verifyIdImage: downloadURL }, userData.profile_image));
  
      } catch (error) {
        console.error("Error al subir la imagen de verificación:", error);
        throw error;
      }
  
      try {
        const response = await axios.post(
          "https://us-central1-treasupdate.cloudfunctions.net/getUserVerification",
          {
            doc_type: user.docType || userData.docType,
            identification: user.verifyId || userData.verifyId,
            name: `${user.firstName || userData.firstName} ${user.lastName || userData.lastName}`,
            uid: user.uid,
          },
          { timeout: 300000 }
        );
  
        const results = response.data;
        let blockedTopus = false;
        let blockedReasonTopus = [];
  
        results.forEach((item) => {
          if (item.entidad !== "simit" && item.paso === "2") {
            blockedTopus = true;
            blockedReasonTopus.push(item.entidad);
          }
        });
  
        const filteredData = {
          blockedTopus,
          blockedReasonTopus,
          securityData: [
            {
              antecedents: results,
              date: Date.now(),
              verifyId: user.verifyId || userData.verifyId,
              doc_type: user.docType || userData.docType,
              firstName: user.firstName || userData.firstName,
              lastName: user.lastName || userData.lastName,
            },
          ],
        };
  
        const success = dispatch(updateProfile(filteredData));
        if (success) {
          setLoading(false);
          setTourVisible(false);
        }
  
      } catch (error) {
        console.error("Error en la verificación:", error);
      }
  
    } catch (error) {
      console.error("Error general en handleFinishTour:", error);
      alert("Hubo un error al subir la imagen. Por favor, inténtalo de nuevo.");
    }
  };


  const handleBookNowPress = async () => {
    if (origin && destination) {
      try {
        /*  const address = await getAddressFromCoordinates(
            origin.latitude,
            origin.longitude
          );
  */
        const updatedOrigin = {
          ...origin,
          title: origin.title,
        };

        navigation.navigate("BookingS", {
          origin,
          destination,
          type
        });
      } catch (error) {
        console.error("Error al obtener la dirección", error);
      }
    } else {
      setModalMessage("Por favor seleccione origen y destino.");
      setModalVisible(true);
    }
  };


  const centerMap = () => {
    if (mapRef.current && latitude && longitude) {
      mapRef.current.animateToRegion({
        latitude,
        longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }, 1000);
    }
  };

  // Función para manejar el cambio en el texto de búsqueda
  const handleSearchTextChange = (text: string) => {
    setSearchText(text);
    setRequestCount(0); // Reinicia el contador de peticiones
  };
  const pickProfileImage = async () => {
    let permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      alert("Permiso para acceder a la galería es necesario!");
      return;
    }

    let pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!pickerResult.cancelled) {
      setUserData({ ...userData, profile_image: pickerResult.uri });
    }
  };
  const pickVerifyIdImage = async () => {
    let permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      alert("Permiso para acceder a la galería es necesario!");
      return;
    }

    let pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!pickerResult.cancelled) {
      setUserData({ ...userData, verifyIdImage: pickerResult.uri });
    }
  };
  // Función debounced para manejar la selección de ubicación
  const debouncedHandleLocationSelect = debounce(
    (data: any, details: any, type: string) => {
      handleLocationSelect(data, details, type);
    },
    1000
  ); // Ajusta el tiempo de debounce según sea necesario
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
      quality: 0.7,
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
                  <Text style={styles.explanatoryText}>¡Gracias por registrarte en T+Plus!</Text>
                  <Text style={styles.explanatoryText}>
                    Por tu seguridad y la de los conductores que te atenderán, es necesario completar los siguientes campos y datos para poder proceder con todas tus solicitudes.                  </Text>

                  <TouchableOpacity>
                    {userData.profile_image || uriImage ? (
                      <Image
                        source={{ uri: userData.profile_image || uriImage }}
                        style={styles.profileImage}
                      />
                    ) : (
                      <View style={styles.imagePlaceholder}>
                        <AntDesign name="camerao" size={50} color="#ccc" />
                        <Text>Subir imagen</Text>
                      </View>
                    )}
                  </TouchableOpacity>

                 
                    
                    

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
                          <Text style={styles.modalButtonText}>Cargar desde Dispositivo</Text>
                        </TouchableOpacity>
                    
                    
                  


                </>
              );
            case 1:
              return (
                <>
                  <Text style={styles.explanatoryText}>
                    Es muy importante que tengamos un número para contactarte. Recuerda que deberás incluir el indicativo."                    <Text style={{ backgroundColor: colorScheme === "dark" ? "#000" : "#D3D3D3", fontStyle: "italic" }}>ejm: +572223334455</Text>
                  </Text>
                  <Text style={styles.stepTitle}>Ingresa tu número de teléfono</Text>
                  <Input
                    placeholder="Teléfono"
                    value={userData.mobile}
                    onChangeText={(text) => setUserData({ ...userData, mobile: text })}
                    keyboardType="phone-pad"
                    leftIcon={{ type: "antdesign", name: "phone", color: "#f20505" }}
                    inputStyle={styles.input}
                  />
                </>
              );
            case 2:
              return (
                <>
                  <Text style={styles.stepTitle}>Selecciona el tipo de documento</Text>
                  <Text style={styles.explanatoryText}>

                    En este paso nos indicarás el tipo de documento que te identifica en el país en el cual resides en este momento. Lo hacemos para que formes parte de este cambio en movilidad y podamos reportar tu documento completo a las aseguradoras que respaldan tu movilidad.</Text>
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
                        label: userData.docType ? userData.docType : "Seleccione un tipo de documento",
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
                <TouchableWithoutFeedback onPress={Platform.OS === "ios" ? Keyboard.dismiss : null}>
                  <>
                    <Text style={styles.stepTitle}>Ingresa tu número de documento</Text>
                    <Text style={styles.explanatoryText}>
                      Por favor, digita tu número de documento. En el caso de pasaporte, ingresa las letras y números tal como aparecen en tu documento. Si es cédula o cédula de extranjería, ingresa los números sin puntos ni comas, tal como aparecen en tu documento.                    </Text>
                    <View style={styles.pickerContainer}></View>
                    <Input
                      placeholder="Número de documento"
                      value={userData.verifyId}
                      onChangeText={(text) => setUserData({ ...userData, verifyId: text })}
                      keyboardType="number-pad"
                      leftIcon={{ type: "antdesign", name: "idcard", color: "#f20505" }}
                      inputStyle={styles.input}
                    />
                  </>
                </TouchableWithoutFeedback>
              );
            case 4:
              return (
                <>
                  <Text style={styles.stepTitle}>Sube tu documento de identidad</Text>
                  <Text style={styles.explanatoryText}>
                    Por favor toma foto del frontal de tu documento de identidad, para poder verificar que eres tú y poder atender tus solicitudes con toda la seguridad que esperas:                  </Text>
                  <TouchableOpacity >
                    {userData.verifyIdImage || uriImage ? (
                      <Image
                        source={{ uri: userData.verifyIdImage || uriImage }}
                        style={styles.profileImage}
                      />
                    ) : (
                      <View style={styles.imagePlaceholder}>
                        <AntDesign name="idcard" size={50} color="#ccc" />
                        <Text>Subir imagen</Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  
   

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
                          <Text style={styles.modalButtonText}>Cargar desde Dispositivo</Text>
                        </TouchableOpacity>
              
                  
                </>
              );
            case 5:
              return (
                <>
                  <Text style={styles.stepTitle}>Resumen</Text>
                  <Text style={styles.explanatoryText}>Por favor verifica que la información registrada corresponda y sea conforme a la realidad, ya que con ella haremos una verificación en línea, para garantizar tu seguridad y la de nuestros conductores, si quieres revisarlas ingresa al siguiente link:

                  </Text>
                  {/* <TouchableOpacity style={styles.linkButton} onPress={() => Linking.openURL('https://treasapp.com/politica-de-privacidad')}>
                    <Text style={styles.linkButton}>
                      https://treasapp.com/politica-de-privacidad
                    </Text>
                  </TouchableOpacity> */}
                  <Text style={styles.summaryText}>Teléfono: {userData.mobile}</Text>
                  <Text style={styles.summaryText}>
                    Tipo de Documento: {userData.docType}
                  </Text>
                  <Text style={styles.summaryText}>ID Verificado: {userData.verifyId}</Text>
                  {userData.verifyIdImage && (
                    <Image
                      source={{ uri: userData.verifyIdImage }}
                      style={styles.profileImage}
                    />
                  )}
                  <Button
                    title={loading ? <ActivityIndicator size="small" color="#fff" /> : "Finalizar"}
                    buttonStyle={styles.finishButton}
                    onPress={handleFinishTour}
                    disabled={!userData.mobile || !userData.docType || !userData.verifyId || !userData.verifyIdImage}
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

  const styles = colorScheme === "dark" ? darkStyles : lightStyles; // Estilos dinámicos

  // Limpia los campos de autocompletado al navegar a otra pantalla
  useFocusEffect(
    React.useCallback(() => {
      return () => {
        // Restablece los estados de origen y destino
        setOrigin(null);
        setDestination(null);
        setSearchText(""); // Limpia el texto de búsqueda
        setRequestCount(0); // Reinicia el contador de peticiones
        setAddresses([]); // Limpia las direcciones guardadas si es necesario

      };
    }, [])
  );
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

  const renderSuggestions = () => {


    return (
      <>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.suggestionsScroll}
        >
          {suggestions.map((suggestion) => (
            <TouchableOpacity
              key={suggestion.id}
              style={styles.suggestionButton}
              onPress={() => {
                setType(suggestion.id);
                console.log(`Seleccionado: ${suggestion.label}`);
                setIsMapVisible(true)
              }}
            >
              <Image
                source={suggestion.image}
                style={{ width: 50, height: 50 }}
                resizeMode="contain"
              />
              <Text style={styles.suggestionButtonText}>{suggestion.label}</Text>
              <Text style={styles.suggestionDescription}>{suggestion.description}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </>
    );
  };


  const DailySavings = () => {



    const handlePress = (id) => {
      switch (id) {
        case 1:
          // Navegar a la pantalla de "Carnet"
          navigation.navigate('Carnet');
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
          // Navegar a la pantalla de "Contactos de seguridad"
          navigation.navigate('SecurityContact');
          break;
        case 7:
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
        title: "¡Usa tu carnet!",
        subtitle: "Presenta tu carnet de T+plus para identificarte fácilmente ante los conductores. ¡Es tu acceso seguro y confiable!",
        image: require("@/assets/images/iconos3d/43.png"),
      },
      {
        id: 2,
        title: "¡Tus Reservas Activas!",
        subtitle: `¡Tienes ${activeBookingsCount} ${activeBookingsCount === 1 ? 'reserva activa' : 'reservas activas'}! Toca aquí para ver los detalles y estar al día con tus viajes programados e inmediatos ¡No te pierdas ninguna aventura!`,
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
        subtitle: "En T+plus, tu seguridad es nuestra prioridad. Realizamos un estudio de seguridad para garantizar que todo esté en orden. ¡Actualiza tu perfil con total tranquilidad!",
        image: require("@/assets/images/iconos3d/19.png"),
      },
      {
        id: 5,
        title: "Términos y condiciones",
        subtitle: "Consulta los términos y condiciones de T+plus para conocer nuestras políticas y cómo aseguramos una experiencia segura y transparente para todos nuestros usuarios.",
        image: require("@/assets/images/iconos3d/25.png"),
      },
      {
        id: 6,
        title: "Acceso a contacto de seguridad",
        subtitle: "Añade contactos de confianza para que podamos notificarles en caso de emergencia. Mantén a tus seres queridos informados y seguros mientras usas T+plus.",
        image: require("@/assets/images/iconos3d/24.png"),
      },
      {
        id: 7,
        title: "Botón de Emergencia (SOS)",
        subtitle: "En caso de emergencia, usa el botón de SOS para alertar a tus contactos de seguridad o recibir ayuda inmediata. Tu seguridad es nuestra prioridad.",
        image: require("@/assets/images/iconos3d/17.png"),
      },
    ];

    return (
      <View style={styles.containerDayli}>
        <Text style={styles.headerDayli}>T+plus</Text>
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
  const SavedAddresses = () => {
    // Obtener las direcciones guardadas del usuario
    const savedAddresses = Object.values(user.savedAddresses || {});
    // Filtrar las direcciones favoritas
    const favoriteAddresses = savedAddresses.filter((address: any) => address.isFavorite);
    // Obtener las últimas dos direcciones guardadas
    const lastTwoAddresses = savedAddresses.slice(-2);

    return (
      <>
        {/* Contenedor de direcciones favoritas (con el estilo de SavedAddresses) */}
        {favoriteAddresses.length > 0 && (
          <View style={styles.containerAddress}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {favoriteAddresses.map((address: any, index: number) => (
                <TouchableOpacity
                  key={index}
                  style={styles.addressCard}
                  onPress={() => {
                    handleLocationSelect(
                      { description: address.description },
                      {
                        geometry: {
                          location: { lat: address.lat, lng: address.lng },
                        },
                      },
                      "destination"
                    );
                    setIsMapVisible(true);
                  }}
                >
                  <Ionicons name="star-outline" size={24} color="#fff" style={styles.icon} />
                  <View>
                    <Text style={styles.addressTitle}>
                      {address.typeAddress || address.description.split(",")[0]}
                    </Text>
                    <Text style={styles.addressSubtitle}>{address.description}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Contenedor de últimas dos direcciones guardadas */}
        <View style={styles.containerAddress}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {lastTwoAddresses.map((address: any, index: number) => (
              <TouchableOpacity
                key={index}
                style={styles.addressCard}
                onPress={() => {
                  handleLocationSelect(
                    { description: address.description },
                    {
                      geometry: {
                        location: { lat: address.lat, lng: address.lng },
                      },
                    },
                    "destination"
                  );
                  setIsMapVisible(true);
                }}
              >
                <Ionicons name="time-outline" size={24} color="#fff" style={styles.icon} />
                <View>
                  <Text style={styles.addressTitle}>
                    {address.nameAddressFavorite || address.description.split(",")[0]}
                  </Text>
                  <Text style={styles.addressSubtitle}>{address.description}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </>
    );
  };

  const HorizontalImageBanner = () => {
    const banners = [
      { image: require("@/assets/images/Combuscol.png"), url: "https://treasapp.com/beneficios" },
      { image: require("@/assets/images/Fitvision.png"), url: "https://treasapp.com/beneficios" },
  
    ];

    const handlePress = (url) => {
      Linking.openURL(url);
    };

    return (
      <View style={styles.containerHorizontal}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {banners.map((banner, index) => (
            <TouchableOpacity key={index} onPress={() => handlePress(banner.url)}>
              <Image source={banner.image} style={styles.bannerImage} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };
  const darkMapStyle = [
    {
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#212121"
        }
      ]
    },
    {
      "elementType": "labels.icon",
      "stylers": [
        {
          "visibility": "off"
        }
      ]
    },
    {
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "color": "#757575"
        }
      ]
    },
    {
      "elementType": "labels.text.stroke",
      "stylers": [
        {
          "color": "#212121"
        }
      ]
    },
    {
      "featureType": "administrative",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#757575"
        }
      ]
    },
    {
      "featureType": "administrative.country",
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "color": "#9e9e9e"
        }
      ]
    },
    {
      "featureType": "administrative.land_parcel",
      "stylers": [
        {
          "visibility": "off"
        }
      ]
    },
    {
      "featureType": "administrative.locality",
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "color": "#bdbdbd"
        }
      ]
    },
    {
      "featureType": "poi",
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "color": "#757575"
        }
      ]
    },
    {
      "featureType": "poi.park",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#181818"
        }
      ]
    },
    {
      "featureType": "poi.park",
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "color": "#616161"
        }
      ]
    },
    {
      "featureType": "poi.park",
      "elementType": "labels.text.stroke",
      "stylers": [
        {
          "color": "#1b1b1b"
        }
      ]
    },
    {
      "featureType": "road",
      "elementType": "geometry.fill",
      "stylers": [
        {
          "color": "#2c2c2c"
        }
      ]
    },
    {
      "featureType": "road",
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "color": "#8a8a8a"
        }
      ]
    },
    {
      "featureType": "road.arterial",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#373737"
        }
      ]
    },
    {
      "featureType": "road.highway",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#3c3c3c"
        }
      ]
    },
    {
      "featureType": "road.highway.controlled_access",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#4e4e4e"
        }
      ]
    },
    {
      "featureType": "road.local",
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "color": "#616161"
        }
      ]
    },
    {
      "featureType": "transit",
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "color": "#757575"
        }
      ]
    },
    {
      "featureType": "water",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#000000"
        }
      ]
    },
    {
      "featureType": "water",
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "color": "#3d3d3d"
        }
      ]
    }
  ];
  return (

    <View style={styles.container}>
      <>
        <StatusBar hidden={true} />

        {isMapVisible && (
          <View style={{ flex: 1 }}>
            {/* Botón de Back */}
            <View style={{ position: 'absolute', top: 0, left: 0, zIndex: 2, padding: 30 }}>
              <TouchableOpacity style={{
                backgroundColor: '#ffaeae',
                borderRadius: 100,
                width: 40,  // Aumenta el ancho
                height: 40,  // Aumenta la altura
                justifyContent: 'center',  // Centrar contenido verticalmente
                alignItems: 'center'  // Centrar contenido horizontalmente
              }}

                onPress={() => setIsMapVisible(false)}>
                <Ionicons name="arrow-back" size={24} color="black" />
              </TouchableOpacity>
            </View>

            <View style={{ position: 'absolute', top: 40, width: '100%', zIndex: 1, padding: 30, marginTop: 10 }}>
              {/* Input de origen */}
              <GooglePlacesAutocomplete
                ref={originAutocompleteRef}
                enablePoweredByContainer={false}
                placeholder="Inicia tu viaje ya!!!"
                minLength={4}
                debounce={2000}
                fetchDetails
                onPress={(data, details = null) =>
                  handleLocationSelect(data, details, 'origin')
                }
                query={{
                  key: GOOGLE_MAPS_APIKEY_PROD,
                  language: 'es',
                  components: 'country:co',
                  sessiontoken: sessionTokenOriginRef.current,
                }}
                styles={{
                  textInput: {
                    ...styles.input,
                    backgroundColor: colorScheme === 'dark'
                      ? Platform.OS === 'ios'
                        ? '#333'
                        : '#ffc1c1'
                      : '#fff',
                    color: colorScheme === 'dark' ? '#fff' : '#000',
                    paddingVertical: 10,
                  },
                  listView: {
                    ...styles.listView,
                    backgroundColor: colorScheme === 'dark' ? '#333' : '#fff',
                  },
                  description: {
                    color: colorScheme === 'dark' ? '#000' : '#000',
                  },
                }}
                textInputProps={{
                  onFocus: () => {
                    setFocus('origin');
                    setIsMapVisible(true); // Mostrar el mapa cuando el campo de "Origen" gana el foco
                    setButtonsVisible(false);
                    if (!sessionTokenOriginRef.current) {
                      const generateUID = () => {
                        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                          const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                          return v.toString(16);
                        });
                      };
                      sessionTokenOriginRef.current = generateUID();
                    }
                  },
                  onBlur: () => {
                    if (!origin) {
                      sessionTokenOriginRef.current = null;
                    }
                  },
                }}
              />

              {/* Input de destino */}
              <GooglePlacesAutocomplete
                ref={destinationAutocompleteRef}
                enablePoweredByContainer={false}
                placeholder={destination ? destination.title : "Destino"}


                minLength={4}
                debounce={2000}
                fetchDetails
                onPress={(data, details = null) =>
                  handleLocationSelect(data, details, 'destination')
                }
                query={{
                  key: GOOGLE_MAPS_APIKEY_PROD,
                  language: 'es',
                  components: 'country:co',
                  sessiontoken: sessionTokenDestinationRef.current,
                }}
                styles={{
                  textInput: {
                    ...styles.input,
                    backgroundColor: colorScheme === 'dark'
                      ? Platform.OS === 'ios'
                        ? '#333'
                        : '#ffc1c1'
                      : '#fff',
                    color: colorScheme === 'dark' ? '#fff' : '#000',
                    paddingVertical: 10,
                  },
                  listView: {
                    ...styles.listView,
                    backgroundColor: colorScheme === 'dark' ? '#333' : '#fff',
                  },
                  description: {
                    color: colorScheme === 'dark' ? '#000' : '#000',
                  },
                }}
                textInputProps={{
                  onFocus: () => {
                    setFocus('destination');
                    if (!sessionTokenDestinationRef.current) {
                      const generateUID = () => {
                        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                          const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                          return v.toString(16);
                        });
                      };
                      sessionTokenDestinationRef.current = generateUID();
                    }
                  },
                  onBlur: () => {
                    if (!destination) {
                      sessionTokenDestinationRef.current = null;
                    }
                  },
                }}
              />
              {type !== null && (
                <View style={styles.selectedTypeContainer}>
                  <Text style={styles.selectedTypeText}>
                    ¡Genial! Has elegido: {suggestions.find(s => s.id === type)?.label}
                  </Text>
                </View>
              )}
            </View>

            {/* Map View */}

            {/* Modal de Tour */}
            <Modal
  animationType="slide"
  transparent={false}
  visible={tourVisible}
  onRequestClose={() => {}}
>
  <KeyboardAvoidingView
    behavior={Platform.OS === "ios" ? "padding" : undefined}
    style={{ flex: 1 }}
  >
    <ScrollView
      contentContainerStyle={{ flexGrow: 1, ...styles.tourContainer }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Image source={tourImage} style={styles.tourImage} />
        {loading ? (
          <Text style={[styles.tourText, { flexShrink: 1 }]}>{loadingMessage}</Text>
        ) : currentStep === 5 ? (
          <Text style={[styles.tourText, { flexShrink: 1 }]}>
            🎉¡Felicidades!🎉 Estas a un paso de completar tu registro en T+Plus.
          </Text>
        ) : (
          <Text style={[styles.tourText, { flexShrink: 1 }]}>
            Hola, bienvenido a T+Plus, Asegúrate de completar los siguientes pasos para poder disfrutar de todas nuestras funcionalidades
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
  </KeyboardAvoidingView>
</Modal>



            <MapView
              ref={mapRef}
              style={styles.map}
              provider="google"
              showsUserLocation={true}
              showsMyLocationButton={false}
              initialRegion={{
                latitude: latitude || 37.78825,
                longitude: longitude || -122.4324,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
              }}
              region={{
                latitude: latitude || 37.78825,
                longitude: longitude || -122.4324,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
              }}
            >
              {origin && (
                <Marker
                  coordinate={{ latitude: origin.latitude, longitude: origin.longitude }}
                  title={origin.title}
                >
                  <View style={styles.markerContainer}>
                    <Image
                      source={markerIcon}
                      style={{ width: 26, height: 50 }}
                    />
                  </View>
                </Marker>
              )}

              {destination && (
                <Marker
                  coordinate={{ latitude: destination.latitude, longitude: destination.longitude }}
                  title={destination.title}
                >
                  <View style={styles.markerContainer}>
                    <Ionicons name="location" size={36} color="#F20505" />
                  </View>
                </Marker>
              )}

              {routeGeometry && (
                <MapView.Polyline
                  coordinates={routeGeometry.coordinates.map(coord => ({ latitude: coord[1], longitude: coord[0] }))}
                  strokeColor="#F20505"
                  strokeWidth={3}
                />
              )}
            </MapView>
          </View>
        )}


        {!isMapVisible && ( // Mostrar el mapa solo si isMapVisible es verdadero

          <View style={{ flex: 1 }}>
            <ScrollView style={{
              width: "auto", margin: 10
            }}>

              <StatusBar hidden={true} />
              <View style={styles.notificationCard}>
                <TouchableOpacity
                  style={[styles.menuButton, { backgroundColor: colorScheme === 'dark' ? '#fff' : '#000', marginBottom: 10 }]}
                  onPress={() => navigation.navigate("Carnet")}
                >
                  <Image
                    source={user?.profile_image ? { uri: user?.profile_image } : require("@/assets/images/Avatar/1.png")}
                    style={{ width: 30, height: 30 }}
                  />
                </TouchableOpacity>
                <Text style={styles.notificationText}>
                  👋🏻 {' '}
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


              <View >
                <GooglePlacesAutocomplete
                  ref={originAutocompleteRef}
                  enablePoweredByContainer={false}
                  placeholder="¿A dónde vas?"
                  minLength={4}
                  debounce={2000}
                  fetchDetails
                  onPress={(data, details = null) =>
                    handleLocationSelect(data, details, 'origin')
                  }
                  query={{
                    key: GOOGLE_MAPS_APIKEY_PROD,
                    language: 'es',
                    components: 'country:co',
                    sessiontoken: sessionTokenOriginRef.current,
                  }}
                  styles={{
                    textInput: {
                      ...styles.input,
                      backgroundColor:
                        colorScheme === 'dark'
                          ? Platform.OS === 'ios'
                            ? '#333'
                            : '#ffc1c1'
                          : '#fff',
                      color: colorScheme === 'dark' ? '#fff' : '#000',
                      paddingVertical: 10,
                    },
                    listView: {
                      ...styles.listView,
                      backgroundColor: colorScheme === 'dark' ? '#333' : '#fff',
                    },
                    description: {
                      color: colorScheme === 'dark' ? '#000' : '#000',
                    },
                  }}
                  textInputProps={{
                    onFocus: () => {
                      setFocus('origin');
                      console.log(user.emailVerified, "user.emailVerified");
                      console.log(tourVisible, "tourVisible");

                      console.log(user.emailVerified, "user.emailVerified");
                      console.log(tourVisible, "tourVisible");
                      console.log(user.profile_image, "user.profile_image");
                      console.log(user.mobile, "user.mobile");
                      console.log(user.docType, "user.docType");
                      console.log(user.verifyId, "user.verifyId");
                      console.log(user.verifyIdImage, "user.verifyIdImage");
                      if (user.emailVerified && !tourVisible && (!user.profile_image || !user.mobile || !user.docType || !user.verifyId || !user.verifyIdImage)) {
                        setTourVisible(true);
                      }
                      setIsMapVisible(true); // Mostrar el mapa cuando el campo de "Origen" gana el foco
                      setButtonsVisible(false);
                      if (!sessionTokenOriginRef.current) {
                        const generateUID = () => {
                          return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                            const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                            return v.toString(16);
                          });
                        }
                        sessionTokenOriginRef.current = generateUID();
                      }
                    },
                    onBlur: () => {
                      if (!origin) {
                        sessionTokenOriginRef.current = null;
                      }
                    },
                  }}
                />
                {SavedAddresses()}








                <View style={{ marginBottom: 100 }}>
                  {!isMapVisible && renderSuggestions()}
                  {!isMapVisible && DailySavings()}

                  {!isMapVisible && (
                    <>
                      <Text style={styles.headerDayli}>BENEFICIOS</Text>
                      {HorizontalImageBanner()}
                    </>
                  )}

                  {!isMapVisible && promos.length > 0 && (
                    <>
                      <Text style={styles.headerDayli}>PROMOCIONES</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                        {promos.map((promo, index) => (
                          <View key={index} style={styles.promoCard}>
                            <Text style={styles.promoTitle}>{promo.promo_name}</Text>
                            <Text style={styles.promoDescription}>{promo.description}</Text>
                            <Text style={styles.promoCode}>Código: {promo.promo_code}</Text>
                          </View>
                        ))}
                      </ScrollView>
                    </>
                  )}
                </View>






              </View>

            </ScrollView>
          </View>
        )}
        {destination && (
          <View style={styles.bookNowContainer2}>
            <TouchableOpacity
              style={styles.bookNow}
              onPress={handleBookNowPress}
            >
              <Text style={styles.bookNowText}>SOLICITAR</Text>
            </TouchableOpacity>
          </View>
        )}

        {Platform.OS === "android" && isMapVisible && (
          <View style={styles.centerButton} onPress={centerMap}>
            <Text style={styles.centerButtonText}>
              Centra aquí{" "}
              <AntDesign name="right" size={18} color="red" />
            </Text>
          </View>
        )}

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(!modalVisible)}
        >
          <View style={styles.modalBackground}>
            <View style={styles.modalView}>
              <Text style={styles.modalText}>{modalMessage}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>Cerrar</Text>
              </TouchableOpacity>
            </View>

            <Modal
              transparent={true}
              animationType="slide"
              visible={modalVisibleImage}
              onRequestClose={() => setModalVisibleImage(false)}
            >
              <View style={[styles.modalContainer, { zIndex: 9999 }]}>                <View style={styles.modalView}>
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
              <View style={[styles.modalContainer, { zIndex: 9999 }]}>
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

          </View>
        </Modal>
      </>
    </View>

  );
};

const lightStyles = StyleSheet.create({
  containerSuper: {
    backgroundColor: "#EEEEEE",
    height: "300%",
  },
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeLine: {
    lineColor: '#F20505',
    lineWidth: 5,
    lineCap: 'round',
    lineJoin: 'round',
  },
  autocompleteContainer: {
    position: "absolute",
    top: 10,
    width: "100%",
    paddingHorizontal: 20,
    height: 800
  },
  input: {
    height: 50,
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 20,
    fontSize: 16,
    marginTop: 10,
  },
  listView: {
    backgroundColor: "#fff",
    borderRadius: 10,
    marginHorizontal: 20,
  },
  bookNowContainer: {
    flexDirection: "row", // Alinea los elementos horizontalmente
    alignItems: "center", // Alinea verticalmente en el centro
    justifyContent: "space-between", // Distribuye el espacio entre los elementos
    padding: 10, // Espaciado interno
  },

  menuButton: {
    padding: 10,
    borderRadius: 100,
    margin: 10
    // Otros estilos del botón
  },

  notificationText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
  },


  bookNowContainer2: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  modalButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  bookNow: {
    backgroundColor: "#f20505",
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 100,
    elevation: 5,
  },
  bookNowText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  centerButton: {
    position: "absolute",
    top: 15,
    right: 60,
    backgroundColor: "#fff",
    borderRadius: 25,
    padding: 10,
    elevation: 5,
  },
  centerButtonText: {
    color: "#F20505",
    fontSize: 16,
    fontWeight: "bold",
    justifyContent: "center",
  },
  imagePlaceholderText: {
    color: "#000",
    fontSize: 16,

    justifyContent: "center",
  },
  modalBackground: {
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
  closeButton: {
    backgroundColor: "#F20505",
    borderRadius: 20,
    padding: 10,
    elevation: 2,
  },
  closeButtonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  favoriteScroll: {
    marginVertical: 10,
  },
  explanatoryText: {
    fontSize: 16,
    color: "#000",
    textAlign: "center",
    marginVertical: 10,
  },
  favoriteButton: {
    backgroundColor: "#F20505",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 10,
  },
  favoriteButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },

  suggestionsScroll: {
    marginVertical: 10,
  },
  suggestionButton: {
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    borderRadius: 10,
    marginRight: 15,
    alignItems: "center",
    width: 100,
    height: 100,
  },
  suggestionButtonText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 12,
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
  containerAddress: {
    marginHorizontal: 10,
  },
  addressCard: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  icon: {
    marginRight: 15,
    color: "#F20505",
  },
  addressTitle: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
  },
  addressSubtitle: {
    color: "#a1a1a1",
    fontSize: 14,
    marginTop: 5,
  },
  containerHorizontal: {
    marginVertical: 20,
  },
  bannerImage: {
    width: 300,
    height: 150,
    borderRadius: 10,
    marginRight: 10,
  },
  selectedTypeContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    alignItems: 'center',
  },
  selectedTypeText: {
    fontSize: 16,
    color: '#000',
  },
  tourImage: {
    width: 200,
    height: 100,
    resizeMode: "contain",
    marginBottom: 20,
  },



  picker: {
    width: "100%",
    height: 50,
  },



  prevButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center"
  },
  nextButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center"
  },

  finishButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },



  tourContainer: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: "#fff", // o el color correspondiente
  },
  stepContainer: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  profileImage: {
    width: 30,
    height: 30,
    borderRadius: 15, // Hace que la imagen sea circular
    marginRight: 10,
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
  pickerContainer: {
    width: "100%",
    marginTop: 20,
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
  nextButton: {
    backgroundColor: "#f20505",
    width: 150,
    padding: 10,
    borderRadius: 10,
  },
  finishButton: {
    backgroundColor: "#f20505",
    marginTop: 20,
    width: 200,
    borderRadius: 10,
  },
  closeIcon: {
    position: "absolute",
    top: 40,
    right: 20,
  },
  summaryText: {
    fontSize: 18,
    marginVertical: 5,
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
  linkButton: {
    color: "#f20505",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    textDecorationLine: "underline",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
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
  inlinePicker: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 10,
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

  tourText: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#000",
  },
  notificationCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 8,
    flexDirection: "row", // Asegura que los elementos estén en fila
    justifyContent: "flex-start", // Alinea los elementos al inicio
    alignItems: "center",
    marginBottom: 16,
  },

  notificationText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
  },
  suggestionDescription: {
    fontSize: 12,
  }
});


const darkStyles = StyleSheet.create({
  containerSuper: {
    backgroundColor: "#545454",
  },
  container: {
    flex: 1,
    backgroundColor: "#545454",
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeLine: {
    lineColor: '#FFFFFF',
    lineWidth: 5,
    lineCap: 'round',
    lineJoin: 'round',
  },
  autocompleteContainer: {
    position: "absolute",
    //top: 10,
    width: "100%",
    //paddingHorizontal: 20,
    height: 700
  },
  input: {
    height: 50,

    borderRadius: 10,
    paddingHorizontal: 20,
    fontSize: 16,
    marginTop: 10,
    color: "#fff",
  },
  listView: {
    backgroundColor: "#333",
    borderRadius: 10,
    marginHorizontal: 20,
  },

  modalButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  menuButton: {
    position: "absolute",
    top: 4,
    left: 20,
    backgroundColor: "#000",
    borderRadius: 25,
    padding: 10,
    elevation: 5,
  },

  bookNow: {
    backgroundColor: "#f20505",
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 100,
    elevation: 5,
  },
  bookNowText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  centerButton: {
    position: "absolute",
    top: 15,
    right: 60,
    backgroundColor: "#fff",
    borderRadius: 25,
    padding: 10,
    elevation: 5,
  },
  centerButtonText: {
    color: "#F20505",
    fontSize: 16,
    fontWeight: "bold",
    justifyContent: "center",
  },
  modalBackground: {
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
  closeButton: {
    backgroundColor: "#F20505",
    borderRadius: 20,
    padding: 10,
    elevation: 2,
  },
  closeButtonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  favoriteScroll: {
    marginVertical: 10,
  },
  favoriteButton: {
    backgroundColor: "#F20505",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 10,
  },
  favoriteButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  suggestionsScroll: {
    marginVertical: 10,
  },
  suggestionButton: {
    backgroundColor: "#2E2E2E",
    paddingHorizontal: 10,
    borderRadius: 10,
    marginRight: 15,
    alignItems: "center",
    width: 100,
    height: 100,
  },
  suggestionButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
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
  containerAddress: {
    paddingHorizontal: 10,
  },
  addressCard: {
    backgroundColor: "#1c1c1e",
    borderRadius: 15,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  icon: {
    marginRight: 15,
    color: "#F20505",
  },
  addressTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  addressSubtitle: {
    color: "#a1a1a1",
    fontSize: 14,
    marginTop: 5,
  },
  containerHorizontal: {
    marginVertical: 20,
  },
  bannerImage: {
    width: 300,
    height: 150,
    borderRadius: 10,
    marginRight: 10,
  },
  selectedTypeContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#adadad',
    borderRadius: 10,
    alignItems: 'center',
  },
  selectedTypeText: {
    fontSize: 16,
    color: '#fff',
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
  userInfoContainer: {
    alignItems: "center",
    marginBottom: 20,
  },

  userInfoText: {
    fontSize: 16,
    marginBottom: 5,
    color: "#fff",
  },

  closeIconImage: {
    width: 30,
    height: 30,
  },
  nextButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center"
  },

  finishButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },

  prevButtonText: {
    color: "#f20505",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    alignSelf: "center",
    alignItems: "center"
  },
  imagePlaceholderText: {
    color: "#FAF6F6",
    fontSize: 12,

    justifyContent: "center",
  },
  picker: {
    width: "100%",
    height: 50,
  },

  tourContainer: {
    
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: "#474747", // o el color correspondiente
  },
  stepContainer: {
    
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 30,
    backgroundColor:"#474747"
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#fff",
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
  pickerContainer: {
    width: "100%",
    marginTop: 20,
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
  nextButton: {
    backgroundColor: "#f20505",
    width: 150,
    padding: 10,
    borderRadius: 10,
  },
  finishButton: {
    backgroundColor: "#f20505",
    marginTop: 20,
    width: 200,
    borderRadius: 10
  },
  closeIcon: {
    position: "absolute",
    top: 40,
    right: 20,
  },
  summaryText: {
    fontSize: 18,
    marginVertical: 5,
    color: "#fff",
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
    backgroundColor:"#474747"
    
  },
  explanatoryText: {
    fontSize: 16,
    color: "#D7D7D7",
    textAlign: "center",
    marginVertical: 10,
  },
  linkButton: {
    color: "#f20505",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    textDecorationLine: "underline",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
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
  inlinePicker: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 10,
  },
  modalButtonTextios: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",

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
  notificationCard: {
    backgroundColor: "#721c24",
    padding: 16,
    borderRadius: 8,
    flexDirection: "row", // Asegura que los elementos estén en fila
    justifyContent: "flex-start", // Alinea los elementos al inicio
    alignItems: "center",
    marginBottom: 16,
  },
  profileImage: {
    width: 30,
    height: 30,
    borderRadius: 15, // Hace que la imagen sea circular
    marginRight: 10, // Espacio entre la imagen y el texto
  },

  bookNowContainer: {
    flexDirection: "row", // Alinea los elementos horizontalmente
    alignItems: "center", // Alinea verticalmente en el centro
    justifyContent: "space-between", // Distribuye el espacio entre los elementos
    padding: 10, // Espaciado interno
  },

  menuButton: {
    padding: 10,
    borderRadius: 100,
    margin: 10
    // Otros estilos del botón
  },

  notificationText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  suggestionDescription: {
    fontSize: 12,
    color: "#fff",
    marginBottom: 10,
  },
  promoCard: {
    backgroundColor: '#fff',
    padding: 10,
    marginRight: 10,
    borderRadius: 8,
    width: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  promoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F20505',
  },
  promoDescription: {
    fontSize: 14,
    color: '#333',
    marginVertical: 5,
  },
  promoCode: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  }
});

export default CustomerMap;