import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, FlatList, Dimensions, Modal, Alert, useColorScheme } from 'react-native';
import { Ionicons, AntDesign, MaterialIcons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSelector } from "react-redux";
import { RootState } from "@/common/store";
import * as ImagePicker from "expo-image-picker";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getDatabase, ref as dbRef, update } from "firebase/database";

type Props = NativeStackScreenProps<any>;

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.8;
const CARD_HEIGHT = CARD_WIDTH * 0.6;

const ImageGalleryComponent = ({ navigation, route }: Props) => {
    const colorScheme = useColorScheme();
    const user = useSelector((state: RootState) => state.auth.user);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const { data } = route.params || {}; // Recibir los datos pasados y evitar crash si no viene
    console.log(data, "dataaaaaa")
    const [images, setImages] = useState(() => {
        if (user?.usertype === 'customer') {
            return [
                { uri: user?.verifyIdImage, name: "Cedula Frente", nameStorage: "verifyIdImage" }
            ];
        } else {
            return [
                { uri: user?.verifyIdImage, name: "Cedula Frente", nameStorage: "verifyIdImage" },
                { uri: user?.verifyIdImageBk, name: "Cedula Posterior", nameStorage: "verifyIdImageBk" },
                { uri: user?.SOATImage, name: "SOAT", nameStorage: "SOATImage" },
                { uri: user?.cardPropImage, name: "Tarjeta de Propiedad Frente", nameStorage: "cardPropImage" },
                { uri: user?.cardPropImageBK, name: "Tarjeta de Propiedad Posterior", nameStorage: "cardPropImageBK" },
                { uri: user?.licenseImage, name: "Licencia Frente", nameStorage: "licenseImage" },
                { uri: user?.licenseImageBack, name: "Licencia Posterior", nameStorage: "licenseImageBack" },
            ];
        }
    });

    const handleImagePress = (image) => {
        setSelectedImage(image);
        setModalVisible(true);
    };

    const updateImageInList = (uri, imageName) => {
        setImages((prevImages) =>
            prevImages.map((image) =>
                image.nameStorage === imageName ? { ...image, uri: uri } : image
            )
        );
    };

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [5, 3],
            quality: 0.7,
        });

        if (!result.canceled) {
            const uri = result.assets[0].uri;
            updateImageInList(uri, selectedImage.nameStorage);
            await processImage(uri, selectedImage.nameStorage);
            setModalVisible(false); // Cerrar el modal después de seleccionar una imagen
        }
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert("Permiso denegado", "Se requiere acceso a la cámara para tomar fotos.");
            return;
        }

        let result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [5, 3],
            quality: 0.7,
        });

        if (!result.canceled) {
            const uri = result.assets[0].uri;
            updateImageInList(uri, selectedImage.nameStorage);
            await processImage(uri, selectedImage.nameStorage);
            setModalVisible(false); // Cerrar el modal después de tomar una foto
        }
    };

    const processImage = async (uri: string, imageName: string) => {
        if (!user?.uid) {
            Alert.alert("Error", "El usuario no está autenticado.");
            return;
        }

        try {
            const storage = getStorage();
            const storageRef = ref(storage, `users/${user.uid}/${imageName}`);

            const response = await fetch(uri);
            const blob = await response.blob();

            await uploadBytes(storageRef, blob);
            const downloadURL = await getDownloadURL(storageRef);

            const db = getDatabase();
            const updates = {};
            updates[`/users/${user.uid}/${imageName}`] = downloadURL;

            await update(dbRef(db), updates);

            //console.log(`${imageName} actualizada exitosamente.`);
        } catch (error) {
            console.error("Error al procesar la imagen:", error);
            Alert.alert("Error", "No se pudo actualizar la imagen. Por favor, intenta de nuevo.");
        }
    };

    const handleUpdate = async () => {
        //console.log("Imágenes actualizadas en el servidor");
        Alert.alert("Actualización", "Las imágenes se han actualizado exitosamente.");
    };

    return (
        <View style={[styles.container, colorScheme === 'dark' ? styles.containerDark : styles.containerLight]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => {
                    if (data === 'Process') {
                        navigation.navigate('Map', { openModal: true });
                    } else {
                        navigation.goBack();
                    }
                }}>
                    <AntDesign name="arrowleft" size={24} color={colorScheme === 'dark' ? '#fff' : 'black'} />
                </TouchableOpacity>
                <Text style={[styles.headerText, colorScheme === 'dark' ? styles.textDark : styles.textLight]}>{"Documentos"} </Text>
                <Ionicons
                    name="images-outline"
                    size={24}
                    color={colorScheme === 'dark' ? '#fff' : 'black'}
                    style={styles.headerIcon}
                />
            </View>
            <View style={styles.carouselContainer}>
                <FlatList
                    data={images} // Solo se muestran las imágenes filtradas si es customer
                    horizontal
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item }) => (
                        <TouchableOpacity onPress={() => handleImagePress(item)}>
                            <View style={[styles.cardContainer, colorScheme === 'dark' ? styles.cardDark : styles.cardLight]}>
                                <Text style={[styles.imageLabel, colorScheme === 'dark' ? styles.labelDark : styles.labelLight]}>{item.name}</Text>
                                {item.uri ? (
                                    <Image source={{ uri: item.uri }} style={styles.galleryImage} />
                                ) : (
                                    <View style={styles.noImageContainer}>
                                        <Text style={styles.noImageText}> 🖼️Tocar para subir la imagen </Text>
                                    </View>
                                )}
                            </View>
                        </TouchableOpacity>
                    )}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                    pagingEnabled
                    snapToAlignment="center"
                    decelerationRate="fast"
                    snapToInterval={CARD_WIDTH}
                />
                <TouchableOpacity style={styles.updateButton} onPress={handleUpdate}>
                    <Text style={styles.updateButtonText}>Actualizar Ahora</Text>
                </TouchableOpacity>
            </View>
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={[styles.modalView, colorScheme === 'dark' ? styles.modalDark : styles.modalLight]}>
                        <Text style={[styles.modalText, colorScheme === 'dark' ? styles.textDark : styles.textLight]}>SELECCIONA UNA OPCIÓN</Text>
                        <TouchableOpacity style={styles.button} onPress={pickImage}>
                            <Ionicons name="images" size={24} color="white" style={styles.modalIcon} />
                            <Text style={styles.buttonText}>Cargar Imagen</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.buttonLoad} onPress={takePhoto}>
                            <Ionicons name="camera" size={24} color="white" style={styles.modalIcon} />
                            <Text style={styles.buttonText}>Tomar Foto</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => setModalVisible(false)}
                        >
                            <MaterialIcons name="cancel" size={24} color="white" style={styles.modalIcon} />
                            <Text style={styles.cancelButtonText}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    containerLight: {
        backgroundColor: "#F5F5F5",
    },
    containerDark: {
        backgroundColor: "#121212",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginHorizontal: 20,
        marginVertical: 10,
    },
    headerText: {
        fontSize: 24,
        fontWeight: "bold",
    },
    textLight: {
        color: "#000",
    },
    textDark: {
        color: "#fff",
    },
    headerIcon: {
        backgroundColor: "#E0E0E0",
        borderRadius: 12,
        padding: 4,
    },
    carouselContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    scrollContent: {
        alignItems: 'center',
    },
    cardContainer: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        marginHorizontal: 10,
        borderRadius: 10,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.58,
        shadowRadius: 16.00,
        elevation: 24,
    },
    cardLight: {
        backgroundColor: '#fff',
    },
    cardDark: {
        backgroundColor: '#1e1e1e',
    },
    imageLabel: {
        position: 'absolute',
        top: 5,
        left: 5,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 5,
        zIndex: 1,
        overflow: 'hidden',
    },
    labelLight: {
        backgroundColor: 'rgba(255, 0, 0, 0.49)',
        color: '#fff',
    },
    labelDark: {
        backgroundColor: 'rgba(255, 0, 0, 0.7)',
        color: '#fff',
    },
    galleryImage: {
        width: '100%',
        height: '100%',
    },
    modalContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    modalView: {
        width: 320,
        borderRadius: 20,
        padding: 25,
        alignItems: "center",
        elevation: 10,
    },
    modalLight: {
        backgroundColor: "white",
    },
    modalDark: {
        backgroundColor: "#2c2c2c",
    },
    modalText: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 20,
    },
    button: {
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
    buttonLoad: {
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
    buttonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "bold",
    },
    modalIcon: {
        marginRight: 10,
    },
    cancelButton: {
        flexDirection: "row",
        alignItems: "center",
        padding: 15,
        borderRadius: 10,
        marginTop: 10,
        width: "100%",
        justifyContent: "center",
        elevation: 5,
        borderWidth: 1,
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: "bold",
    },
    updateButton: {
        backgroundColor: '#f20505',
        padding: 15,
        borderRadius: 23,
        alignItems: 'center',
        marginLeft: 60,
        marginRight: 60,
        marginBottom: 50
    },
    updateButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    noImageContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f0f0', // Opcional: color de fondo para el marcador
    },
    noImageText: {
        color: '#888', // Opcional: color para el texto del marcador
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default ImageGalleryComponent;
