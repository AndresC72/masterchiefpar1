import React, { useState, useRef, useEffect } from "react";
import { StyleSheet, View,Text, Image } from "react-native";
import mapStyle from "@/json/mapStyle";
import MapView, { PROVIDER_GOOGLE, Camera, Marker } from "react-native-maps";
import markeIconO from "@/assets/images/green_pin.png";
import changueMap from "@/assets/images/Figmap.png";
import * as Location from "expo-location";

const GoogleMaps = () => {
  const mapRef = useRef<MapView | null>(null);
  const [currentPosition, setCurrentPosition] = useState(null);

  useEffect(() => {
    getCurrentPosition();
    animateCameraToInitialPosition();
  }, []);


  useEffect(() => {
    if (currentPosition && mapRef.current) {
      const camera = {
        center: currentPosition,
        pitch: 70,
        heading: 0,
        altitude: 1500,
        zoom: 17,
      };
      mapRef.current.animateCamera(camera, { duration: 1000 });
    }
  }, [currentPosition]);

  // Función para animar la cámara a la posición inicial
  const animateCameraToInitialPosition = () => {
    if (mapRef.current) {
      const camera: Camera = {
        center: {
          latitude: 37.77825,
          longitude: -122.4324,
        },
        pitch: 70, // Ajusta este valor para obtener el efecto 3D deseado
        heading: 0,
        altitude: 1500, // Ajusta este valor para obtener la altitud deseada
        zoom: 17, // Ajusta este valor para obtener el nivel de zoom deseado
      };
      mapRef.current.animateCamera(camera, { duration: 1000 });
    }
  };

//modificado
  const getCurrentPosition = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
  
      if (status !== "granted") {
        console.error("Location permission denied");
        return;
      }
  
      let location = await Location.getCurrentPositionAsync({});
      if (location && location.coords) {
        setCurrentPosition({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
    } catch (error) {
      console.error("Error getting location:", error);
    }
  };
  

  return (
    <View style={styles.container}>
      {currentPosition ? (
      <MapView
        ref={mapRef}
        style={styles.map}
        //customMapStyle={mapStyle}
        loadingEnabled
        provider={PROVIDER_GOOGLE}
        showsUserLocation={true}
        
      >
        <>
              <Marker coordinate={currentPosition} title="Mi Ubicación">
                <Image source={markeIconO} style={{ width: 50, height: 50 }} />
              </Marker>
            </>
      </MapView>
      ) : (
        <View style={styles.containerMap}>
          <Image source={changueMap} style={{ width: 400, height: 400 }} />
          <Text style={{ fontSize: 16, fontWeight: 'bold' }} >Cargando mapa...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
    ...StyleSheet.absoluteFillObject,
  },
  containerMap:{
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  }
});

export default GoogleMaps;
