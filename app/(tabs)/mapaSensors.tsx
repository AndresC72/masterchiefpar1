import React, { useEffect, useState, useRef, ReactNode } from "react";
import {
  View,
  Dimensions,
  Alert,
  PermissionsAndroid,
  Platform,
  useColorScheme,
  Text,
  Image,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from 'expo-location';
import { fonts } from "@/scripts/font";
import { useSelector } from "react-redux";
import { RootState } from "@/common/store";
import markerIcon from "@/assets/images/NavegApp.png";
import { getDistance, getRhumbLineBearing } from "geolib"; // Asegúrate de tener esta importación

const screen = Dimensions.get("window");

// Define estilos para el modo claro
const mapStyleLight = [
  {
    elementType: "labels.text.fill",
    stylers: [{ color: "#523735" }],
  },
  // Agrega más estilos según sea necesario
];

// Define estilos para el modo oscuro
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

interface MapSensorProps {
  children?: ReactNode;
}

const MapSensor: React.FC<MapSensorProps> = ({ children }) => {
  const user = useSelector((state: RootState) => state.auth.user);
  const [heading, setHeading] = useState(0); // Estado para el ángulo de rotación
  const mapRef = useRef<MapView>(null); // Referencia al mapa
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const colorScheme = useColorScheme(); // Hook para detectar si es modo oscuro o claro

  const [lastPosition, setLastPosition] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [lastHeading, setLastHeading] = useState<number | null>(null);

  // ⚠️ FUNCIÓN ELIMINADA - requestLocationPermission ya no es necesaria
  // porque expo-location maneja los permisos internamente

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    const startLocationTracking = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'No se puede acceder a la ubicación.');
        return;
      }

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Highest,
          distanceInterval: 1,
          timeInterval: 1000,
          mayShowUserSettingsDialog: true,
        },
        (location) => {
          const { latitude, longitude, heading: gpsHeading } = location.coords;
          setCurrentLocation({ latitude, longitude });

          const positionChanged = () => {
            if (!lastPosition) return true;
            const distance = getDistance(lastPosition, { latitude, longitude });
            return distance > 1;
          };

          if (positionChanged()) {
            if (gpsHeading !== null && !isNaN(gpsHeading)) {
              setHeading(gpsHeading);
              setLastHeading(gpsHeading);
            }

            animateCamera({ coords: { latitude, longitude } }, gpsHeading);
            setLastPosition({ latitude, longitude });
          }
        }
      );
    };

    startLocationTracking();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  const animateCamera = (
    location: { coords: { latitude: number; longitude: number } },
    currentHeading: number | null
  ) => {
    if (mapRef.current) {
      const camera = {
        center: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        heading: currentHeading || heading,
        pitch: 45,
        zoom: 17, // Nivel de zoom para Android
      };
      // console.log("Actualizando cámara con heading:", currentHeading || heading);
      mapRef.current.animateCamera(camera, { duration: 1000 });
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        style={{ width: screen.width, height: screen.height }}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        rotateEnabled={true}
        pitchEnabled={true}
        showsUserLocation={false}
        followsUserLocation={false}
        showsCompass={true}
        customMapStyle={
          colorScheme === "dark" ? darkMapStyle : mapStyleLight
        }
      >
        {currentLocation && (
          <Marker
            coordinate={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
            }}
            title={"Ubicación actual"}
            description={"Estás aquí"}
            anchor={{ x: 0.5, y: 0.5 }}
            rotation={heading}
            flat={true}
          >
            <View style={{ alignItems: "center" }}>
              <Image source={markerIcon} style={{ width: 66, height: 60 }} />
            </View>
          </Marker>
        )}
        {children}
      </MapView>
    </View>
  );
};

export default React.memo(MapSensor);
