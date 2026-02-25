import React, { useEffect, useState, useRef } from "react";
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
  Animated,
  ScrollView,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
/* import { createClient } from '@supabase/supabase-js'; */
import { useDispatch, useSelector } from "react-redux";
import { fetchAndDispatchUserData } from "./../../common/actions/userActions"; // Ajusta si cambias esto
import { RootState } from "./../../common/store";
import { AntDesign, Entypo } from "@expo/vector-icons";
import { settings } from "@/scripts/settings";

type Props = NativeStackScreenProps<any>;

// Cliente Supabase (usa tu config existente o crea uno)
/* const supabaseUrl = 'TU_SUPABASE_URL';
const supabaseKey = 'TU_SUPABASE_ANON_KEY'; */
/* const supabase = createClient(supabaseUrl, supabaseKey); */

import supabase from '@/config/SupabaseConfig'; // ajusta la ruta a tu SupabaseConfig.ts
 

const LoginScreen = ({ navigation }: Props) => {
  const [email, setEmail] = useState(""); 
  const [password, setPassword] = useState(""); 
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const colorScheme = useColorScheme();
  
  // Animación de entrada desde la derecha
  const slideAnim = useRef(new Animated.Value(500)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
 
  const user = useSelector((state: RootState) => state.auth.user);
  
  // Animar entrada de la pantalla
  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [slideAnim, opacityAnim]);

  useEffect(() => {
    // Listener de auth state en Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await fetchAndDispatchUserData(session.user.id, dispatch);
        navigateBasedOnUserType();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      if (data.user) {
        await fetchAndDispatchUserData(data.user.id, dispatch);
        navigateBasedOnUserType();
      }
    } catch (error: any) {
      let message = "Error de autenticación";
      if (error.message.includes('Invalid login credentials')) {
        message = "Correo o contraseña incorrectos.";
      } else if (error.message.includes('Email not confirmed')) {
        message = "Verifica tu email antes de iniciar sesión.";
      }  
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      Alert.alert("Error", "Ingresa tu correo electrónico.");
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'tu-app://reset-password/' // Ajusta a tu deep link
      });
      if (error) throw error;
      Alert.alert("Listo", "Revisa tu email para el enlace de reseteo.");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const navigateBasedOnUserType = () => {
    const userType = user?.user_metadata?.usertype;
    if (userType) {
      switch (userType) {
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
          console.error("Tipo de usuario desconocido:", userType);
      }
    }
  };

  // Funciones openTerms, openPolitics, openTreatment iguales...
  const openTerms = async () => {
    Linking.openURL(settings.CompanyTermCondition).catch(console.error);
  };
  // ... (mismo para los otros)

  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
        >
          <ImageBackground source={require("./../../assets/images/login.jpg")} resizeMode="cover" style={styles.background}>
          <Animated.View
            style={{
              flex: 1,
              transform: [{ translateX: slideAnim }],
              opacity: opacityAnim,
            }}
          >
            <View style={styles.container}>
              <View style={[styles.card, styles.glassEffect]}>
              <View style={styles.logo}>
                <Image source={require("./../../assets/images/logo1024x1024.png")} style={{ width: 120, height: 110, borderRadius: 23 }} />
              </View>
              <View style={styles.form}>
                <Text style={styles.title}>Iniciar Sesión</Text>
                <View style={[styles.inputContainer, styles.inputLight]}>
                  <TextInput
                    style={[styles.inputInner, { color: '#fff' }]}
                    placeholder="Email"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                    onBlur={Keyboard.dismiss}
                    placeholderTextColor="rgba(255,255,255,0.8)"
                    editable={!loading}
                    autoCapitalize="none"
                  />
                </View>
                <View style={[styles.inputContainer, styles.passwordContainer, styles.inputLight]}>
                  <TextInput
                    style={[styles.inputInner, { color: '#fff' }]}
                    placeholder="Contraseña"
                    secureTextEntry={!isPasswordVisible}
                    value={password}
                    onChangeText={setPassword}
                    onBlur={Keyboard.dismiss}
                    placeholderTextColor="rgba(255,255,255,0.8)"
                    editable={!loading}
                  />
                  <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)} style={styles.iconInside} disabled={loading}>
                    {isPasswordVisible ? <AntDesign name="eye" size={20} color="#fff" /> : <Entypo name="eye-with-line" size={20} color="#fff" />}
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
                  <Text style={styles.buttonText}>{loading ? "Iniciando..." : "Iniciar Sesión"}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handlePasswordReset} disabled={loading}>
                  <Text style={[styles.text, styles.link]}>Olvidé mi contraseña</Text>
                </TouchableOpacity>
                <Text style={styles.text}>
                  ¿No tienes cuenta? <Text style={styles.link} onPress={() => navigation.navigate("SignUp")}>Registrarse</Text>
                </Text>
                {/* Links a términos iguales */}
              </View>
            </View>
          </View>
          </Animated.View>
        </ImageBackground>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  background: { flex: 1, width: '100%', height: '100%' },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  card: { width: '100%', maxWidth: 420, borderRadius: 20, padding: 20, backgroundColor: 'rgba(255,255,255,0.1)' },
  glassEffect: { 
    borderColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 1.5,
    shadowColor: 'rgba(255, 255, 255, 0.15)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 5,
  },
  logo: { alignItems: 'center', marginBottom: 16 },
  form: { marginTop: 12 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 20, textAlign: 'center', color: '#fff' },
  inputContainer: { width: '100%', height: 48, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.3)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, marginBottom: 14, backgroundColor: 'rgba(255, 255, 255, 0.08)' },
  inputInner: { flex: 1, height: '100%', paddingHorizontal: 8, color: '#fff', fontSize: 15, fontWeight: '500' },
  inputDark: { backgroundColor: 'rgba(255, 255, 255, 0.08)', borderColor: 'rgba(255, 255, 255, 0.3)' },
  inputLight: { backgroundColor: 'rgba(255, 255, 255, 0.08)', borderColor: 'rgba(255, 255, 255, 0.3)' },
  inputFlex: { flex: 1 },
  passwordContainer: { width: '100%' },
  iconInside: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  button: { backgroundColor: '#f20505', paddingVertical: 14, borderRadius: 16, alignItems: 'center', marginTop: 12, shadowColor: '#f20505', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  text: { textAlign: 'center', color: '#fff', marginTop: 12, fontSize: 14 },
  link: { color: '#fff', fontWeight: '700', textDecorationLine: 'underline' }
});

export default LoginScreen;
