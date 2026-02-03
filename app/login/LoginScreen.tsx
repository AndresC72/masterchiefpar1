import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  ImageBackground,
  Alert,
  Linking,
  useColorScheme,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Platform,
  Keyboard,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from "firebase/auth";
import { useDispatch, useSelector } from "react-redux";
import { auth } from "@/config/SupabaseConfig.js";
import { fetchAndDispatchUserData } from "./../../common/actions/userActions";
import { RootState } from "./../../common/store";
import { AntDesign, Entypo } from "@expo/vector-icons";
import { settings } from "@/scripts/settings";

type Props = NativeStackScreenProps<any>;

const LoginScreen = ({ navigation }: Props) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const dispatch = useDispatch();
  const colorScheme = useColorScheme(); // Hook para detectar modo claro/oscuro

  const user = useSelector((state: RootState) => state.auth.user);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await fetchAndDispatchUserData(user.uid, dispatch);
        navigateBasedOnUserType();
      }
    });

    return () => unsubscribe();
  }, [user]);

  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      await fetchAndDispatchUserData(user.uid, dispatch);
      navigateBasedOnUserType();
    } catch (error) {
      switch (error.code) {
        case "auth/invalid-email":
          Alert.alert(
            "Error en el correo",
            "El correo electrónico no es válido."
          );
          break;
        case "auth/user-not-found":
          Alert.alert(
            "Usuario no encontrado",
            "No se encontró ninguna cuenta con este correo."
          );
          break;
        case "auth/wrong-password":
          Alert.alert("Error en la contraseña", "La contraseña es incorrecta.");
          break;
        default:
          Alert.alert("Error de autenticación", error.message);
          break;
      }
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      Alert.alert(
        "Error",
        "Por favor, ingresa tu dirección de correo electrónico."
      );
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert(
        "Correo enviado",
        "Revisa tu bandeja de entrada para restablecer tu contraseña."
      );
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  const navigateBasedOnUserType = () => {
    if (user) {
      switch (user.usertype) {
        case "driver":
          navigation.navigate("Map");
          break;
        case "customer":
          navigation.navigate("CustMap");
          break;
        case "company":
          navigation.navigate("CompanyHome");
          break;
        default:
          console.error("Unknown user type");
          break;
      }
    }
  };

  const openTerms = async () => {
    Linking.openURL(settings.CompanyTermCondition).catch((err) =>
      console.error("Couldn't load page", err)
    );
  };
  const openPolitics = async () => {
    Linking.openURL(settings.CompanyPolitics).catch((err) =>
      console.error("Couldn't load page", err)
    );
  };
  const openTreatment = async () => {
    Linking.openURL(settings.CompanyTreatment).catch((err) =>
      console.error("Couldn't load page", err)
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"} // Ajuste específico para iOS
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ImageBackground
          source={require("./../../assets/images/login.jpg")}
          resizeMode="cover"
          style={styles.background}
        >
          <View style={styles.container}>
            <View style={[styles.card, styles.blurEffect]}>
              <View style={styles.logo}>
                <Image
                  source={require("./../../assets/images/logo1024x1024.png")}
                  style={{ width: 120, height: 110, borderRadius: 23 }}
                />
              </View>
              <View style={styles.form}>
                <Text style={styles.title}>Iniciar Sesión</Text>
                <TextInput
                  style={styles.input(colorScheme)}
                  placeholderTextColor={
                    colorScheme === "dark" ? "#aaaaaa" : "#555555"
                  } // Ajuste del color del placeholder
                  placeholder="Email"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={(text) => setEmail(text)}
                />
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.input(colorScheme)}
                    placeholder="Contraseña"
                    placeholderTextColor={
                      colorScheme === "dark" ? "#aaaaaa" : "#555555"
                    } // Ajuste del color del placeholder
                    secureTextEntry={!isPasswordVisible}
                    value={password}
                    onChangeText={(text) => setPassword(text)}
                  />
                  <TouchableOpacity
                    onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                    style={styles.eyeIcon}
                  >
                    {isPasswordVisible ? (
                      <AntDesign name="eye" size={24} color="black" />
                    ) : (
                      <Entypo name="eye-with-line" size={24} color="black" />
                    )}
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.button} onPress={handleLogin}>
                  <Text style={styles.buttonText}>Iniciar Sesión</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handlePasswordReset}>
                  <Text style={[styles.text, styles.link]}>
                    Olvidé mi contraseña
                  </Text>
                </TouchableOpacity>
                <Text style={styles.text}>
                  No tienes cuenta?{" "}
                  <Text
                    style={styles.link}
                    onPress={() => navigation.navigate("SignUp")}
                  >
                    Registrarse
                  </Text>
                </Text>

                <View>
                  <>
                    <TouchableOpacity onPress={openPolitics}>
                      <Text style={styles.text}>
                        ✔{"Política y privacidad"}
                      </Text>
                    </TouchableOpacity>
                  </>
                  <>
                    <TouchableOpacity onPress={openTerms}>
                      <Text style={styles.text}>
                        ✔{"Términos y Condiciones"}
                      </Text>
                    </TouchableOpacity>
                  </>
                  <>
                    <TouchableOpacity onPress={openTreatment}>
                      <Text style={styles.text}>✔ Tratamiento de Datos</Text>
                    </TouchableOpacity>
                  </>
                </View>
              </View>
            </View>
          </View>
        </ImageBackground>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    height: 120,
    marginBottom: 20,
    display: "flex",
    alignItems: "center",
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.5)", // Tarjeta semi-transparente
    padding: 20,
    borderRadius: 10,
    width: "90%",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.8,
    shadowRadius: 3.84,
    elevation: 5,
  },
  blurEffect: {
    borderRadius: 23,
    overflow: "hidden",
    // borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.6)", // Color del borde similar al fondo para el efecto borroso
  },
  form: {
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    color: "#F6F6F6",
    fontWeight: "bold",
  },
  input: (colorScheme: string) => ({
    width: "100%",
    padding: 10,
    borderWidth: 1,
    borderColor: colorScheme === "dark" ? "#444" : "#ddd",
    borderRadius: 16,
    marginBottom: 10,
    color: colorScheme === "dark" ? "#fff" : "#000", 
    backgroundColor: colorScheme === "dark" ? "#333" : "#F6F6F6",
  }),
  passwordContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    //borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 23,
    // backgroundColor: "#F6F6F6",
  },
  eyeIcon: {
    padding: 10,
    right: 1,
    bottom: 6,
    position: "absolute",
  },
  button: {
    width: "100%",
    padding: 15,
    backgroundColor: "black",
    borderRadius: 23,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
  },
  text: {
    marginTop: 10,
    color: "#fff",
  },
  link: {
    color: "#F20505",
    fontWeight: "bold",
  },
});

export default LoginScreen;
