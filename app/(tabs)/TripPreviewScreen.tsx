import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  TextInput,
  useColorScheme,
  Platform,
  Dimensions,
  ActivityIndicator,
  Alert,
} from "react-native";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import { Ionicons, AntDesign } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import MapView, { Marker, Polyline, Region } from "react-native-maps";
import * as Location from "expo-location";
import { useSelector } from "react-redux";
import { RootState } from "@/common/store";
import supabase from "@/config/SupabaseConfig";
import { API_KEY } from "@/config/AppConfig";
import * as Animatable from "react-native-animatable";

const { width, height } = Dimensions.get("window");
const GOOGLE_MAPS_APIKEY_PROD = API_KEY;
const VEHICLE_OPTIONS = [
  { id: 1, image: require("@/assets/images/TREAS-E.png"), label: "TREAS-E", description: "Servicio Especial" },
  { id: 2, image: require("@/assets/images/TREAS-X.png"), label: "TREAS-X", description: "Vehiculo Particular" },
  { id: 3, image: require("@/assets/images/TREAS-Van.png"), label: "TREAS-Van", description: "Van 11 Pax" },
  { id: 4, image: require("@/assets/images/TREAS-T.png"), label: "TREAS-T", description: "Taxi" },
];

interface Location {
  latitude: number;
  longitude: number;
  title: string;
  description?: string;
}

interface Stop {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
}

interface RecentTrip {
  id: string;
  origin_title: string;
  destination_title: string;
  created_at: string;
  distance?: number;
  duration?: number;
  origin_lat?: number;
  origin_lng?: number;
  destination_lat?: number;
  destination_lng?: number;
}

const TripPreviewScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const colorScheme = useColorScheme();
  const user = useSelector((state: RootState) => state.auth.user);
  const profile = useSelector((state: RootState) => state.auth.profile);

  // Obtener parámetros preseleccionados de la navegación
  const preselectedDestination = route.params?.preselectedDestination;
  const vehicleType = route.params?.vehicleType;

  // Estados para ubicaciones
  const [origin, setOrigin] = useState<Location | null>(null);
  const [destination, setDestination] = useState<Location | null>(preselectedDestination || null);
  const [stops, setStops] = useState<Stop[]>([]);
  const [recentTrips, setRecentTrips] = useState<RecentTrip[]>([]);
  const [loading, setLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [selectedVehicleType, setSelectedVehicleType] = useState<number | null>(vehicleType ?? null);
  const [showOriginMapPicker, setShowOriginMapPicker] = useState(false);
  const [showRouteMapModal, setShowRouteMapModal] = useState(false);
  const [mapPickerTarget, setMapPickerTarget] = useState<"origin" | "destination">("origin");
  const [originMapRegion, setOriginMapRegion] = useState<Region>({
    latitude: 4.711,
    longitude: -74.0721,
    latitudeDelta: 0.015,
    longitudeDelta: 0.015,
  });
  const [originMapPin, setOriginMapPin] = useState<{ latitude: number; longitude: number } | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<{ latitude: number; longitude: number }[]>([]);
  const [routeDistance, setRouteDistance] = useState<string>("");
  const [routeDuration, setRouteDuration] = useState<string>("");

  // Estados para modales
  const [showStopsModal, setShowStopsModal] = useState(false);
  const [selectedStopIndex, setSelectedStopIndex] = useState<number | null>(null);
  const [stopInput, setStopInput] = useState("");

  // Refs para autocomplete
  const originRef = useRef(null);
  const destinationRef = useRef(null);
  const stopRef = useRef(null);
  const previewMapRef = useRef<MapView>(null);
  const routeMapRef = useRef<MapView>(null);
  const mapPickerRef = useRef<MapView>(null);

  const styles = colorScheme === "dark" ? darkStyles : lightStyles;

  // Cargar viajes recientes al montar
  useEffect(() => {
    fetchRecentTrips();
  }, [profile?.id, user?.id]);

  // Autollenado del punto de partida con ubicacion actual
  useEffect(() => {
    autoFillOriginFromCurrentLocation();
  }, []);

  useEffect(() => {
    if (origin && destination && previewMapRef.current) {
      previewMapRef.current.fitToCoordinates(
        [
          { latitude: origin.latitude, longitude: origin.longitude },
          { latitude: destination.latitude, longitude: destination.longitude },
        ],
        {
          edgePadding: { top: 70, right: 70, bottom: 70, left: 70 },
          animated: true,
        }
      );
    }
  }, [origin, destination]);

  useEffect(() => {
    if (showRouteMapModal && origin && destination && routeMapRef.current) {
      routeMapRef.current.fitToCoordinates(
        [
          { latitude: origin.latitude, longitude: origin.longitude },
          { latitude: destination.latitude, longitude: destination.longitude },
        ],
        {
          edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
          animated: true,
        }
      );
    }
  }, [showRouteMapModal, origin, destination]);

  // Obtener ruta real con Google Directions API
  useEffect(() => {
    if (origin && destination) {
      fetchDirections();
    } else {
      setRouteCoordinates([]);
      setRouteDistance("");
      setRouteDuration("");
    }
  }, [origin, destination]);

  // Decodificar polyline encoded de Google Directions API
  const decodePolyline = (encoded: string): { latitude: number; longitude: number }[] => {
    const coordinates: { latitude: number; longitude: number }[] = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
      let b;
      let shift = 0;
      let result = 0;

      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;

      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      coordinates.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5,
      });
    }

    return coordinates;
  };

  // Obtener direcciones reales de Google Directions API
  const fetchDirections = async () => {
    if (!origin || !destination) return;

    try {
      const originStr = `${origin.latitude},${origin.longitude}`;
      const destinationStr = `${destination.latitude},${destination.longitude}`;
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${destinationStr}&key=${GOOGLE_MAPS_APIKEY_PROD}`;

      const response = await fetch(url);
      const json = await response.json();

      if (json.status === "OK" && json.routes?.length > 0) {
        const route = json.routes[0];
        const points = route.overview_polyline?.points;
        
        if (points) {
          const decodedCoordinates = decodePolyline(points);
          setRouteCoordinates(decodedCoordinates);
        }

        // Extraer distancia y duración
        if (route.legs?.length > 0) {
          const leg = route.legs[0];
          setRouteDistance(leg.distance?.text || "");
          setRouteDuration(leg.duration?.text || "");
        }
      } else {
        console.warn("Directions API error:", json.status, json.error_message);
        // Fallback a línea recta si falla la API
        setRouteCoordinates([
          { latitude: origin.latitude, longitude: origin.longitude },
          { latitude: destination.latitude, longitude: destination.longitude },
        ]);
      }
    } catch (error) {
      console.error("Error fetching directions:", error);
      // Fallback a línea recta
      setRouteCoordinates([
        { latitude: origin.latitude, longitude: origin.longitude },
        { latitude: destination.latitude, longitude: destination.longitude },
      ]);
    }
  };

  // Función para obtener viajes recientes de Supabase
  const fetchRecentTrips = async () => {
    const userId = user?.id || profile?.id;
    console.log("🔍 [RecentTrips] userId:", userId);
    if (!userId) {
      console.log("⚠️ [RecentTrips] No userId, abortando");
      return;
    }

    try {
      setLoading(true);

      // Leer config directamente
      const extra = require("expo-constants").default?.expoConfig?.extra || {};
      const baseUrl = extra.SUPABASE_URL;
      const anonKey = extra.SUPABASE_ANON_KEY;

      if (!baseUrl || !anonKey) {
        console.error("❌ [RecentTrips] Config no disponible");
        return;
      }

      // Leer JWT del usuario directamente de AsyncStorage (evita supabase.auth.getSession que cuelga)
      const AsyncStorageLib = require("@react-native-async-storage/async-storage").default;
      let accessToken = anonKey;
      try {
        const stored = await AsyncStorageLib.getItem("tmasplus_auth_session");
        if (stored) {
          const parsed = JSON.parse(stored);
          const jwt = parsed?.access_token || parsed?.currentSession?.access_token;
          if (jwt) {
            accessToken = jwt;
            console.log("🔍 [RecentTrips] JWT leído de AsyncStorage OK");
          } else {
            console.log("⚠️ [RecentTrips] JWT no encontrado en sesión guardada, usando anon key");
          }
        } else {
          console.log("⚠️ [RecentTrips] Sin sesión en AsyncStorage");
        }
      } catch (e: any) {
        console.log("⚠️ [RecentTrips] Error leyendo AsyncStorage:", e?.message);
      }

      console.log("🔍 [RecentTrips] Haciendo fetch...");

      // Fetch directo a PostgREST
      const fetchUrl = `${baseUrl}/rest/v1/bookings?select=id,customer_id,pickup_location,destination_location,drop_location,pickup_address,drop_address,created_at,distance,duration,status&customer_id=eq.${encodeURIComponent(userId)}&order=created_at.desc&limit=5`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(fetchUrl, {
        method: "GET",
        headers: {
          "apikey": anonKey,
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log("🔍 [RecentTrips] HTTP status:", response.status);

      if (!response.ok) {
        const errText = await response.text();
        console.error("❌ [RecentTrips] HTTP", response.status, errText.substring(0, 300));
        return;
      }

      const data = await response.json();
      console.log("🔍 [RecentTrips] Registros:", data?.length ?? 0);

      if (!data || data.length === 0) {
        console.log("⚠️ [RecentTrips] 0 resultados para customer_id:", userId);
        return;
      }

      console.log("🔍 [RecentTrips] Primer registro:", JSON.stringify(data[0]).substring(0, 400));

      const normalizedTrips: RecentTrip[] = data.map((trip: any) => {
        const pickup = typeof trip.pickup_location === "string"
          ? JSON.parse(trip.pickup_location) : trip.pickup_location;
        const dest = typeof trip.destination_location === "string"
          ? JSON.parse(trip.destination_location) : trip.destination_location;
        const drop = trip.drop_location
          ? (typeof trip.drop_location === "string" ? JSON.parse(trip.drop_location) : trip.drop_location)
          : dest;

        return {
          id: trip.id,
          origin_title: pickup?.address || "Origen",
          destination_title: (drop?.address || dest?.address) || "Destino",
          created_at: trip.created_at,
          distance: trip.distance,
          duration: trip.duration,
          origin_lat: pickup?.lat != null ? Number(pickup.lat) : undefined,
          origin_lng: pickup?.lng != null ? Number(pickup.lng) : undefined,
          destination_lat: (drop?.lat ?? dest?.lat) != null ? Number(drop?.lat ?? dest?.lat) : undefined,
          destination_lng: (drop?.lng ?? dest?.lng) != null ? Number(drop?.lng ?? dest?.lng) : undefined,
        };
      });

      console.log("✅ [RecentTrips] Viajes cargados:", normalizedTrips.length);
      setRecentTrips(normalizedTrips);
    } catch (error: any) {
      if (error?.name === "AbortError") {
        console.error("❌ [RecentTrips] Timeout 8s - Supabase no responde");
      } else {
        console.error("❌ [RecentTrips] Exception:", error?.message || error);
      }
    } finally {
      setLoading(false);
    }
  };

  const getAddressLabel = async (latitude: number, longitude: number) => {
    try {
      const reverse = await Location.reverseGeocodeAsync({ latitude, longitude });
      const first = reverse?.[0];
      if (!first) return "Mi ubicacion actual";

      const composed = [
        first.name,
        first.street,
        first.district,
        first.city,
      ]
        .filter(Boolean)
        .join(", ");

      return composed || "Mi ubicacion actual";
    } catch (error) {
      return "Mi ubicacion actual";
    }
  };

  const autoFillOriginFromCurrentLocation = async () => {
    if (origin) return;

    try {
      setIsGettingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const latitude = current.coords.latitude;
      const longitude = current.coords.longitude;
      const title = await getAddressLabel(latitude, longitude);

      setOrigin({ latitude, longitude, title, description: "Ubicacion en tiempo real" });
      setOriginMapRegion({
        latitude,
        longitude,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      });
      setOriginMapPin({ latitude, longitude });
    } catch (error) {
      console.log("Error al obtener ubicacion actual:", error);
    } finally {
      setIsGettingLocation(false);
    }
  };

  const openMapPicker = async (target: "origin" | "destination") => {
    setMapPickerTarget(target);

    const selectedPoint = target === "origin" ? origin : destination;
    const fallbackPoint = target === "origin" ? destination : origin;

    if (selectedPoint) {
      setOriginMapRegion({
        latitude: selectedPoint.latitude,
        longitude: selectedPoint.longitude,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      });
      setOriginMapPin({ latitude: selectedPoint.latitude, longitude: selectedPoint.longitude });
    } else if (fallbackPoint) {
      setOriginMapRegion({
        latitude: fallbackPoint.latitude,
        longitude: fallbackPoint.longitude,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      });
      setOriginMapPin({ latitude: fallbackPoint.latitude, longitude: fallbackPoint.longitude });
    } else {
      // Si no hay punto seleccionado, centrar en ubicación actual del usuario
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const currentLocation = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          setOriginMapRegion({
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
            latitudeDelta: 0.015,
            longitudeDelta: 0.015,
          });
        }
      } catch (error) {
        console.log("Error al obtener ubicación para el mapa:", error);
      }
    }

    setShowOriginMapPicker(true);
  };

  const centerMapOnUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permisos requeridos", "Se necesita acceso a la ubicación para centrar el mapa.");
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const region = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      };

      setOriginMapRegion(region);

      // Animar la cámara al punto si el ref está disponible
      if (mapPickerRef.current) {
        mapPickerRef.current.animateToRegion(region, 500);
      }
    } catch (error) {
      console.log("Error al centrar mapa en ubicación actual:", error);
      Alert.alert("Error", "No se pudo obtener tu ubicación actual");
    }
  };

  const confirmMapSelection = async () => {
    if (!originMapPin) {
      Alert.alert(
        "Selecciona un punto",
        mapPickerTarget === "origin"
          ? "Toca el mapa para definir el punto de partida."
          : "Toca el mapa para definir el destino."
      );
      return;
    }

    const title = await getAddressLabel(originMapPin.latitude, originMapPin.longitude);
    const payload = {
      latitude: originMapPin.latitude,
      longitude: originMapPin.longitude,
      title,
      description: "Seleccionado en mapa",
    };

    if (mapPickerTarget === "origin") {
      setOrigin(payload);
    } else {
      setDestination(payload);
    }

    setShowOriginMapPicker(false);
  };

  // Manejar selección de ubicación
  const handleLocationSelect = (
    data: any,
    details: any,
    type: "origin" | "destination" | "stop"
  ) => {
    if (!details?.geometry?.location) {
      Alert.alert("No se pudo leer la ubicacion", "Intenta seleccionar otra sugerencia.");
      return;
    }

    const { lat, lng } = details.geometry.location;
    const location = {
      latitude: lat,
      longitude: lng,
      title: data.description,
    };

    if (type === "origin") {
      setOrigin(location);
    } else if (type === "destination") {
      setDestination(location);
    } else if (type === "stop") {
      if (selectedStopIndex !== null) {
        const newStops = [...stops];
        newStops[selectedStopIndex] = {
          ...location,
          id: `stop_${selectedStopIndex}`,
        };
        setStops(newStops);
        setShowStopsModal(false);
        setStopInput("");
      }
    }
  };

  // Agregar nueva parada
  const handleAddStop = () => {
    if (stops.length < 2) {
      setStops([...stops, { id: `stop_${stops.length}`, latitude: 0, longitude: 0, title: "" }]);
    }
  };

  // Eliminar parada
  const handleRemoveStop = (index: number) => {
    setStops(stops.filter((_, i) => i !== index));
  };

  // Ir a viaje reciente
  const handleRecentTripSelect = async (trip: RecentTrip) => {
    // Obtener coordenadas del viaje reciente si es necesario
    navigation.getParent()?.navigate("BookingS", {
      origin: {
        title: trip.origin_title,
        latitude: trip.origin_lat ?? 0,
        longitude: trip.origin_lng ?? 0,
      },
      destination: {
        title: trip.destination_title,
        latitude: trip.destination_lat ?? 0,
        longitude: trip.destination_lng ?? 0,
      },
      type: null,
    });
  };

  // Validar y continuar
  const handleContinue = () => {
    if (!origin || !destination) {
      alert("Por favor selecciona origen y destino");
      return;
    }

    // Preparar stops para pasar a BookingScreen
    const stopsData = stops.filter((stop) => stop.title); // Solo incluir paradas con ubicación seleccionada

    navigation.getParent()?.navigate("BookingS", {
      origin,
      destination,
      stops: stopsData.length > 0 ? stopsData : undefined,
      type: selectedVehicleType ?? null,
    });
  };

  // Renderizar parada
  const renderStop = (stop: Stop, index: number) => (
    <View key={stop.id} style={styles.stopContainer}>
      <View style={styles.stopHeader}>
        <Text style={styles.stopLabel}>Parada {index + 1}</Text>
        <TouchableOpacity onPress={() => handleRemoveStop(index)}>
          <Ionicons name="close-circle" size={20} color="#FF6B6B" />
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={styles.stopInput}
        onPress={() => {
          setSelectedStopIndex(index);
          setShowStopsModal(true);
        }}
      >
        <AntDesign name="plus" size={20} color="#00f4f5" />
        <Text style={styles.stopInputText}>
          {stop.title || `Selecciona parada ${index + 1}`}
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Renderizar viaje reciente
  const renderRecentTrip = (trip: RecentTrip, index: number) => {
    const tripDate = new Date(trip.created_at);
    const now = new Date();
    const diffTime = Math.abs(Number(now) - Number(tripDate));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let timeText = "Hace poco";
    if (diffDays === 1) timeText = "Ayer";
    else if (diffDays < 7) timeText = `Hace ${diffDays} días`;
    else if (diffDays < 30) timeText = `Hace ${Math.floor(diffDays / 7)} semanas`;
    else timeText = `Hace ${Math.floor(diffDays / 30)} meses`;

    return (
      <Animatable.View
        key={trip.id}
        animation="fadeInUp"
        duration={500}
        delay={index * 70}
        useNativeDriver
      >
        <TouchableOpacity
          style={styles.recentTripCard}
          onPress={() => handleRecentTripSelect(trip)}
        >
          <View style={styles.tripIconContainer}>
            <Ionicons name="location" size={16} color="#00f4f5" />
          </View>
          <View style={styles.tripInfoContainer}>
            <Text style={styles.tripOrigin} numberOfLines={1}>
              {trip.origin_title}
            </Text>
            <View style={styles.tripArrow}>
              <View style={styles.arrowLine} />
              <Ionicons name="arrow-forward" size={12} color="#888" />
              <View style={styles.arrowLine} />
            </View>
            <Text style={styles.tripDestination} numberOfLines={1}>
              {trip.destination_title}
            </Text>
          </View>
          <Text style={styles.tripTime}>{timeText}</Text>
        </TouchableOpacity>
      </Animatable.View>
    );
  };

  const renderSuggestionRow = (data: any) => {
    const mainText = data?.structured_formatting?.main_text || data?.description || "Ubicacion";
    const secondaryText = data?.structured_formatting?.secondary_text || "Seleccionar direccion";

    return (
      <View style={styles.suggestionRow}>
        <View style={styles.suggestionIconWrap}>
          <Ionicons name="location-outline" size={16} color="#00f4f5" />
        </View>
        <View style={styles.suggestionTextWrap}>
          <Text style={styles.suggestionMainText} numberOfLines={1}>
            {mainText}
          </Text>
          <Text style={styles.suggestionSecondaryText} numberOfLines={1}>
            {secondaryText}
          </Text>
        </View>
        <Ionicons name="arrow-forward-circle-outline" size={18} color="#00c9cb" />
      </View>
    );
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <FlatList
        data={[{ id: "trip-preview-content" }]}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.screenContentContainer}
        renderItem={() => (
          <>
            {/* Header */}
            <Animatable.View animation="slideInDown" duration={400} style={styles.header}>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color={colorScheme === "dark" ? "#fff" : "#00204a"} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>¿A dónde vas?</Text>
              <View style={{ width: 24 }} />
            </Animatable.View>

            {/* Main Content */}
            <Animatable.View animation="fadeIn" duration={500} style={styles.contentContainer}>
          {/* Origin Input */}
          <Animatable.View animation="fadeInUp" duration={450} delay={100} useNativeDriver>
            <View style={[styles.inputSection, styles.glassCard, { zIndex: 30 }]}> 
              <Text style={styles.sectionLabel}>Punto de partida</Text>
              {origin ? (
                <TouchableOpacity
                  style={[styles.selectedLocation, { backgroundColor: colorScheme === "dark" ? "#1a1a2e" : "#f0f0f0" }]}
                  onPress={() => setOrigin(null)}
                >
                  <Ionicons name="location-sharp" size={20} color="#00f4f5" />
                  <Text style={styles.selectedLocationText}>{origin.title}</Text>
                  <Ionicons name="close" size={16} color="#999" />
                </TouchableOpacity>
              ) : (
                <View style={styles.originInputRow}>
                  <View style={styles.originAutocompleteWrap}>
                    <GooglePlacesAutocomplete
                      ref={originRef}
                      enablePoweredByContainer={false}
                      placeholder="Donde estas..."
                      minLength={3}
                      debounce={400}
                      keyboardShouldPersistTaps="always"
                      fetchDetails
                      onPress={(data, details) => handleLocationSelect(data, details, "origin")}
                      renderRow={renderSuggestionRow}
                      query={{
                        key: GOOGLE_MAPS_APIKEY_PROD,
                        language: "es",
                        components: "country:co",
                      }}
                      styles={autoCompleteStyles(colorScheme)}
                    />
                  </View>
                  <TouchableOpacity
                    style={styles.locationIconButton}
                    onPress={autoFillOriginFromCurrentLocation}
                    disabled={isGettingLocation}
                  >
                    {isGettingLocation ? (
                      <ActivityIndicator size="small" color="#00f4f5" />
                    ) : (
                      <Ionicons name="locate" size={20} color="#00f4f5" />
                    )}
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.originActionsRow}>
                <TouchableOpacity
                  style={styles.originActionButton}
                  onPress={autoFillOriginFromCurrentLocation}
                  disabled={isGettingLocation}
                >
                  <Ionicons name="radio" size={16} color="#00f4f5" />
                  <Text style={styles.originActionText}>Ubicacion en tiempo real</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.originActionButton} onPress={() => openMapPicker("origin")}>
                  <Ionicons name="map" size={16} color="#00f4f5" />
                  <Text style={styles.originActionText}>Elegir en mapa</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.recentTripsInlineSection}>
                <Text style={styles.sectionLabel}>Viajes recientes</Text>
                {loading ? (
                  <ActivityIndicator size="large" color="#00f4f5" />
                ) : recentTrips.length > 0 ? (
                  recentTrips.map((item, index) => renderRecentTrip(item, index))
                ) : (
                  <Text style={styles.noTripsText}>No hay viajes recientes</Text>
                )}
              </View>
            </View>
          </Animatable.View>

          {/* Destination Input */}
          <Animatable.View animation="fadeInUp" duration={450} delay={150} useNativeDriver>
            <View style={[styles.inputSection, styles.glassCard, { zIndex: 20 }]}> 
              <Text style={styles.sectionLabel}>Destino</Text>
              {destination ? (
                <TouchableOpacity
                  style={[styles.selectedLocation, { backgroundColor: colorScheme === "dark" ? "#1a1a2e" : "#f0f0f0" }]}
                  onPress={() => setDestination(null)}
                >
                  <Ionicons name="location-sharp" size={20} color="#FF6B6B" />
                  <Text style={styles.selectedLocationText}>{destination.title}</Text>
                  <Ionicons name="close" size={16} color="#999" />
                </TouchableOpacity>
              ) : (
                <GooglePlacesAutocomplete
                  ref={destinationRef}
                  enablePoweredByContainer={false}
                  placeholder="Hacia dónde quieres ir..."
                  minLength={3}
                  debounce={400}
                  keyboardShouldPersistTaps="always"
                  fetchDetails
                  onPress={(data, details) => handleLocationSelect(data, details, "destination")}
                  renderRow={renderSuggestionRow}
                  query={{
                    key: GOOGLE_MAPS_APIKEY_PROD,
                    language: "es",
                    components: "country:co",
                  }}
                  styles={autoCompleteStyles(colorScheme)}
                />
              )}
            </View>
          </Animatable.View>

          {/* Stops */}
          {stops.length > 0 && (
            <Animatable.View animation="fadeInUp" duration={450} delay={200} useNativeDriver>
              <View style={[styles.stopsSection, styles.glassCard]}>
                <Text style={styles.sectionLabel}>Paradas adicionales</Text>
                {stops.map((stop, index) => renderStop(stop, index))}
              </View>
            </Animatable.View>
          )}

          {/* Auto Map Preview */}
          {origin && destination && (
            <Animatable.View animation="fadeInUp" duration={500} delay={220} useNativeDriver>
              <View style={[styles.mapPreviewSection, styles.glassCard]}>
                <View style={styles.mapPreviewHeader}>
                  <View>
                    <Text style={styles.sectionLabel}>Vista del mapa</Text>
                    <Text style={styles.mapPreviewHint}>Ruta precargada automaticamente</Text>
                  </View>
                  {routeDistance && routeDuration && (
                    <View style={styles.routeInfo}>
                      <View style={styles.routeInfoItem}>
                        <Ionicons name="resize-outline" size={14} color="#00d6d8" />
                        <Text style={styles.routeInfoText}>{routeDistance}</Text>
                      </View>
                      <View style={styles.routeInfoItem}>
                        <Ionicons name="time-outline" size={14} color="#00d6d8" />
                        <Text style={styles.routeInfoText}>{routeDuration}</Text>
                      </View>
                    </View>
                  )}
                </View>

                <MapView
                  ref={previewMapRef}
                  style={styles.mapPreview}
                  initialRegion={{
                    latitude: origin.latitude,
                    longitude: origin.longitude,
                    latitudeDelta: 0.02,
                    longitudeDelta: 0.02,
                  }}
                >
                  <Marker
                    coordinate={{ latitude: origin.latitude, longitude: origin.longitude }}
                    title="Punto de partida"
                    pinColor="#00d6d8"
                  />
                  <Marker
                    coordinate={{ latitude: destination.latitude, longitude: destination.longitude }}
                    title="Destino"
                    pinColor="#ff6b6b"
                  />
                  {routeCoordinates.length > 0 && (
                    <Polyline
                      coordinates={routeCoordinates}
                      strokeColor="#00d6d8"
                      strokeWidth={4}
                    />
                  )}
                </MapView>

                <View style={styles.quickEditRow}>
                  <TouchableOpacity style={styles.quickEditButton} onPress={() => openMapPicker("origin")}>
                    <Ionicons name="create-outline" size={16} color="#00d6d8" />
                    <Text style={styles.quickEditButtonText}>Cambiar partida</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.quickEditButton} onPress={() => openMapPicker("destination")}>
                    <Ionicons name="create-outline" size={16} color="#00d6d8" />
                    <Text style={styles.quickEditButtonText}>Cambiar destino</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.routeButton} onPress={() => setShowRouteMapModal(true)}>
                  <Ionicons name="navigate" size={17} color="#002f54" />
                  <Text style={styles.routeButtonText}>Ver mi recorrido</Text>
                </TouchableOpacity>
              </View>
            </Animatable.View>
          )}

          {/* Add Stop Button */}
          {stops.length < 2 && (
            <Animatable.View animation="fadeInUp" duration={450} delay={250} useNativeDriver>
              <TouchableOpacity style={styles.addStopButton} onPress={handleAddStop}>
                <Ionicons name="add-circle" size={20} color="#00f4f5" />
                <Text style={styles.addStopText}>Añadir parada adicional ({stops.length}/2)</Text>
              </TouchableOpacity>
            </Animatable.View>
          )}

          {/* Vehicle Types Section */}
          {origin && destination && (
            <Animatable.View animation="fadeInUp" duration={450} delay={310} useNativeDriver>
              <View style={[styles.vehicleTypesSection, styles.glassCard]}>
                <Text style={styles.sectionLabel}>Selecciona tipo de vehiculo</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.vehicleTypesScroll}
                >
                  {VEHICLE_OPTIONS.map((vehicle, index) => {
                    const isSelected = selectedVehicleType === vehicle.id;
                    return (
                      <Animatable.View
                        key={vehicle.id}
                        animation="fadeInUp"
                        duration={500}
                        delay={310 + index * 70}
                        useNativeDriver
                      >
                        <TouchableOpacity
                          style={[
                            styles.vehicleButton,
                            isSelected && styles.vehicleButtonSelected,
                          ]}
                          onPress={() => setSelectedVehicleType(vehicle.id)}
                        >
                          <Image
                            source={vehicle.image}
                            style={{ width: 50, height: 50 }}
                            resizeMode="contain"
                          />
                          <Text style={styles.vehicleButtonText}>{vehicle.label}</Text>
                          <Text style={styles.vehicleDescription}>{vehicle.description}</Text>
                        </TouchableOpacity>
                      </Animatable.View>
                    );
                  })}
                </ScrollView>
              </View>
            </Animatable.View>
          )}

          {/* Continue Button */}
          <Animatable.View animation="fadeInUp" duration={450} delay={330} useNativeDriver>
            <TouchableOpacity
              style={[
                styles.continueButton,
                { opacity: origin && destination && selectedVehicleType ? 1 : 0.5 },
              ]}
              onPress={handleContinue}
              disabled={!origin || !destination || !selectedVehicleType}
            >
              <Text style={styles.continueButtonText}>Iniciar viaje</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          </Animatable.View>
            </Animatable.View>
          </>
        )}
      />

      {/* Modal for Stop Selection */}
      <Modal visible={showStopsModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colorScheme === "dark" ? "#0f0f0f" : "#fff" }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Parada {selectedStopIndex !== null ? selectedStopIndex + 1 : ""}</Text>
              <TouchableOpacity onPress={() => setShowStopsModal(false)}>
                <Ionicons name="close" size={24} color={colorScheme === "dark" ? "#fff" : "#000"} />
              </TouchableOpacity>
            </View>

            <GooglePlacesAutocomplete
              ref={stopRef}
              enablePoweredByContainer={false}
              placeholder="Buscar ubicación..."
              minLength={3}
              debounce={400}
              keyboardShouldPersistTaps="always"
              fetchDetails
              onPress={(data, details) => handleLocationSelect(data, details, "stop")}
              renderRow={renderSuggestionRow}
              query={{
                key: GOOGLE_MAPS_APIKEY_PROD,
                language: "es",
                components: "country:co",
              }}
              styles={autoCompleteStyles(colorScheme)}
            />
          </View>
        </View>
      </Modal>

      <Modal visible={showOriginMapPicker} animationType="slide">
        <View style={styles.mapPickerContainer}>
          <View style={styles.mapPickerHeader}>
            <TouchableOpacity onPress={() => setShowOriginMapPicker(false)}>
              <Ionicons name="close" size={24} color={colorScheme === "dark" ? "#fff" : "#000"} />
            </TouchableOpacity>
            <Text style={styles.mapPickerTitle}>
              {mapPickerTarget === "origin" ? "Selecciona punto de partida" : "Selecciona destino"}
            </Text>
            <TouchableOpacity onPress={confirmMapSelection}>
              <Text style={styles.mapPickerConfirm}>Confirmar</Text>
            </TouchableOpacity>
          </View>

          <MapView
            ref={mapPickerRef}
            style={styles.mapPickerMap}
            initialRegion={originMapRegion}
            showsUserLocation={true}
            showsMyLocationButton={false}
            followsUserLocation={false}
            onPress={(event) => {
              const coordinate = event.nativeEvent.coordinate;
              setOriginMapPin({
                latitude: coordinate.latitude,
                longitude: coordinate.longitude,
              });
            }}
            onRegionChangeComplete={(region) => setOriginMapRegion(region)}
          >
            {originMapPin && <Marker coordinate={originMapPin} />}
          </MapView>

          <TouchableOpacity style={styles.myLocationButton} onPress={centerMapOnUserLocation}>
            <Ionicons name="locate" size={24} color="#00d6d8" />
          </TouchableOpacity>
        </View>
      </Modal>

      <Modal visible={showRouteMapModal} animationType="slide">
        <View style={styles.mapPickerContainer}>
          <View style={styles.mapPickerHeader}>
            <TouchableOpacity onPress={() => setShowRouteMapModal(false)}>
              <Ionicons name="close" size={24} color={colorScheme === "dark" ? "#fff" : "#000"} />
            </TouchableOpacity>
            <Text style={styles.mapPickerTitle}>Tu recorrido</Text>
            <View style={{ width: 55 }} />
          </View>

          {origin && destination && (
            <MapView
              ref={routeMapRef}
              style={styles.mapPickerMap}
              initialRegion={{
                latitude: origin.latitude,
                longitude: origin.longitude,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
              }}
            >
              <Marker
                coordinate={{ latitude: origin.latitude, longitude: origin.longitude }}
                title="Punto de partida"
                pinColor="#00d6d8"
              />
              <Marker
                coordinate={{ latitude: destination.latitude, longitude: destination.longitude }}
                title="Destino"
                pinColor="#ff6b6b"
              />
              {routeCoordinates.length > 0 && (
                <Polyline
                  coordinates={routeCoordinates}
                  strokeColor="#00d6d8"
                  strokeWidth={5}
                />
              )}
            </MapView>
          )}
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

// Auto-complete styles based on color scheme
const autoCompleteStyles = (colorScheme: string | null | undefined) =>
  StyleSheet.create({
    container: {
      flex: 0,
    },
    textInput: {
      backgroundColor: colorScheme === "dark" ? "rgba(22, 28, 45, 0.78)" : "rgba(255, 255, 255, 0.85)",
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 14,
      color: colorScheme === "dark" ? "#e8fcff" : "#00204a",
      borderWidth: 1.2,
      borderColor: colorScheme === "dark" ? "rgba(0, 244, 245, 0.35)" : "rgba(0, 244, 245, 0.45)",
    },
    listView: {
      backgroundColor: colorScheme === "dark" ? "rgba(18, 22, 40, 0.95)" : "rgba(255, 255, 255, 0.96)",
      borderRadius: 14,
      marginTop: 8,
      borderWidth: 1.2,
      borderColor: colorScheme === "dark" ? "rgba(0, 244, 245, 0.35)" : "rgba(0, 244, 245, 0.42)",
      shadowColor: "#00f4f5",
      shadowOpacity: colorScheme === "dark" ? 0.2 : 0.14,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 6,
    },
    row: {
      backgroundColor: "transparent",
      paddingVertical: 4,
      paddingHorizontal: 8,
    },
    description: {
      color: colorScheme === "dark" ? "#cff9ff" : "#2b4b63",
    },
    separator: {
      height: 0,
    },
  });

// Light Styles
const lightStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eafcff",
  },
  screenContentContainer: {
    paddingBottom: 28,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1.2,
    borderBottomColor: "rgba(0, 244, 245, 0.28)",
    backgroundColor: "rgba(255, 255, 255, 0.72)",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#00204a",
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  glassCard: {
    backgroundColor: "rgba(255, 255, 255, 0.72)",
    borderWidth: 1.1,
    borderColor: "rgba(0, 244, 245, 0.35)",
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  inputSection: {
    marginBottom: 14,
  },
  originInputRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  originAutocompleteWrap: {
    flex: 1,
  },
  locationIconButton: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderWidth: 1.1,
    borderColor: "rgba(0, 244, 245, 0.45)",
  },
  originActionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 10,
    rowGap: 10,
    marginTop: 10,
  },
  originActionButton: {
    flexGrow: 1,
    flexBasis: "48%",
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#00f4f5",
    backgroundColor: "#f7ffff",
  },
  originActionText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#00b5b6",
    marginLeft: 6,
    flexShrink: 1,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#00356d",
    marginBottom: 8,
  },
  selectedLocation: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(0, 244, 245, 0.28)",
  },
  selectedLocationText: {
    flex: 1,
    marginHorizontal: 12,
    fontSize: 14,
    color: "#00356d",
  },
  stopsSection: {
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  stopContainer: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: "rgba(255, 255, 255, 0.82)",
    borderRadius: 12,
  },
  stopHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  stopLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: "#666",
  },
  stopInput: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#00f4f5",
  },
  stopInputText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#00f4f5",
  },
  addStopButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 20,
    backgroundColor: "rgba(255, 255, 255, 0.88)",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#00f4f5",
    borderStyle: "dashed",
  },
  addStopText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "500",
    color: "#00f4f5",
  },
  continueButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    marginBottom: 20,
    backgroundColor: "#00d6d8",
    borderRadius: 12,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#00204a",
    marginRight: 8,
  },
  recentTripsSection: {
    marginTop: 20,
  },
  recentTripsInlineSection: {
    marginTop: 12,
  },
  recentTripCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginVertical: 8,
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#00f4f5",
  },
  tripIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  tripInfoContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
  tripOrigin: {
    fontSize: 12,
    fontWeight: "500",
    color: "#333",
  },
  tripArrow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 2,
  },
  arrowLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#ddd",
  },
  tripDestination: {
    fontSize: 12,
    fontWeight: "500",
    color: "#666",
  },
  tripTime: {
    fontSize: 12,
    color: "#999",
  },
  vehicleTypesSection: {
    marginVertical: 24,
  },
  vehicleTypesScroll: {
    marginTop: 12,
  },
  vehicleButton: {
    alignItems: "center",
    marginRight: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#f9f9f9",
    borderWidth: 1.5,
    borderColor: "#e0e0e0",
  },
  vehicleButtonSelected: {
    borderColor: "#00d6d8",
    backgroundColor: "rgba(0, 244, 245, 0.2)",
  },
  vehicleButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#000",
    marginTop: 8,
  },
  vehicleDescription: {
    fontSize: 11,
    color: "#666",
    marginTop: 4,
  },
  noTripsText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    paddingVertical: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 20,
    maxHeight: "80%",
  },
  suggestionRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  suggestionIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 244, 245, 0.15)",
  },
  suggestionTextWrap: {
    flex: 1,
    marginHorizontal: 10,
  },
  suggestionMainText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#00356d",
  },
  suggestionSecondaryText: {
    marginTop: 2,
    fontSize: 11,
    color: "#3e647f",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  mapPickerContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  mapPickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#e8e8e8",
  },
  mapPickerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
  },
  mapPickerConfirm: {
    fontSize: 14,
    fontWeight: "700",
    color: "#00b5b6",
  },
  mapPickerMap: {
    flex: 1,
  },
  myLocationButton: {
    position: "absolute",
    bottom: 30,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  mapPreviewSection: {
    marginBottom: 16,
  },
  mapPreviewHeader: {
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  routeInfo: {
    gap: 4,
  },
  routeInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  routeInfoText: {
    fontSize: 11,
    color: "#3e647f",
    fontWeight: "600",
  },
  mapPreviewHint: {
    fontSize: 12,
    color: "#3e647f",
    fontWeight: "500",
  },
  mapPreview: {
    width: "100%",
    height: 180,
    borderRadius: 14,
    overflow: "hidden",
  },
  quickEditRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  quickEditButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0, 214, 216, 0.55)",
    borderRadius: 10,
    paddingVertical: 9,
    backgroundColor: "rgba(255, 255, 255, 0.65)",
  },
  quickEditButtonText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: "700",
    color: "#004f73",
  },
  routeButton: {
    marginTop: 10,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(0, 214, 216, 0.6)",
    backgroundColor: "rgba(0, 214, 216, 0.22)",
  },
  routeButtonText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: "700",
    color: "#003f67",
  },
});

// Dark Styles
const darkStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#090f1f",
  },
  screenContentContainer: {
    paddingBottom: 28,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1.2,
    borderBottomColor: "rgba(0, 244, 245, 0.28)",
    backgroundColor: "rgba(16, 21, 38, 0.88)",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  glassCard: {
    backgroundColor: "rgba(20, 28, 48, 0.78)",
    borderWidth: 1.1,
    borderColor: "rgba(0, 244, 245, 0.35)",
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  inputSection: {
    marginBottom: 14,
  },
  originInputRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  originAutocompleteWrap: {
    flex: 1,
  },
  locationIconButton: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
    backgroundColor: "rgba(19, 27, 45, 0.9)",
    borderWidth: 1.1,
    borderColor: "rgba(0, 244, 245, 0.35)",
  },
  originActionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 10,
    rowGap: 10,
    marginTop: 10,
  },
  originActionButton: {
    flexGrow: 1,
    flexBasis: "48%",
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#00f4f5",
    backgroundColor: "#121225",
  },
  originActionText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#00f4f5",
    marginLeft: 6,
    flexShrink: 1,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#c9f6ff",
    marginBottom: 8,
  },
  selectedLocation: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(12, 17, 32, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(0, 244, 245, 0.28)",
  },
  selectedLocationText: {
    flex: 1,
    marginHorizontal: 12,
    fontSize: 14,
    color: "#00f4f5",
  },
  stopsSection: {
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a2e",
  },
  stopContainer: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: "rgba(20, 27, 44, 0.8)",
    borderRadius: 12,
  },
  stopHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  stopLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: "#aaa",
  },
  stopInput: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#0f0f0f",
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#00f4f5",
  },
  stopInputText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#00f4f5",
  },
  addStopButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 20,
    backgroundColor: "rgba(19, 27, 45, 0.8)",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#00f4f5",
    borderStyle: "dashed",
  },
  addStopText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "500",
    color: "#00f4f5",
  },
  continueButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    marginBottom: 20,
    backgroundColor: "#00d6d8",
    borderRadius: 12,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginRight: 8,
  },
  recentTripsSection: {
    marginTop: 20,
  },
  recentTripsInlineSection: {
    marginTop: 12,
  },
  recentTripCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginVertical: 8,
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#00f4f5",
  },
  tripIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2a2a3e",
    justifyContent: "center",
    alignItems: "center",
  },
  tripInfoContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
  tripOrigin: {
    fontSize: 12,
    fontWeight: "500",
    color: "#fff",
  },
  tripArrow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 2,
  },
  arrowLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#333",
  },
  tripDestination: {
    fontSize: 12,
    fontWeight: "500",
    color: "#aaa",
  },
  tripTime: {
    fontSize: 12,
    color: "#666",
  },
  vehicleTypesSection: {
    marginVertical: 24,
  },
  vehicleTypesScroll: {
    marginTop: 12,
  },
  vehicleButton: {
    alignItems: "center",
    marginRight: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#2a2a3e",
    borderWidth: 1.5,
    borderColor: "#444",
  },
  vehicleButtonSelected: {
    borderColor: "#00d6d8",
    backgroundColor: "rgba(0, 244, 245, 0.16)",
  },
  vehicleButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
    marginTop: 8,
  },
  vehicleDescription: {
    fontSize: 11,
    color: "#aaa",
    marginTop: 4,
  },
  noTripsText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    paddingVertical: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 20,
    maxHeight: "80%",
    backgroundColor: "#1a1a2e",
  },
  suggestionRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  suggestionIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 244, 245, 0.2)",
  },
  suggestionTextWrap: {
    flex: 1,
    marginHorizontal: 10,
  },
  suggestionMainText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ddfcff",
  },
  suggestionSecondaryText: {
    marginTop: 2,
    fontSize: 11,
    color: "#9fdae4",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  mapPickerContainer: {
    flex: 1,
    backgroundColor: "#0f0f0f",
  },
  mapPickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a2e",
  },
  mapPickerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  mapPickerConfirm: {
    fontSize: 14,
    fontWeight: "700",
    color: "#00f4f5",
  },
  mapPickerMap: {
    flex: 1,
  },
  myLocationButton: {
    position: "absolute",
    bottom: 30,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(22, 28, 45, 0.95)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#00d6d8",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: "rgba(0, 214, 216, 0.3)",
  },
  mapPreviewSection: {
    marginBottom: 16,
  },
  mapPreviewHeader: {
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  routeInfo: {
    gap: 4,
  },
  routeInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  routeInfoText: {
    fontSize: 11,
    color: "#9fdae4",
    fontWeight: "600",
  },
  mapPreviewHint: {
    fontSize: 12,
    color: "#9fdae4",
    fontWeight: "500",
  },
  mapPreview: {
    width: "100%",
    height: 180,
    borderRadius: 14,
    overflow: "hidden",
  },
  quickEditRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  quickEditButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0, 214, 216, 0.55)",
    borderRadius: 10,
    paddingVertical: 9,
    backgroundColor: "rgba(14, 27, 43, 0.8)",
  },
  quickEditButtonText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: "700",
    color: "#b7f3ff",
  },
  routeButton: {
    marginTop: 10,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(0, 214, 216, 0.6)",
    backgroundColor: "rgba(0, 214, 216, 0.18)",
  },
  routeButtonText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: "700",
    color: "#c6f8ff",
  },
});

export default TripPreviewScreen;
