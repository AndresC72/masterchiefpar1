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
 
  const user = useSelector((state: RootState) => state.auth.user);

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
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ImageBackground source={require("./../../assets/images/login.jpg")} resizeMode="cover" style={styles.background}>
          <View style={styles.container}>
            <View style={[styles.card, styles.blurEffect]}>
              <View style={styles.logo}>
                <Image source={require("./../../assets/images/logo1024x1024.png")} style={{ width: 120, height: 110, borderRadius: 23 }} />
              </View>
              <View style={styles.form}>
                <Text style={styles.title}>Iniciar Sesión</Text>
                <View style={[styles.inputContainer, colorScheme === 'dark' ? styles.inputDark : styles.inputLight]}>
                  <TextInput
                    style={[styles.inputInner, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}
                    placeholder="Email"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                    placeholderTextColor={colorScheme === "dark" ? "#aaaaaa" : "#555555"}
                    editable={!loading}
                    autoCapitalize="none"
                  />
                </View>
                <View style={[styles.inputContainer, styles.passwordContainer, colorScheme === 'dark' ? styles.inputDark : styles.inputLight]}>
                  <TextInput
                    style={[styles.inputInner, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}
                    placeholder="Contraseña"
                    secureTextEntry={!isPasswordVisible}
                    value={password}
                    onChangeText={setPassword}
                    placeholderTextColor={colorScheme === "dark" ? "#aaaaaa" : "#555555"}
                    editable={!loading}
                  />
                  <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)} style={styles.iconInside} disabled={loading}>
                    {isPasswordVisible ? <AntDesign name="eye" size={20} color={colorScheme === 'dark' ? '#fff' : '#000'} /> : <Entypo name="eye-with-line" size={20} color={colorScheme === 'dark' ? '#fff' : '#000'} />}
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
        </ImageBackground>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  background: { flex: 1, width: '100%', height: '100%' },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  card: { width: '100%', maxWidth: 420, borderRadius: 12, padding: 16, backgroundColor: 'rgba(255,255,255,0.9)' },
  blurEffect: { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  logo: { alignItems: 'center', marginBottom: 8 },
  form: { marginTop: 8 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  inputContainer: { width: '100%', maxWidth: 420, height: 48, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, marginBottom: 12 },
  inputInner: { flex: 1, height: '100%', paddingHorizontal: 8 },
  inputDark: { backgroundColor: '#333', borderColor: '#333' },
  inputLight: { backgroundColor: '#F6F6F6', borderColor: '#ddd' },
  inputFlex: { flex: 1 },
  passwordContainer: { width: '100%' },
  iconInside: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  button: { backgroundColor: '#007AFF', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: '600' },
  text: { textAlign: 'center', color: '#333', marginTop: 8 },
  link: { color: '#007AFF', fontWeight: '600' }
});

export default LoginScreen;
