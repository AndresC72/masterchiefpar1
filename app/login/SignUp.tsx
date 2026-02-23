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
import { SupabaseAuth } from '@/config/SupabaseAuth';
import { settings } from "@/scripts/settings";
import { Ionicons } from "@expo/vector-icons";
import { FlatList } from "react-native";

// Lista de países con códigos y banderas (emoji)
const COUNTRIES = [
  { code: '+57', flag: '🇨🇴', name: 'Colombia', dialCode: '+57' },
  { code: '+1', flag: '🇺🇸', name: 'Estados Unidos', dialCode: '+1' },
  { code: '+44', flag: '🇬🇧', name: 'Reino Unido', dialCode: '+44' },
  { code: '+33', flag: '🇫🇷', name: 'Francia', dialCode: '+33' },
  { code: '+49', flag: '🇩🇪', name: 'Alemania', dialCode: '+49' },
  { code: '+34', flag: '🇪🇸', name: 'España', dialCode: '+34' },
  { code: '+39', flag: '🇮🇹', name: 'Italia', dialCode: '+39' },
  { code: '+31', flag: '🇳🇱', name: 'Países Bajos', dialCode: '+31' },
  { code: '+41', flag: '🇨🇭', name: 'Suiza', dialCode: '+41' },
  { code: '+43', flag: '🇦🇹', name: 'Austria', dialCode: '+43' },
  { code: '+46', flag: '🇸🇪', name: 'Suecia', dialCode: '+46' },
  { code: '+47', flag: '🇳🇴', name: 'Noruega', dialCode: '+47' },
  { code: '+55', flag: '🇧🇷', name: 'Brasil', dialCode: '+55' },
  { code: '+56', flag: '🇨🇱', name: 'Chile', dialCode: '+56' },
  { code: '+54', flag: '🇦🇷', name: 'Argentina', dialCode: '+54' },
  { code: '+51', flag: '🇵🇪', name: 'Perú', dialCode: '+51' },
  { code: '+593', flag: '🇪🇨', name: 'Ecuador', dialCode: '+593' },
  { code: '+58', flag: '🇻🇪', name: 'Venezuela', dialCode: '+58' },
  { code: '+52', flag: '🇲🇽', name: 'México', dialCode: '+52' },
  { code: '+1', flag: '🇨🇦', name: 'Canadá', dialCode: '+1' },
];

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

  const [emailExists, setEmailExists] = useState(false);
  const [phoneExists, setPhoneExists] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [checkingPhone, setCheckingPhone] = useState(false);
  const [emailFormatValid, setEmailFormatValid] = useState(true);
  const [phoneFormatValid, setPhoneFormatValid] = useState(true);
  const [countryCode, setCountryCode] = useState("+57");
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES.find(c => c.code === '+57') || COUNTRIES[0]);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [countrySearchText, setCountrySearchText] = useState("");

  const [signupViaReferral, setSignupViaReferral] = useState("");
  const [walletBalance, setWalletBalance] = useState(0);

  const colorScheme = useColorScheme(); // Hook para detectar modo claro/oscuro

  const handleReferralChange = (text: string) => {
    setReferralId(text.toUpperCase());
  };

  // Función para limpiar todos los campos del formulario
  const clearFormFields = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setFirstName("");
    setLastName("");
    setMobile("");
    setReferralId("");
    setUsertype("");
    setShowPassword(false);
    setCountryCode("+57");
    setSelectedCountry(COUNTRIES.find(c => c.code === '+57') || COUNTRIES[0]);
  };

  // Función para validar formato de email
  const validateEmailFormat = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Manejador para cambios en el email
  const handleEmailChange = (text: string) => {
    const trimmedEmail = text.trim().toLowerCase();
    setEmail(trimmedEmail);
    // Validar formato solo si hay texto
    if (trimmedEmail) {
      setEmailFormatValid(validateEmailFormat(trimmedEmail));
    } else {
      setEmailFormatValid(true);
    }
  };

  // Función para validar formato de teléfono
  const validatePhoneFormat = (phone: string) => {
    // Remover espacios y caracteres especiales
    const cleanPhone = phone.replace(/\D/g, '');
    // Para Colombia, debe tener 10 dígitos (sin contar el +57)
    return cleanPhone.length === 10 && /^[0-9]{10}$/.test(cleanPhone);
  };

  // Manejador para cambios en el teléfono
  const handlePhoneChange = (text: string) => {
    // Solo números
    const phoneNumber = text.replace(/\D/g, '');
    setMobile(phoneNumber);
    
    // Validar formato solo si hay texto
    if (phoneNumber) {
      setPhoneFormatValid(validatePhoneFormat(phoneNumber));
    } else {
      setPhoneFormatValid(true);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Función para seleccionar un país
  const handleSelectCountry = (country: typeof COUNTRIES[0]) => {
    setSelectedCountry(country);
    setCountryCode(country.code);
    setShowCountryModal(false);
    setCountrySearchText("");
  };

  // Filtrar países según búsqueda
  const filteredCountries = COUNTRIES.filter(country =>
    country.name.toLowerCase().includes(countrySearchText.toLowerCase()) ||
    country.code.toLowerCase().includes(countrySearchText.toLowerCase())
  );

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

  // Debounced check for existing email in auth.users tabla de autenticación
  useEffect(() => {
    if (!email || !emailFormatValid || email.indexOf('@') === -1) {
      setEmailExists(false);
      setCheckingEmail(false);
      return;
    }
    
    let mounted = true;
    setCheckingEmail(true);
    
    const t = setTimeout(async () => {
      if (!mounted) return;
      try {
        console.log('Verificando email en autenticación:', email);
        
        // Usar función RPC para verificar si el email existe en auth.users
        const { data, error } = await supabase.rpc('check_email_exists', {
          check_email: email.toLowerCase().trim(),
        });
        
        if (!mounted) return;
        
        if (error) {
          console.warn('Error checking email:', error.message);
          // Si la función RPC no existe, intentar verificación alternativa
          setEmailExists(false);
        } else {
          console.log('Email existe en auth:', data);
          setEmailExists(data === true);
        }
      } catch (e) {
        console.warn('Error checking email:', e);
        setEmailExists(false);
      } finally {
        if (mounted) setCheckingEmail(false);
      }
    }, 800);
    
    return () => {
      mounted = false;
      clearTimeout(t);
    };
  }, [email, emailFormatValid]);

  // Debounced check for existing phone
  useEffect(() => {
    if (!mobile || !phoneFormatValid || mobile.length < 10) {
      setPhoneExists(false);
      setCheckingPhone(false);
      return;
    }
    let mounted = true;
    setCheckingPhone(true);
    
    const t = setTimeout(async () => {
      if (!mounted) return;
      try {
        console.log('Verificando teléfono:', `${countryCode}${mobile}`);
        const fullPhone = `${countryCode}${mobile}`;
        const { data, error, count } = await supabase
          .from('users')
          .select('mobile', { count: 'exact' })
          .or(`mobile.eq.${fullPhone},mobile.eq.${mobile}`);
        
        if (!mounted) return;
        if (error) {
          console.warn('Error checking phone:', error.message);
          setPhoneExists(false);
        } else {
          const exists = count && count > 0;
          console.log('Teléfono existe:', exists, 'Count:', count);
          setPhoneExists(exists);
        }
      } catch (e) {
        console.warn('Error checking phone:', e);
        setPhoneExists(false);
      } finally {
        if (mounted) setCheckingPhone(false);
      }
    }, 800);
    
    return () => {
      mounted = false;
      clearTimeout(t);
    };
  }, [mobile, phoneFormatValid, countryCode]);

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
    
    // Validar formato de email
    if (!validateEmailFormat(email)) {
      Alert.alert("Error", "Formato de email inválido. Ejemplo: usuario@ejemplo.com");
      return;
    }
    
    // Validar si el email ya existe
    if (emailExists) {
      Alert.alert("Error", "Este correo electrónico ya está registrado. Intenta iniciar sesión o usa otro correo.");
      return;
    }
    
    // Esperar a que termine la validación del email
    if (checkingEmail) {
      Alert.alert("Espera", "Por favor espera a que termine la validación del correo.");
      return;
    }

    // Validar formato de teléfono
    if (!validatePhoneFormat(mobile)) {
      Alert.alert("Error", "Formato de teléfono inválido. Debe tener 10 dígitos. Ejemplo: 3005551234");
      return;
    }

    // Validar si el teléfono ya existe
    if (phoneExists) {
      Alert.alert("Error", "Este número de teléfono ya está registrado. Intenta con otro número.");
      return;
    }

    // Esperar a que termine la validación del teléfono
    if (checkingPhone) {
      Alert.alert("Espera", "Por favor espera a que termine la validación del teléfono.");
      return;
    }
    
    if (password !== confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden");
      return;
    }

    try {
      // Validaciones finales antes de crear usuario
      if (emailExists) {
        Alert.alert('Error', 'Este correo ya está registrado. Intenta iniciar sesión.');
        return;
      }
      if (phoneExists) {
        Alert.alert('Error', 'Este número ya está registrado. Recupera la cuenta o usa otro número.');
        return;
      }

      // Create user with Supabase using SupabaseAuth to include metadata (phone)
      const fullPhoneNumber = `${countryCode}${mobile}`; // Combinar código de país con número
      const result = await SupabaseAuth.signUp({
        email: email.trim(),
        password,
        fullName: `${firstName} ${lastName}`,
        phone: fullPhoneNumber, // Usar número completo con código de país
      });

      if (!result.success) {
        Alert.alert('Error de registro', result.error || 'Error desconocido');
        return;
      }

      const user = result.data as any;

      // Log for debugging to ensure phone metadata sent
      console.log('Registro iniciado, usuario creado (sin confirmar):', { id: user?.id, email: user?.email, metadata: user?.user_metadata });

      // Crear el registro del usuario en la tabla 'users' independientemente de si el email está confirmado
      if (user && user.id) {
        const newUserId = user.id;
        const fullPhoneNumber = `${countryCode}${mobile}`; // Número completo con código de país
        
        // Usar snake_case para coincidir con la estructura de la tabla Supabase
        const userData = {
          auth_id: newUserId,
          email: email.toLowerCase().trim(),
          first_name: firstName,
          last_name: lastName,
          mobile: fullPhoneNumber, // Guardar número completo con código de país
          user_type: usertype,
          wallet_balance: referralId !== "" ? 600 : 0,
          is_verified: false,
          approved: false,
          blocked: false,
          referral_id: [...Array(5)].map(() => "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)]).join(""),
          rating: 0,
          total_rides: 0,
        };

        console.log('Datos a insertar en tabla users:', userData);

        const { error: insertError, data: insertData } = await supabase.from('users').insert([userData]);
        if (insertError) {
          console.warn('Error inserting user profile:', insertError.message);
          console.warn('Error details:', insertError);
          Alert.alert('Error', 'Error al guardar el perfil del usuario: ' + insertError.message);
          return;
        } else {
          console.log('Usuario registrado en tabla users:', insertData);
        }

        Alert.alert(
          'Registro exitoso', 
          'Hemos enviado un enlace para verificar tu correo. Revisa tu email y luego inicia sesión.'
        );
        // Limpiar los campos
        clearFormFields();
        // Navegar al Login
        navigation.navigate('Login');
        return;
      }

      Alert.alert('Error', 'No se pudo obtener el ID del usuario.');
    } catch (error: any) {
      let errorMessage = error?.message || 'Error desconocido';
      // Map some common Supabase errors
      if (error?.status === 400 || (errorMessage && errorMessage.includes('already'))) {
        errorMessage = 'Este correo ya está registrado. Intenta iniciar sesión.';
      }
      Alert.alert('Error de registro', errorMessage);
    }
  };

  const handleRegisterPress = async () => {
    // Validar formato de email primero
    if (!validateEmailFormat(email)) {
      Alert.alert("Error", "Formato de email inválido. Ejemplo: usuario@ejemplo.com");
      return;
    }
    
    // Si se está validando el email, esperar
    if (checkingEmail) {
      Alert.alert("Espera", "Por favor espera a que termine la validación del correo.");
      return;
    }
    
    // Si el email ya existe, mostrar error
    if (emailExists) {
      Alert.alert(
        "Correo ya registrado", 
        "Este correo electrónico ya está asociado a una cuenta. Por favor intenta con otro correo.",
        [{ text: "OK", onPress: () => setEmail('') }]
      );
      return;
    }
    
    // Si todo está bien, abrir el modal para seleccionar tipo de usuario
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
                    style={[
                      styles.input(colorScheme),
                      !emailFormatValid && email ? { borderColor: '#d00', borderWidth: 2 } : null,
                      emailExists ? { borderColor: '#d00', borderWidth: 2 } : null,
                    ]}
                    placeholderTextColor={
                      colorScheme === "dark" ? "#aaaaaa" : "#555555"
                    }
                    placeholder="Email"
                    value={email}
                    onChangeText={handleEmailChange}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {!emailFormatValid && email ? (
                    <Text style={{ color: '#d00', marginBottom: 8, marginLeft: 5, fontSize: 12, fontWeight: '600' }}>
                      ✗ Formato inválido (ej: usuario@ejemplo.com)
                    </Text>
                  ) : emailExists ? (
                    <Text style={{ color: '#d00', marginBottom: 8, marginLeft: 5, fontSize: 12, fontWeight: '600' }}>
                      ✗ Este correo ya está registrado
                    </Text>
                  ) : checkingEmail ? (
                    <Text style={{ color: '#FFA500', marginBottom: 8, marginLeft: 5, fontSize: 12, fontWeight: '600' }}>
                      ⏳ Validando correo...
                    </Text>
                  ) : email && emailFormatValid && !emailExists ? (
                    <Text style={{ color: '#4CAF50', marginBottom: 8, marginLeft: 5, fontSize: 12, fontWeight: '600' }}>
                      ✓ Correo disponible
                    </Text>
                  ) : null}
                  <View style={styles.phoneInputContainer}>
                    <TouchableOpacity
                      style={[styles.countryCodeButton, colorScheme === 'dark' ? styles.inputDark : styles.inputLight]}
                      onPress={() => setShowCountryModal(true)}
                    >
                      <Text style={[styles.flagText, styles.countryCodeText]}>
                        {selectedCountry.flag}
                      </Text>
                      <Text style={[styles.countryCodeText, { color: colorScheme === 'dark' ? '#fff' : '#000', marginLeft: 4 }]}>
                        {selectedCountry.code}
                      </Text>
                      <Ionicons name="chevron-down" size={16} color={colorScheme === 'dark' ? '#fff' : '#000'} style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                    <TextInput
                      style={[
                        styles.phoneInput(colorScheme),
                        !phoneFormatValid && mobile ? { borderColor: '#d00', borderWidth: 2 } : null,
                        phoneExists ? { borderColor: '#d00', borderWidth: 2 } : null,
                      ]}
                      placeholderTextColor={
                        colorScheme === "dark" ? "#aaaaaa" : "#555555"
                      }
                      placeholder="3005551234"
                      value={mobile}
                      onChangeText={handlePhoneChange}
                      keyboardType="phone-pad"
                      maxLength={10}
                    />
                  </View>
                  {!phoneFormatValid && mobile ? (
                    <Text style={{ color: '#d00', marginBottom: 8, marginLeft: 5, fontSize: 12, fontWeight: '600' }}>
                      ✗ Formato inválido (ej: 3005551234)
                    </Text>
                  ) : phoneExists ? (
                    <Text style={{ color: '#d00', marginBottom: 8, marginLeft: 5, fontSize: 12, fontWeight: '600' }}>
                      ✗ Este teléfono ya está registrado
                    </Text>
                  ) : checkingPhone ? (
                    <Text style={{ color: '#FFA500', marginBottom: 8, marginLeft: 5, fontSize: 12, fontWeight: '600' }}>
                      ⏳ Validando número...
                    </Text>
                  ) : mobile && phoneFormatValid && !phoneExists ? (
                    <Text style={{ color: '#4CAF50', marginBottom: 8, marginLeft: 5, fontSize: 12, fontWeight: '600' }}>
                      ✓ Número disponible
                    </Text>
                  ) : null}
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
                      (isButtonDisabled || emailExists || checkingEmail || phoneExists || checkingPhone)
                        ? styles.buttonDisabled(colorScheme)
                        : styles.buttonEnabled(colorScheme),
                    ]}
                    onPress={handleRegisterPress}
                    disabled={isButtonDisabled || emailExists || checkingEmail || phoneExists || checkingPhone || isCheckingReferral}
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
              animationType="fade"
              onRequestClose={() => setModalVisible(false)}
            >
              <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>¿Qué tipo de usuario eres?</Text>
                  <Text style={{ textAlign: 'center', color: '#666', marginBottom: 20, fontSize: 14 }}>
                    Selecciona tu perfil para continuar
                  </Text>

                  <TouchableOpacity
                    style={styles.modalButton1(colorScheme)}
                    onPress={() => handleUserTypeSelect("driver")}
                  >
                    <Image
                      source={require("@/assets/images/TREAS-X.png")}
                      style={{ width: 50, height: 50, marginRight: 10 }}
                    />
                    <Text style={styles.modalButtonText}>Conductor</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalButton(colorScheme)}
                    onPress={() => handleUserTypeSelect("customer")}
                  >
                    <Image
                      source={require("@/assets/images/Avatar/11.png")}
                      style={{ width: 40, height: 40, marginRight: 10 }}
                    />
                    <Text style={styles.modalButtonText1}>Cliente</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={{ marginTop: 15, padding: 10 }}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={{ color: '#666', textAlign: 'center', fontSize: 14 }}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

            {/* Modal de Selección de País */}
            <Modal
              visible={showCountryModal}
              transparent={true}
              animationType="slide"
              presentationStyle="pageSheet"
              onRequestClose={() => {
                setShowCountryModal(false);
                setCountrySearchText("");
              }}
            >
              <View style={[styles.countryModalContainer, colorScheme === 'dark' ? { backgroundColor: '#1a1a1a' } : { backgroundColor: '#fff' }]}>
                <View style={styles.countryModalHeader}>
                  <TouchableOpacity onPress={() => {
                    setShowCountryModal(false);
                    setCountrySearchText("");
                  }}>
                    <Ionicons name="close" size={28} color={colorScheme === 'dark' ? '#fff' : '#000'} />
                  </TouchableOpacity>
                  <Text style={[styles.countryModalTitle, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
                    Selecciona tu país
                  </Text>
                  <View style={{ width: 28 }} />
                </View>

                <TextInput
                  style={[styles.countrySearchInput(colorScheme)]}
                  placeholder="Buscar país..."
                  placeholderTextColor={colorScheme === 'dark' ? '#888' : '#aaa'}
                  value={countrySearchText}
                  onChangeText={setCountrySearchText}
                />

                <FlatList
                  data={filteredCountries}
                  keyExtractor={(item) => item.code}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.countryOption,
                        selectedCountry.code === item.code && styles.countryOptionSelected,
                        colorScheme === 'dark' && styles.countryOptionDark,
                      ]}
                      onPress={() => handleSelectCountry(item)}
                    >
                      <Text style={styles.flagEmojiLarge}>{item.flag}</Text>
                      <View style={styles.countryInfo}>
                        <Text style={[styles.countryName, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
                          {item.name}
                        </Text>
                        <Text style={[styles.countryCodeSmall, { color: colorScheme === 'dark' ? '#aaa' : '#666' }]}>
                          {item.code}
                        </Text>
                      </View>
                      {selectedCountry.code === item.code && (
                        <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                      )}
                    </TouchableOpacity>
                  )}
                  scrollEnabled={true}
                />
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
  modalCloseButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  phoneInputContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  countryCodeContainer: {
    paddingHorizontal: 12,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  countryCodeButton: {
    paddingHorizontal: 12,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  flagText: {
    fontSize: 20,
    marginRight: 2,
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  phoneInput: (colorScheme: string) => ({
    flex: 1,
    height: 48,
    padding: 10,
    borderWidth: 1,
    borderColor: colorScheme === 'dark' ? '#444' : '#ddd',
    borderRadius: 16,
    color: colorScheme === 'dark' ? '#fff' : '#000',
    backgroundColor: colorScheme === 'dark' ? '#333' : '#F6F6F6',
    fontSize: 16,
  }),
  // Estilos para el Modal de Países
  countryModalContainer: {
    flex: 1,
    paddingTop: 20,
  },
  countryModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  countryModalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  countrySearchInput: (colorScheme: string) => ({
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colorScheme === 'dark' ? '#444' : '#ddd',
    backgroundColor: colorScheme === 'dark' ? '#333' : '#F6F6F6',
    color: colorScheme === 'dark' ? '#fff' : '#000',
    fontSize: 16,
  }),
  countryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
  },
  countryOptionSelected: {
    backgroundColor: '#f0f0f0',
  },
  countryOptionDark: {
    backgroundColor: '#222',
  },
  flagEmojiLarge: {
    fontSize: 32,
    marginRight: 12,
  },
  countryInfo: {
    flex: 1,
  },
  countryName: {
    fontSize: 16,
    fontWeight: '600',
  },
  countryCodeSmall: {
    fontSize: 13,
    marginTop: 2,
  },
});
