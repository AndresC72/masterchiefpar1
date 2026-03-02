import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  ScrollView,
  KeyboardAvoidingView,
  Keyboard,
  Alert,
  ImageBackground,
  Modal,
  FlatList,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useDispatch, useSelector } from "react-redux";
import { fetchAndDispatchUserData } from "./../../common/actions/userActions";
import { RootState } from "./../../common/store";
import { AntDesign, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import supabase from '@/config/SupabaseConfig';

type Props = NativeStackScreenProps<any>;

const THEME = {
  darkBg: '#01060a',
  darkerBg: '#000305',
  primaryNavy: '#04273a',
  primaryCyan: '#15e5e9',
  textMain: '#ffffff',
  textMuted: '#8aa1b1',
  glassBg: 'rgba(4, 39, 58, 0.15)',
  glassBorder: 'rgba(21, 229, 233, 0.2)',
  errorColor: '#ff7f7f',
};

const COUNTRIES = [
  { code: '+57', flag: '🇨🇴', name: 'Colombia', dialCode: '+57' },
  { code: '+1', flag: '🇺🇸', name: 'Estados Unidos', dialCode: '+1' },
  { code: '+44', flag: '🇬🇧', name: 'Reino Unido', dialCode: '+44' },
  { code: '+56', flag: '🇨🇱', name: 'Chile', dialCode: '+56' },
  { code: '+55', flag: '🇧🇷', name: 'Brasil', dialCode: '+55' },
  { code: '+34', flag: '🇪🇸', name: 'España', dialCode: '+34' },
];

const LoginScreen = ({ navigation }: Props) => {
  // Auth states
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  
  // additional registration states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [mobile, setMobile] = useState("");
  const [usertype, setUsertype] = useState("");
  const [countryCode, setCountryCode] = useState("+57");
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showUserTypeModal, setShowUserTypeModal] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [phoneExists, setPhoneExists] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [checkingPhone, setCheckingPhone] = useState(false);
  const [phoneFocused, setPhoneFocused] = useState(false);

  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);
  const [firstNameFocused, setFirstNameFocused] = useState(false);
  const [lastNameFocused, setLastNameFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);

  // Animations
  const slideAnim = useRef(new Animated.Value(40)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await fetchAndDispatchUserData(session.user.id, dispatch);
        navigateBasedOnUserType();
      }
    });
    return () => subscription.unsubscribe();
  }, []);

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

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Por favor completa todos los campos");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (authError) throw authError;
      if (data.user) {
        await fetchAndDispatchUserData(data.user.id, dispatch);
        navigateBasedOnUserType();
      }
    } catch (error: any) {
      let message = "Error de autenticación";
      if (error.message.includes('Invalid login credentials')) {
        message = "Correo o contraseña incorrectos.";
      }
      setError(message);
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!firstName || !lastName || !email || !mobile || !usertype || !password || !confirmPassword) {
      setError("Por favor completa todos los campos");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    if (!acceptTerms) {
      setError("Debes aceptar los términos y condiciones");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            phone: `${countryCode}${mobile}`,
            usertype: usertype || 'customer',
          },
        },
      });

      if (signUpError) throw signUpError;
      
      Alert.alert("Éxito", "Verifica tu email para confirmar tu cuenta");
      setIsLoginMode(true);
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setFirstName("");
      setLastName("");
      setMobile("");
      setUsertype("");
      setAcceptTerms(false);
    } catch (error: any) {
      setError(error.message || "Error al registrarse");
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyEmail = async () => {
    if (!email) return;
    setCheckingEmail(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('email', email.trim());
      if (error) throw error;
      setEmailExists(data && data.length > 0);
    } catch (err) {
      console.warn('email check', err);
    } finally {
      setCheckingEmail(false);
    }
  };

  const verifyPhone = async () => {
    if (!mobile) return;
    setCheckingPhone(true);
    try {
      const full = `${countryCode}${mobile}`;
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('phone', full);
      if (error) throw error;
      setPhoneExists(data && data.length > 0);
    } catch (err) {
      console.warn('phone check', err);
    } finally {
      setCheckingPhone(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setError("Ingresa tu correo electrónico");
      return;
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'tu-app://reset-password/',
      });
      if (error) throw error;
      Alert.alert("Listo", "Revisa tu email para el enlace de reseteo");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <ImageBackground 
      source={require("./../../assets/images/login.jpg")} 
      resizeMode="cover" 
      style={styles.background}
    >
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardDismissMode="on-drag">
          <Animated.View
            style={[
              styles.container,
              {
                transform: [{ translateY: slideAnim }],
                opacity: opacityAnim,
              },
            ]}
          >
            <View style={styles.authBox}>
              {/* Logo & Title */}
              <View style={styles.logoContainer}>
                <Image
                  source={require("./../../assets/images/logo1024x1024.png")}
                  style={styles.logoImage}
                />
                <Text style={styles.logoTitle}>T+plus</Text>
                <Text style={styles.logoSubtitle}>Movilidad Inteligente</Text>
              </View>

              {/* Toggle Buttons */}
              <View style={styles.toggleContainer}>
                <TouchableOpacity
                  style={[styles.toggleBtn, isLoginMode && styles.toggleBtnActive]}
                  onPress={() => {
                    setIsLoginMode(true);
                    setError("");
                  }}
                >
                  <Text style={[styles.toggleBtnText, isLoginMode && styles.toggleBtnTextActive]}>
                    Ingresar
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleBtn, !isLoginMode && styles.toggleBtnActive]}
                  onPress={() => {
                    setIsLoginMode(false);
                    setError("");
                  }}
                >
                  <Text style={[styles.toggleBtnText, !isLoginMode && styles.toggleBtnTextActive]}>
                    Registro
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Error Message */}
              {error ? (
                <Text style={styles.errorText}>{error}</Text>
              ) : null}

              {/* LOGIN FORM */}
              {isLoginMode ? (
                <View>
                  {/* Email Input */}
                  <View style={styles.inputGroup}>
                    <View style={styles.inputWrapper}>
                      <Feather
                        name="user"
                        size={20}
                        color={emailFocused ? THEME.primaryCyan : THEME.textMuted}
                        style={styles.inputIcon}
                      />
                      {emailFocused && <Text style={styles.plusIcon}>+</Text>}
                      <TextInput
                        style={[
                          styles.input,
                          emailFocused && styles.inputFocused,
                        ]}
                        placeholder="Correo Electrónico"
                        placeholderTextColor={THEME.textMuted}
                        keyboardType="email-address"
                        value={email}
                        onChangeText={setEmail}
                        onFocus={() => setEmailFocused(true)}
                        onBlur={() => setEmailFocused(false)}
                        editable={!loading}
                        autoCapitalize="none"
                      />
                      {emailFocused && <View style={styles.scanLine} />}
                    </View>
                  </View>
                  {/* Password Input */}
                  <View style={styles.inputGroup}>
                    <View style={styles.inputWrapper}>
                      <AntDesign
                        name="lock"
                        size={20}
                        color={passwordFocused ? THEME.primaryCyan : THEME.textMuted}
                        style={styles.inputIcon}
                      />
                      {passwordFocused && <Text style={styles.plusIcon}>+</Text>}
                      <TextInput
                        style={[
                          styles.input,
                          passwordFocused && styles.inputFocused,
                        ]}
                        placeholder="Contraseña"
                        placeholderTextColor={THEME.textMuted}
                        secureTextEntry={!isPasswordVisible}
                        value={password}
                        onChangeText={setPassword}
                        onFocus={() => setPasswordFocused(true)}
                        onBlur={() => setPasswordFocused(false)}
                        editable={!loading}
                      />
                      <TouchableOpacity
                        onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                        style={styles.eyeIcon}
                        disabled={loading}
                      >
                        {isPasswordVisible ? (
                          <Feather name="eye" size={18} color="#fff" />
                        ) : (
                          <Feather name="eye-off" size={18} color="#fff" />
                        )}
                      </TouchableOpacity>
                      {passwordFocused && <View style={styles.scanLine} />}
                    </View>
                  </View>

                  {/* Options */}
                  <View style={styles.optionsContainer}>
                    <TouchableOpacity
                      style={styles.checkboxRow}
                      onPress={() => setRememberMe(!rememberMe)}
                      disabled={loading}
                    >
                      <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
                        {rememberMe && (
                          <AntDesign name="check" size={12} color="#fff" style={{ marginTop: -2 }} />
                        )}
                      </View>
                      <Text style={styles.checkboxLabel}>Recordarme</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handlePasswordReset} disabled={loading}>
                      <Text style={styles.forgotLink}>¿Olvidaste tu clave?</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Login Button */}
                  <TouchableOpacity
                    style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
                    onPress={handleLogin}
                    disabled={loading}
                  >
                    <Text style={styles.primaryBtnText}>
                      {loading ? "INICIANDO..." : "INICIAR SESIÓN"}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                // SIGNUP FORM
                <View>
                  {/* First & Last Name */}
                  <View style={styles.inputGroup}>
                    <View style={[styles.inputWrapper, firstNameFocused && styles.inputFocused]}
                    >
                      <Feather
                        name="user"
                        size={20}
                        color={firstNameFocused ? THEME.primaryCyan : THEME.textMuted}
                        style={styles.inputIcon}
                      />
                      {firstNameFocused && <Text style={styles.plusIcon}>+</Text>}
                      <TextInput
                        style={[
                          styles.input,
                          firstNameFocused && styles.inputFocused,
                        ]}
                        placeholder="Nombre"
                        placeholderTextColor={THEME.textMuted}
                        value={firstName}
                        onChangeText={setFirstName}
                        onFocus={() => setFirstNameFocused(true)}
                        onBlur={() => setFirstNameFocused(false)}
                        editable={!loading}
                      />
                      {firstNameFocused && <View style={styles.scanLine} />}
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <View style={[styles.inputWrapper, lastNameFocused && styles.inputFocused]}
                    >
                      <Feather
                        name="user"
                        size={20}
                        color={lastNameFocused ? THEME.primaryCyan : THEME.textMuted}
                        style={styles.inputIcon}
                      />
                      {lastNameFocused && <Text style={styles.plusIcon}>+</Text>}
                      <TextInput
                        style={[
                          styles.input,
                          lastNameFocused && styles.inputFocused,
                        ]}
                        placeholder="Apellido"
                        placeholderTextColor={THEME.textMuted}
                        value={lastName}
                        onChangeText={setLastName}
                        onFocus={() => setLastNameFocused(true)}
                        onBlur={() => setLastNameFocused(false)}
                        editable={!loading}
                      />
                      {lastNameFocused && <View style={styles.scanLine} />}
                    </View>
                  </View>

                  {/* Email Input */}
                  <View style={styles.inputGroup}>
                    <View style={styles.inputWrapper}>
                      <MaterialCommunityIcons
                        name="email"
                        size={20}
                        color={emailFocused ? THEME.primaryCyan : THEME.textMuted}
                        style={styles.inputIcon}
                      />
                      {emailFocused && <Text style={styles.plusIcon}>+</Text>}
                      <TextInput
                        style={[
                          styles.input,
                          emailFocused && styles.inputFocused,
                        ]}
                        placeholder="Correo Electrónico"
                        placeholderTextColor={THEME.textMuted}
                        keyboardType="email-address"
                        value={email}
                        onChangeText={setEmail}
                        onFocus={() => setEmailFocused(true)}
                        onBlur={() => setEmailFocused(false)}
                        editable={!loading}
                        autoCapitalize="none"
                      />
                      {emailFocused && <View style={styles.scanLine} />}
                    </View>
                  </View>
                  {emailExists && <Text style={styles.errorSmall}>Este correo ya está registrado</Text>}

                  {/* Phone with Country Code */}
                  <View style={styles.phoneContainer}>
                    <TouchableOpacity
                      style={[styles.countryCodeButton, styles.inputGroup]}
                      onPress={() => setShowCountryModal(true)}
                    >
                      <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
                      <Text style={styles.countryCode}>{selectedCountry.code}</Text>
                      <MaterialCommunityIcons name="chevron-down" size={16} color={THEME.textMuted} />
                    </TouchableOpacity>

                    <View style={[styles.inputGroup, styles.phoneInputFlex, phoneFocused && styles.inputFocused]}>
                      <MaterialCommunityIcons
                        name="phone"
                        size={20}
                        color={phoneFocused ? THEME.primaryCyan : THEME.textMuted}
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="3005551234"
                        placeholderTextColor={THEME.textMuted}
                        value={mobile}
                        onChangeText={setMobile}
                        onFocus={() => setPhoneFocused(true)}
                        onBlur={() => setPhoneFocused(false)}
                        keyboardType="phone-pad"
                        maxLength={10}
                        editable={!loading}
                      />
                    </View>
                  </View>
                  {phoneExists && <Text style={styles.errorSmall}>Este teléfono ya está registrado</Text>}

                  {/* User Type */}
                  <TouchableOpacity
                    style={[styles.inputGroup, styles.userTypeButton]}
                    onPress={() => setShowUserTypeModal(true)}
                  >
                    <AntDesign name="idcard" size={20} color={usertype ? THEME.primaryCyan : THEME.textMuted} style={styles.inputIcon} />
                    <Text style={[styles.input, { color: usertype ? THEME.textMain : THEME.textMuted }]}>       
                      {usertype ? (usertype === 'driver' ? 'Conductor' : 'Cliente') : 'Soy...'}
                    </Text>
                  </TouchableOpacity>

                  {/* Password Input */}
                  <View style={styles.inputGroup}>
                    <View style={styles.inputWrapper}>
                      <AntDesign
                        name="lock"
                        size={20}
                        color={passwordFocused ? THEME.primaryCyan : THEME.textMuted}
                        style={styles.inputIcon}
                      />
                      {passwordFocused && <Text style={styles.plusIcon}>+</Text>}
                      <TextInput
                        style={[
                          styles.input,
                          passwordFocused && styles.inputFocused,
                        ]}
                        placeholder="Contraseña"
                        placeholderTextColor={THEME.textMuted}
                        secureTextEntry={!isPasswordVisible}
                        value={password}
                        onChangeText={setPassword}
                        onFocus={() => setPasswordFocused(true)}
                        onBlur={() => setPasswordFocused(false)}
                        editable={!loading}
                      />
                      <TouchableOpacity
                        onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                        style={styles.eyeIcon}
                        disabled={loading}
                      >
                        {isPasswordVisible ? (
                          <Feather name="eye" size={18} color="#fff" />
                        ) : (
                          <Feather name="eye-off" size={18} color="#fff" />
                        )}
                      </TouchableOpacity>
                      {passwordFocused && <View style={styles.scanLine} />}
                    </View>
                  </View>

                  {/* Confirm Password Input */}
                  <View style={styles.inputGroup}>
                    <View style={styles.inputWrapper}>
                      <AntDesign
                        name="lock"
                        size={20}
                        color={confirmPasswordFocused ? THEME.primaryCyan : THEME.textMuted}
                        style={styles.inputIcon}
                      />
                      {confirmPasswordFocused && <Text style={styles.plusIcon}>+</Text>}
                      <TextInput
                        style={[
                          styles.input,
                          confirmPasswordFocused && styles.inputFocused,
                        ]}
                        placeholder="Confirmar Contraseña"
                        placeholderTextColor={THEME.textMuted}
                        secureTextEntry={!isConfirmPasswordVisible}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        onFocus={() => setConfirmPasswordFocused(true)}
                        onBlur={() => setConfirmPasswordFocused(false)}
                        editable={!loading}
                      />
                      <TouchableOpacity
                        onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
                        style={styles.eyeIcon}
                        disabled={loading}
                      >
                        {isConfirmPasswordVisible ? (
                          <Feather name="eye" size={18} color="#fff" />
                        ) : (
                          <Feather name="eye-off" size={18} color="#fff" />
                        )}
                      </TouchableOpacity>
                      {confirmPasswordFocused && <View style={styles.scanLine} />}
                    </View>
                  </View>

                  {/* Terms Checkbox */}
                  <TouchableOpacity
                    style={styles.checkboxRow}
                    onPress={() => setAcceptTerms(!acceptTerms)}
                    disabled={loading}
                  >
                    <View style={[styles.checkbox, acceptTerms && styles.checkboxActive]}>
                      {acceptTerms && (
                        <AntDesign name="check" size={12} color="#fff" style={{ marginTop: -2 }} />
                      )}
                    </View>
                    <Text style={styles.checkboxLabel}>Acepto los términos y condiciones</Text>
                  </TouchableOpacity>

                  {/* Signup Button */}
                  <TouchableOpacity
                    style={[
                      styles.primaryBtn,
                      (loading || !acceptTerms) && styles.primaryBtnDisabled,
                    ]}
                    onPress={handleSignUp}
                    disabled={loading || !acceptTerms}
                  >
                    <Text style={styles.primaryBtnText}>
                      {loading ? "CREANDO..." : "CREAR CUENTA"}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </Animated.View>

          {/* Country Modal */}
          <Modal visible={showCountryModal} transparent animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Selecciona país</Text>
                  <TouchableOpacity onPress={() => setShowCountryModal(false)}>
                    <AntDesign name="close" size={24} color={THEME.textMain} />
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={COUNTRIES}
                  keyExtractor={(item) => item.code}
                  renderItem={({ item }: { item: typeof COUNTRIES[0] }) => (
                    <TouchableOpacity
                      style={styles.countryOption}
                      onPress={() => {
                        setSelectedCountry(item);
                        setCountryCode(item.code);
                        setShowCountryModal(false);
                      }}
                    >
                      <Text style={styles.countryOptionText}>{item.flag} {item.name} ({item.code})</Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            </View>
          </Modal>

          {/* User Type Modal */}
          <Modal visible={showUserTypeModal} transparent animationType="fade">
            <View style={styles.modalOverlay}>
              <View style={styles.userTypeModal}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Soy...</Text>
                  <TouchableOpacity onPress={() => setShowUserTypeModal(false)}>
                    <AntDesign name="close" size={24} color={THEME.textMain} />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={styles.userTypeOption}
                  onPress={() => {
                    setUsertype('driver');
                    setShowUserTypeModal(false);
                  }}
                >
                  <AntDesign name="car" size={24} color={THEME.primaryCyan} />
                  <Text style={styles.userTypeOptionText}>Conductor</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.userTypeOption}
                  onPress={() => {
                    setUsertype('customer');
                    setShowUserTypeModal(false);
                  }}
                >
                  <AntDesign name="user" size={24} color={THEME.primaryCyan} />
                  <Text style={styles.userTypeOptionText}>Cliente</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  authBox: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: THEME.glassBg,
    borderColor: THEME.glassBorder,
    borderWidth: 1.5,
    borderRadius: 28,
    padding: 40,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 30 },
    shadowOpacity: 0.6,
    shadowRadius: 60,
    elevation: 10,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoImage: {
    width: 100,
    height: 100,
    borderRadius: 20,
    marginBottom: 15,
  },
  logoTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: THEME.textMain,
    letterSpacing: -0.5,
  },
  logoSubtitle: {
    fontSize: 12,
    color: THEME.primaryCyan,
    fontWeight: '600',
    letterSpacing: 2,
    marginTop: 5,
    textTransform: 'uppercase',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 14,
    padding: 6,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  toggleBtnActive: {
    backgroundColor: 'rgba(21, 229, 233, 0.15)',
    shadowColor: THEME.primaryCyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  toggleBtnText: {
    color: THEME.textMuted,
    fontWeight: '600',
    fontSize: 14,
  },
  toggleBtnTextActive: {
    color: THEME.textMain,
  },
  errorText: {
    color: THEME.errorColor,
    fontSize: 13,
    marginBottom: 15,
    textAlign: 'center',
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    zIndex: 2,
  },
  plusIcon: {
    position: 'absolute',
    left: 10,
    top: 4,
    fontSize: 18,
    fontWeight: '900',
    color: THEME.primaryCyan,
    zIndex: 3,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
    paddingLeft: 50,
    paddingRight: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    color: THEME.textMain,
    fontSize: 15,
    fontWeight: '500',
  },
  inputFocused: {
    borderColor: THEME.primaryCyan,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  eyeIcon: {
    position: 'absolute',
    right: 14,
    zIndex: 2,
    padding: 8,
  },
  scanLine: {
    position: 'absolute',
    bottom: 0,
    left: '5%',
    right: '5%',
    height: 2,
    backgroundColor: THEME.primaryCyan,
    borderRadius: 1,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(21, 229, 233, 0.5)',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxActive: {
    backgroundColor: THEME.primaryCyan,
    borderColor: THEME.primaryCyan,
  },
  checkboxLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
    fontWeight: '500',
  },
  forgotLink: {
    color: THEME.primaryCyan,
    fontSize: 13,
    fontWeight: '600',
  },
  primaryBtn: {
    paddingVertical: 16,
    backgroundColor: 'rgba(21, 229, 233, 0.2)',
    borderWidth: 1.5,
    borderColor: THEME.primaryCyan,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: THEME.primaryCyan,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryBtnDisabled: {
    opacity: 0.5,
  },
  primaryBtnText: {
    color: THEME.textMain,
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 2,
  },
  // additional styles for country/user modals and phone input
  phoneContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  countryCodeButton: {
    flex: 0,
    width: 100,
    flexDirection: 'row',
    paddingHorizontal: 12,
  },
  countryFlag: {
    fontSize: 18,
    marginRight: 6,
  },
  countryCode: {
    color: THEME.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  phoneInputFlex: {
    flex: 1,
  },
  userTypeButton: {
    justifyContent: 'space-between',
  },
  errorSmall: {
    color: THEME.errorColor,
    fontSize: 11,
    marginBottom: 8,
    marginLeft: 5,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: THEME.primaryNavy,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 20,
  },
  userTypeModal: {
    backgroundColor: THEME.primaryNavy,
    borderRadius: 20,
    marginHorizontal: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomColor: THEME.glassBorder,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.textMain,
  },
  countryOption: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomColor: THEME.glassBorder,
    borderBottomWidth: 1,
  },
  countryOptionText: {
    color: THEME.textMain,
    fontSize: 14,
    fontWeight: '500',
  },
  userTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(21, 229, 233, 0.1)',
    borderRadius: 12,
    marginVertical: 8,
    borderColor: THEME.primaryCyan,
    borderWidth: 1,
  },
  userTypeOptionText: {
    color: THEME.textMain,
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 12,
  },
});

export default LoginScreen;
