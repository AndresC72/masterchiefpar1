import React from 'react';
import { StyleSheet, View, Text, ImageBackground, TouchableOpacity, Image } from 'react-native';
import { NativeStackScreenProps } from "@react-navigation/native-stack";

type Props = NativeStackScreenProps<any>;


const PreLogin = ({ navigation }: Props) => {
  return (
    <ImageBackground source={require('./../../assets/images/prelogin.jpg')} style={styles.backgroundImage}>
      <View style={styles.overlay} />
      <Image source={require('@/assets/images/logo1024x1024.png')} style={styles.logo} />
      <Text style={styles.title}>TREASAPP</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.signupButton}   onPress={() => navigation.navigate("SignUp")}>
          <Text style={styles.signupButtonText} > Registrar </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.loginButton} onPress={() => navigation.navigate("Login")}>
          <Text style={styles.loginButtonText}  > Iniciar sesión</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}; 

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
    borderRadius: 23
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    marginTop: 20,
    position: 'absolute',
    bottom: 50
  },
  signupButton: {
    flex: 1,
    backgroundColor: '#F20505',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginRight: 10,
  },
  signupButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginButton: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    borderColor: '#F30505',
    borderWidth: 1,
  },
  loginButtonText: {
    color: '#F20505',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PreLogin;
