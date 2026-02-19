import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  ImageBackground,
  Alert,
  Modal,
  Linking,
  ActivityIndicator,
  useColorScheme,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import supabase from '@/config/SupabaseConfig';
import { settings } from "@/scripts/settings";
import { Ionicons } from "@expo/vector-icons";

export default function SignUp({ navigation }: NativeStackScreenProps<any>) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [mobile, setMobile] = useState("");
  const [usertype, setUsertype] = useState("");
  const [isModalVisible, setModalVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  const [referralId, setReferralId] = useState("");
  const [isCheckingReferral, setIsCheckingReferral] = useState(false);

  const [signupViaReferral, setSignupViaReferral] = useState("");
  const [walletBalance, setWalletBalance] = useState(0);

  const colorScheme = useColorScheme(); // Hook para detectar modo claro/oscuro

  const handleReferralChange = (text: string) => {
    setReferralId(text.toUpperCase());
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  useEffect(() => {
    const validateFields = () => {
      if (
        email !== "" &&
        password !== "" &&
        confirmPassword !== "" &&
        firstName !== "" &&
        lastName !== "" &&
        mobile !== ""
      ) {
        setIsButtonDisabled(false);
      } else {
        setIsButtonDisabled(true);
      }
    };
    validateFields();
  }, [email, password, confirmPassword, firstName, lastName, mobile, usertype]);

  useEffect(() => {
    if (usertype) {
      handleSignUp();
    }
  }, [usertype]);

  const handleSignUp = async () => {
    if (!usertype) {
      Alert.alert("Error", "El tipo de usuario no está definido.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden");
      return;
    }

    try {
      // Create user with Supabase
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      const user = data?.user;

      if (user && user?.email_confirmed_at) {
        const newUserId = user.id;
        const userData = {
          firstName,
          lastName,
          email,
          mobile,
          uid: newUserId,
          usertype,
          verifyId: "",
          referralId: [...Array(5)]
            .map(() => "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)])
            .join(""),
          reviewed: false,
          blocked: false,
          approved: true,
          city: "",
          signupViaReferral: referralId !== "" ? signupViaReferral : "",
          walletBalance: referralId !== "" ? 600 : 0,
          createdAt: Date.now(),
        };

        const { error: insertError } = await supabase.from('users').insert(userData);
        if (insertError) {
          console.warn('Error inserting user profile:', insertError.message);
        }

        Alert.alert('Registro exitoso', 'Usuario registrado y confirmado.');
        navigation.navigate('EmailVerification', { email });
        return;
      }

      Alert.alert(
        'Registro iniciado',
        'Hemos enviado un enlace para verificar tu correo. Revisa tu email y luego inicia sesión.'
      );
      navigation.navigate('EmailVerification', { email });
    } catch (error: any) {
      let errorMessage = error?.message || 'Error desconocido';
      // Map some common Supabase errors
      if (error?.status === 400 || (errorMessage && errorMessage.includes('already'))) {
        errorMessage = 'Este correo ya está registrado. Intenta iniciar sesión.';
      }
      Alert.alert('Error de registro', errorMessage);
    }
  };

  const handleRegisterPress = () => {
    setModalVisible(true);
  };

  const handleUserTypeSelect = (type: string) => {
    setUsertype(type);
    setModalVisible(false);
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
          style={styles.background(colorScheme)}
        >
          <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
            <View style={styles.container}>
              <View style={[styles.card, styles.blurEffect]}>
                <View style={styles.logo}>
                  <Image
                    source={require("./../../assets/images/logo1024x1024.png")}
                    style={{ width: 120, height: 110, borderRadius: 23 }}
                  />
                </View>
                <View style={styles.form}>
                  <Text style={styles.title(colorScheme)}>REGISTRO</Text>
                  <TextInput
                    style={styles.input(colorScheme)}
                    placeholderTextColor={
                      colorScheme === "dark" ? "#aaaaaa" : "#555555"
                    } // Ajuste del color del placeholder
                    placeholder="Nombre"
                    value={firstName}
                    onChangeText={setFirstName}
                  />
                  <TextInput
                    style={styles.input(colorScheme)}
                    placeholderTextColor={
                      colorScheme === "dark" ? "#aaaaaa" : "#555555"
                    } // Ajuste del color del placeholder
                    placeholder="Apellido"
                    value={lastName}
                    onChangeText={setLastName}
                  />
                  <TextInput
                    style={styles.input(colorScheme)}
                    placeholderTextColor={
                      colorScheme === "dark" ? "#aaaaaa" : "#555555"
                    } // Ajuste del color del placeholder
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                  />
                  <TextInput
                    style={styles.input(colorScheme)}
                    placeholderTextColor={
                      colorScheme === "dark" ? "#aaaaaa" : "#555555"
                    } // Ajuste del color del placeholder
                    placeholder="Número de teléfono"
                    value={mobile}
                    onChangeText={setMobile}
                    keyboardType="phone-pad"
                  />
                  <View style={[styles.inputContainer, colorScheme === 'dark' ? styles.inputDark : styles.inputLight]}>
                    <TextInput
                      style={[styles.inputInner, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}
                      placeholderTextColor={
                        colorScheme === "dark" ? "#aaaaaa" : "#555555"
                      }
                      placeholder="Contraseña"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity onPress={togglePasswordVisibility} style={styles.iconInside}>
                      <Ionicons
                        name={showPassword ? "eye-off" : "eye"}
                        size={20}
                        color={colorScheme === "dark" ? "#fff" : "#000"}
                      />
                    </TouchableOpacity>
                  </View>

                  <View style={[styles.inputContainer, colorScheme === 'dark' ? styles.inputDark : styles.inputLight]}>
                    <TextInput
                      style={[styles.inputInner, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}
                      placeholderTextColor={
                        colorScheme === "dark" ? "#aaaaaa" : "#555555"
                      }
                      placeholder="Confirmar Contraseña"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity onPress={togglePasswordVisibility} style={styles.iconInside}>
                      <Ionicons
                        name={showPassword ? "eye-off" : "eye"}
                        size={20}
                        color={colorScheme === "dark" ? "#fff" : "#000"}
                      />
                    </TouchableOpacity>
                  </View>

                  <TextInput
                    style={styles.input(colorScheme)}
                    placeholderTextColor={
                      colorScheme === "dark" ? "#aaaaaa" : "#555555"
                    } // Ajuste del color del placeholder
                    placeholder="Código de referido"
                    value={referralId}
                    onChangeText={handleReferralChange}
                    editable={!isCheckingReferral}
                  />

                  <TouchableOpacity
                    style={[
                      styles.button,
                      isButtonDisabled
                        ? styles.buttonDisabled(colorScheme)
                        : styles.buttonEnabled(colorScheme),
                    ]}
                    onPress={handleRegisterPress}
                    disabled={isButtonDisabled || isCheckingReferral}
                  >
                    {isCheckingReferral ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <Text style={styles.buttonText}>Registrarme</Text>
                    )}
                  </TouchableOpacity>

                  <Text style={styles.text(colorScheme)}>
                    Ya tienes una cuenta?{" "}
                    <Text
                      style={styles.link(colorScheme)}
                      onPress={() => navigation.navigate("Login")}
                    >
                      Iniciar sesión
                    </Text>
                  </Text>

                  <View>
                    <TouchableOpacity onPress={openPolitics}>
                      <Text style={styles.text(colorScheme)}>
                        ✔ Política y privacidad
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={openTerms}>
                      <Text style={styles.text(colorScheme)}>
                        ✔ Términos y Condiciones
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={openTreatment}>
                      <Text style={styles.text(colorScheme)}>
                        ✔ Tratamiento de Datos
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>

            <Modal
              visible={isModalVisible}
              transparent={true}
              animationType="slide"
              onRequestClose={() => setModalVisible(false)}
            >
              <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Selecciona:</Text>

                  <TouchableOpacity
                    style={styles.modalButton1(colorScheme)}
                    onPress={() => handleUserTypeSelect("driver")}
                  >
                    <Image
                      source={require("@/assets/images/TREAS-X.png")}
                      style={{ width: 50, height: 50 }}
                    />
                    <Text style={styles.modalButtonText}>Conductor</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalButton(colorScheme)}
                    onPress={() => handleUserTypeSelect("customer")}
                  >
                    <Image
                      source={require("@/assets/images/Avatar/11.png")}
                      style={{ width: 40, height: 40 }}
                    />
                    <Text style={styles.modalButtonText1}>Cliente</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          </ScrollView>
        </ImageBackground>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  background: (colorScheme: string) => ({
    flex: 1,
    backgroundColor: colorScheme === "dark" ? "#000" : "#fff", // Dinámico según el modo oscuro
  }),
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    height: 120,
    marginBottom: 20,
    alignItems: "center",
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    padding: 20,
    borderRadius: 10,
    width: "90%",
  },
  blurEffect: {
    borderRadius: 10,
    overflow: "hidden",
    borderColor: "rgba(255, 255, 255, 0.6)",
  },
  form: {
    alignItems: "center",
  },
  title: (colorScheme: string) => ({
    fontSize: 24,
    marginBottom: 20,
    fontWeight: "bold",
    color: "#fff",
  }),
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
  buttonEnabled: (colorScheme: string) => ({
    backgroundColor: colorScheme === "dark" ? "#555" : "black",
  }),
  buttonDisabled: (colorScheme: string) => ({
    backgroundColor: colorScheme === "dark" ? "#777" : "gray",
  }),
  button: {
    width: "100%",
    padding: 15,
    borderRadius: 16,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
  },
  text: (colorScheme: string) => ({
    marginTop: 10,
    color: colorScheme === "dark" ? "#fff" : "#000", // Dinámico según el modo oscuro
  }),
  link: (colorScheme: string) => ({
    color: colorScheme === "dark" ? "#FF4081" : "#F20505",
    fontWeight: "bold",
  }),
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  modalButton: (colorScheme: string) => ({
    width: "100%",
    padding: 15,
    backgroundColor: colorScheme === "dark" ? "#000" : "#ffdddd",
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "center",
  }),
  modalButton1: (colorScheme: string) => ({
    width: "100%",
    padding: 15,
    backgroundColor: colorScheme === "dark" ? "#444" : "#000",
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "center",
  }),
  modalButtonText: {
    color: "white",
    fontSize: 16,
  },
  modalButtonText1: {
    color: "red",
    fontSize: 16,
  },
  passwordContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    marginBottom: 10,
  },
  passwordInput: (colorScheme: string) => ({
    flex: 1,
    padding: 10,
    color: colorScheme === "dark" ? "#444" : "#000",
  }),
  eyeIcon: {
    padding: 10,
    right: 1,
    bottom: 6,
    position: "absolute",
  },
  inputContainer: {
    width: '100%',
    paddingHorizontal: 10,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  inputInner: {
    flex: 1,
    height: '100%',
  },
  inputDark: {
    backgroundColor: '#333',
    borderColor: '#444',
  },
  inputLight: {
    backgroundColor: '#F6F6F6',
    borderColor: '#ddd',
  },
  iconInside: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
