import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
  Alert,
  TextInput,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  useColorScheme, // Importamos useColorScheme
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/common/store";
import Entypo from "react-native-vector-icons/Entypo";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import * as Animatable from "react-native-animatable";
import { updateProfile } from "@/common/actions/authactions";
import { Ionicons, AntDesign, MaterialIcons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
type Props = NativeStackScreenProps<any>;

interface Address {
  id: string;
  label: string;
  address: string;
  isFavorite?: boolean;
  typeAddress?: string | null;
}

export default function FavoritesScreen({ navigation }: Props ) {
  const colorScheme = useColorScheme(); // Detecta el esquema de color
  const user = useSelector((state: RootState) => state.auth.user);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newAddressLabel, setNewAddressLabel] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newAddressDetails, setNewAddressDetails] = useState<any>(null); // Para almacenar lat y lng
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [editingAddressLabel, setEditingAddressLabel] = useState<string>("");

  const GOOGLE_MAPS_APIKEY_PROD = "AIzaSyCSVNAzcal6oqDoX65qVmTIXUR8IFYWaYE"; // Reemplaza con tu clave API de Google Maps

  const dispatch = useDispatch();

  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteType, setFavoriteType] = useState<string | null>(null);

  const handleLongPress = (address: Address) => {
    setSelectedAddress(address);
    setIsFavorite(address.isFavorite || false);
    setFavoriteType(address.typeAddress || null);
  };
  const generateId = generatePushID();

  const handleSaveFavorite = () => {
    if (selectedAddress) {
      const updatedAddresses = addresses.map((address) =>
        address.id === selectedAddress.id
          ? { ...address, isFavorite, typeAddress: favoriteType }
          : address
      );
      setAddresses(updatedAddresses);

      const updatedSavedAddresses = {
        ...user.savedAddresses,
        [selectedAddress.id]: {
          ...user.savedAddresses[selectedAddress.id],
          isFavorite,
          typeAddress: favoriteType,
        },
      };

      dispatch(updateProfile({ savedAddresses: updatedSavedAddresses }));

      setSelectedAddress(null);
      setIsFavorite(false);
      setFavoriteType(null);
    }
  };

  useEffect(() => {
    const savedAddresses = user.savedAddresses || {};
    const frequentAddresses = Object.keys(savedAddresses).map((key) => {
      const savedAddress = savedAddresses[key];
      return {
        id: key,
        label:
          savedAddress.nameAddressFavorite && savedAddress.nameAddressFavorite.trim() !== ""
            ? savedAddress.nameAddressFavorite
            : savedAddress.count
            ? `Dirección Frecuente ${savedAddress.count}`
            : "Dirección Frecuente",
        address: savedAddress.description,
        isFavorite: savedAddress.isFavorite || false,
        typeAddress: savedAddress.typeAddress || null,
        lat: savedAddress.lat,
        lng: savedAddress.lng,
      };
    });
    setAddresses(frequentAddresses);
  }, [user]);

  const handleAddAddress = () => {
    if (newAddressLabel.trim() === "" || newAddress.trim() === "") {
      Alert.alert("Error", "Por favor, completa todos los campos.");
      return;
    }

    if (!newAddressDetails) {
      Alert.alert("Error", "Por favor, selecciona una dirección válida.");
      return;
    }

    const newId = generateId();

    const newAddressObj: Address = {
      id: newId,
      label: newAddressLabel,
      address: newAddress,
      lat: newAddressDetails.geometry.location.lat,
      lng: newAddressDetails.geometry.location.lng,
      isFavorite: true,
      typeAddress: null,
    };

    setAddresses([...addresses, newAddressObj]);

    // Actualizar savedAddresses en el perfil del usuario
    const updatedSavedAddresses = {
      ...user.savedAddresses,
      [newId]: {
        description: newAddress,
        isFavorite: false,
        lat: newAddressDetails.geometry.location.lat,
        lng: newAddressDetails.geometry.location.lng,
        nameAddressFavorite: newAddressLabel,
        typeAddress: null,
      },
    };

    dispatch(updateProfile({ savedAddresses: updatedSavedAddresses }));

    // Limpiar los campos y cerrar el modal
    setNewAddressLabel("");
    setNewAddress("");
    setNewAddressDetails(null);
    setModalVisible(false);
  };

  const handleLocationSelect = (data, details = null) => {
    if (details) {
      const selectedAddress = details.formatted_address;
      setNewAddress(selectedAddress);
      setNewAddressDetails(details);
    } else {
      setNewAddress(data.description);
      setNewAddressDetails(null);
    }
  };
  function generatePushID() {
    // Caracteres utilizados en el ID, ordenados por ASCII para mantener el orden lexicográfico.
    const PUSH_CHARS =
      '-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz';
  
    // Almacena el timestamp del último push para evitar colisiones locales.
    let lastPushTime = 0;
  
    // Almacena los últimos 12 caracteres aleatorios generados.
    let lastRandChars = [];
  
    return function () {
      let now = new Date().getTime();
      const duplicateTime = now === lastPushTime;
      lastPushTime = now;
  
      let timeStampChars = new Array(8);
      for (let i = 7; i >= 0; i--) {
        timeStampChars[i] = PUSH_CHARS.charAt(now % 64);
        now = Math.floor(now / 64);
      }
  
      if (now !== 0) {
        console.error('We should have converted the entire timestamp.');
      }
  
      let id = timeStampChars.join('');
  
      if (!duplicateTime) {
        // Generar nuevos 12 caracteres aleatorios.
        for (let i = 0; i < 12; i++) {
          lastRandChars[i] = Math.floor(Math.random() * 64);
        }
      } else {
        // Si el timestamp es el mismo que el anterior, incrementa los caracteres aleatorios.
        let i;
        for (i = 11; i >= 0 && lastRandChars[i] === 63; i--) {
          lastRandChars[i] = 0;
        }
        if (i >= 0) {
          lastRandChars[i]++;
        } else {
          // Caso improbable donde todos los caracteres aleatorios son 63.
        }
      }
  
      for (let i = 0; i < 12; i++) {
        id += PUSH_CHARS.charAt(lastRandChars[i]);
      }
  
      if (id.length !== 20) {
        console.error('Length should be 20.');
      }
  
      return id;
    };
  }
  
  const handleEditAddress = (id: string, label: string) => {
    setEditingAddressId(id);
    setEditingAddressLabel(label);
  };

  const handleSaveEdit = (id: string) => {
    const updatedAddresses = addresses.map((address) =>
      address.id === id ? { ...address, label: editingAddressLabel } : address
    );

    setAddresses(updatedAddresses);
    setEditingAddressId(null);
    setEditingAddressLabel("");

    const updatedSavedAddresses = {
      ...user.savedAddresses,
      [id]: {
        ...user.savedAddresses[id],
        nameAddressFavorite: editingAddressLabel,
      },
    };

    dispatch(updateProfile({ savedAddresses: updatedSavedAddresses }));
  };

  const handleFavoriteTypeSelect = (type: string | null) => {
    setFavoriteType(type);
    setIsFavorite(type !== null);
  };
  const handleDeleteAddress = (id: string) => {
    Alert.alert(
      "Eliminar Dirección",
      "¿Estás seguro de que deseas eliminar esta dirección?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => {
            // Eliminar de addresses
            const updatedAddresses = addresses.filter(
              (address) => address.id !== id
            );
            setAddresses(updatedAddresses);

            // Eliminar de user.savedAddresses
            const updatedSavedAddresses = { ...user.savedAddresses };
            delete updatedSavedAddresses[id];

            dispatch(updateProfile({ savedAddresses: updatedSavedAddresses }));
          },
        },
      ]
    );
  };
  const renderFavoriteTypeButton = (type: string | null, label: string) => (
    <TouchableOpacity
      key={type}
      style={[
        stylesFavorite.favoriteTypeButton,
        favoriteType === type && stylesFavorite.selectedFavoriteTypeButton,
      ]}
      onPress={() => handleFavoriteTypeSelect(type)}
    >
      <Text
        style={[
          stylesFavorite.favoriteTypeButtonText,
          favoriteType === type && stylesFavorite.selectedFavoriteTypeButtonText,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderAddressItem = ({ item }: { item: Address }) => (
    <Animatable.View
      animation="fadeInUp"
      duration={800}
      style={[
        stylesFavorite.addressItem,
        colorScheme === 'dark' ? stylesDark.addressItem : stylesLight.addressItem,
      ]}
    >
    
      <TouchableOpacity
        onPress={() => handleEditAddress(item.id, item.label)}
        onLongPress={() => handleLongPress(item)}
      >
        <View style={stylesFavorite.iconLabelContainer}>
          <Entypo name="location-pin" size={24} color="#F20505" />
          {editingAddressId === item.id ? (
            <TextInput
              style={[
                stylesFavorite.input,
                colorScheme === 'dark' ? stylesDark.input : stylesLight.input,
              ]}
              value={editingAddressLabel}
              onChangeText={setEditingAddressLabel}
              onBlur={() => handleSaveEdit(item.id)}
            />
          ) : (
            <Text style={[
              stylesFavorite.label,
              colorScheme === 'dark' ? stylesDark.label : stylesLight.label,
            ]}>{item.label}</Text>
          )}
          {item.isFavorite && (
            <Entypo
              name="star"
              size={24}
              color="#F5A623"
              style={stylesFavorite.favoriteIcon}
            />
          )}
        </View>
        <Text style={[
          stylesFavorite.address,
          colorScheme === 'dark' ? stylesDark.address : stylesLight.address,
        ]}>{item.address}</Text>
        {item.typeAddress && (
          <Text style={[
            stylesFavorite.typeAddress,
            colorScheme === 'dark' ? stylesDark.typeAddress : stylesLight.typeAddress,
          ]}>{item.typeAddress}</Text>
        )}
      </TouchableOpacity>
       {/* Botón de eliminación */}
      <TouchableOpacity
        style={stylesFavorite.deleteButton}
        onPress={() => handleDeleteAddress(item.id)}
      >
        <Entypo name="trash" size={24} color="#F20505" />
      </TouchableOpacity>
    </Animatable.View>
  );

  return (
    <ImageBackground
      // source={require("./path_to_background_image.jpg")}
      style={stylesFavorite.backgroundImage}
    >
      <View style={[
        stylesFavorite.overlay,
        colorScheme === 'dark' ? stylesDark.overlay : stylesLight.overlay,
      ]}>
        <View style={stylesFavorite.container}>
          <View style={stylesFavorite.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <AntDesign name="arrowleft" size={24} color={colorScheme === 'dark' ? "#fff" : "black"} />
            </TouchableOpacity>
            <Text style={[
              stylesFavorite.headerText,
              colorScheme === 'dark' ? stylesDark.headerText : stylesLight.headerText,
            ]}>{"Mis Direcciones"} </Text>
            <TouchableOpacity
              style={stylesFavorite.addButton}
              onPress={() => setModalVisible(true)}
            >
              <Entypo name="plus" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
            
          <FlatList
            data={addresses}
            renderItem={renderAddressItem}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={() => (
              <View>
                <Text style={[
                  stylesFavorite.sectionTitle,
                  colorScheme === 'dark' ? stylesDark.sectionTitle : stylesLight.sectionTitle,
                ]}>Lugares Frecuentes</Text>
              </View>
            )}
          />

          {/* Modal para agregar nueva dirección */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
            presentationStyle="overFullScreen"
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              style={stylesFavorite.modalContainer}
            >
              <View style={[
                stylesFavorite.modalContent,
                colorScheme === 'dark' ? stylesDark.modalContent : stylesLight.modalContent,
              ]}>
                <Text style={[
                  stylesFavorite.modalTitle,
                  colorScheme === 'dark' ? stylesDark.modalTitle : stylesLight.modalTitle,
                ]}>Añadir Nueva Dirección</Text>
                <View style={{ marginVertical: 10 }}>
                  <TextInput
                    style={[
                      stylesFavorite.input,
                      colorScheme === 'dark' ? stylesDark.input : stylesLight.input,
                    ]}
                    placeholder="Etiqueta (e.g., Casa, Trabajo)"
                    placeholderTextColor={colorScheme === 'dark' ? "#aaa" : "#555"}
                    value={newAddressLabel}
                    onChangeText={setNewAddressLabel}
                  />
                  <GooglePlacesAutocomplete
                    placeholder="Ingresa la Dirección"
                    placeholderTextColor={colorScheme === 'dark' ? "#aaa" : "#555"}
                    minLength={2}
                    fetchDetails={true}
                    onPress={handleLocationSelect}
                    query={{
                      key: GOOGLE_MAPS_APIKEY_PROD,
                      language: "es",
                      components: "country:co",
                    }}
                    styles={{
                      textInput: [
                        stylesFavorite.input,
                        colorScheme === 'dark' ? stylesDark.input : stylesLight.input,
                      ],
                      container: stylesFavorite.autocompleteContainer,
                      listView: stylesFavorite.autocompleteListView,
                    }}
                    nearbyPlacesAPI="GooglePlacesSearch"
                    debounce={200}
                  />
                </View>
                <TouchableOpacity
                  style={stylesFavorite.saveButton}
                  onPress={handleAddAddress}
                >
                  <Text style={stylesFavorite.saveButtonText}>Guardar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={stylesFavorite.cancelButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={stylesFavorite.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </Modal>

          {/* Modal para editar dirección */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={selectedAddress !== null}
            onRequestClose={() => setSelectedAddress(null)}
          >
            <View style={stylesFavorite.modalContainer}>
              <View style={[
                stylesFavorite.modalContent,
                colorScheme === 'dark' ? stylesDark.modalContent : stylesLight.modalContent,
              ]}>
                <Text style={[
                  stylesFavorite.modalTitle,
                  colorScheme === 'dark' ? stylesDark.modalTitle : stylesLight.modalTitle,
                ]}>Información de la Dirección</Text>
                {selectedAddress && (
                  <>
                    <Text style={[
                      stylesFavorite.modalLabel,
                      colorScheme === 'dark' ? stylesDark.modalLabel : stylesLight.modalLabel,
                    ]}>
                      Etiqueta: {selectedAddress.label}
                    </Text>
                    <Text style={[
                      stylesFavorite.modalAddress,
                      colorScheme === 'dark' ? stylesDark.modalAddress : stylesLight.modalAddress,
                    ]}>
                      Dirección: {selectedAddress.address}
                    </Text>
                    <Text style={[
                      stylesFavorite.modalLabel,
                      colorScheme === 'dark' ? stylesDark.modalLabel : stylesLight.modalLabel,
                    ]}>Tipo de Favorito:</Text>
                    <View style={stylesFavorite.favoriteTypeContainer}>
                      {renderFavoriteTypeButton(null, "Ninguna")}
                      {renderFavoriteTypeButton("Casa", "Casa")}
                      {renderFavoriteTypeButton("Trabajo", "Trabajo")}
                      {renderFavoriteTypeButton("Otro", "Otro")}
                      {renderFavoriteTypeButton("Gimnasio", "Gimnasio")}
                      {renderFavoriteTypeButton("Supermercado", "Supermercado")}
                      {renderFavoriteTypeButton("Parque", "Parque")}
                      {renderFavoriteTypeButton("Escuela", "Escuela")}
                      {renderFavoriteTypeButton("Restaurante", "Restaurante")}
                    </View>
                  </>
                )}
                <TouchableOpacity
                  style={stylesFavorite.closeButton}
                  onPress={handleSaveFavorite}
                >
                  <Text style={stylesFavorite.closeButtonText}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </View>
      </View>
    </ImageBackground>
  );
}

const stylesLight = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    resizeMode: "cover",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
  },
  container: {
    flex: 1,
    padding: 16,
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
  },
  addButton: {
    backgroundColor: "#F20505",
    padding: 10,
    borderRadius: 50,
    elevation: 5,
  },
  sectionTitle: {
    marginTop: 20,
    marginBottom: 10,
    fontSize: 22,
    fontWeight: "bold",
    color: "#F20505",
  },
  addressItem: {
    paddingVertical: 15,
    borderBottomColor: "#eee",
    borderBottomWidth: 1,
  },
  iconLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  label: {
    fontSize: 18,
    fontWeight: "500",
    marginLeft: 8,
    color: "#333",
  },
  address: {
    fontSize: 16,
    color: "#777",
    marginLeft: 32,
  },
  typeAddress: {
    fontSize: 14,
    color: "#777",
    marginTop: 5,
    marginLeft: 32,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 20,
    marginHorizontal: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#F20505",
    textAlign: "center",
  },
  input: {
    height: 50,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    color: "#000",
    backgroundColor: "#fff",
  },
  autocompleteContainer: {
    flex: 0,
    zIndex: 1,
  },
  autocompleteListView: {
    position: "absolute",
    top: 50,
    zIndex: 2,
    backgroundColor: "#fff",
    borderRadius: 10,
    elevation: 5,
  },
  saveButton: {
    backgroundColor: "#F20505",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  cancelButton: {
    alignItems: "center",
    paddingVertical: 10,
  },
  cancelButtonText: {
    color: "#F20505",
    fontWeight: "bold",
    fontSize: 16,
  },
  modalLabel: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  modalAddress: {
    fontSize: 16,
    color: "#777",
    marginBottom: 20,
  },
  closeButton: {
    backgroundColor: "#F20505",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  favoriteIcon: {
    marginLeft: 8,
  },
  favoriteTypeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginVertical: 10,
  },
  favoriteTypeButton: {
    backgroundColor: "#f0f0f0",
    padding: 12,
    borderRadius: 10,
    margin: 5,
    flexBasis: "48%",
    alignItems: "center",
  },
  selectedFavoriteTypeButton: {
    backgroundColor: "#F20505",
  },
  favoriteTypeButtonText: {
    color: "#555",
    fontSize: 16,
  },
  selectedFavoriteTypeButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  deleteButton: {
    position: "absolute",
    top: 10,
    right: 10,
  },
});

const stylesDark = StyleSheet.create({
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.9)",
  },
  headerText: {
    color: "#fff",
  },
  sectionTitle: {
    color: "#F20505",
  },
  addressItem: {
    borderBottomColor: "#555",
  },
  label: {
    color: "#fff",
  },
  address: {
    color: "#ccc",
  },
  typeAddress: {
    color: "#ccc",
  },
  modalContent: {
    backgroundColor: "#1c1c1c",
  },
  modalTitle: {
    color: "#F20505",
  },
  input: {
    borderColor: "#555",
    color: "#fff",
    backgroundColor: "#333",
  },
  modalLabel: {
    color: "#fff",
  },
  modalAddress: {
    color: "#ccc",
  },
  closeButton: {
    backgroundColor: "#F20505",
  },
  closeButtonText: {
    color: "#fff",
  },
});

const stylesFavorite = StyleSheet.create({
  backgroundImage: stylesLight.backgroundImage,
  overlay: stylesLight.overlay,
  container: stylesLight.container,
  header: stylesLight.header,
  headerText: stylesLight.headerText,
  addButton: stylesLight.addButton,
  sectionTitle: stylesLight.sectionTitle,
  addressItem: stylesLight.addressItem,
  iconLabelContainer: stylesLight.iconLabelContainer,
  label: stylesLight.label,
  address: stylesLight.address,
  typeAddress: stylesLight.typeAddress,
  modalContainer: stylesLight.modalContainer,
  modalContent: stylesLight.modalContent,
  modalTitle: stylesLight.modalTitle,
  input: stylesLight.input,
  autocompleteContainer: stylesLight.autocompleteContainer,
  autocompleteListView: stylesLight.autocompleteListView,
  saveButton: stylesLight.saveButton,
  saveButtonText: stylesLight.saveButtonText,
  cancelButton: stylesLight.cancelButton,
  cancelButtonText: stylesLight.cancelButtonText,
  modalLabel: stylesLight.modalLabel,
  modalAddress: stylesLight.modalAddress,
  closeButton: stylesLight.closeButton,
  closeButtonText: stylesLight.closeButtonText,
  favoriteIcon: stylesLight.favoriteIcon,
  favoriteTypeContainer: stylesLight.favoriteTypeContainer,
  favoriteTypeButton: stylesLight.favoriteTypeButton,
  selectedFavoriteTypeButton: stylesLight.selectedFavoriteTypeButton,
  favoriteTypeButtonText: stylesLight.favoriteTypeButtonText,
  selectedFavoriteTypeButtonText: stylesLight.selectedFavoriteTypeButtonText,
  deleteButton: stylesLight.deleteButton,
});
