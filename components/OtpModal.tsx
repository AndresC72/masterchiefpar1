import { AntDesign } from "@expo/vector-icons";
import React, { useState } from "react";
import { Modal, View, StyleSheet, TextInput, TouchableOpacity, Text } from "react-native";
import { useColorScheme } from "react-native";
interface OtpModalProps {
  requestModalClose: () => void;
  modalVisible: boolean;
  otp: string;
  onMatch: (isMatch: boolean) => void;
}

const OtpModal: React.FC<OtpModalProps> = ({
  requestModalClose,
  modalVisible,
  otp,
  onMatch,
}) => {
  const [inputValue, setInputValue] = useState("");
  const colorScheme = useColorScheme();
  const handleConfirm = () => {
    const isMatch = parseInt(inputValue, 10) === parseInt(otp, 10); // Convertimos ambos valores a número antes de comparar
    //console.log(isMatch);
    
    onMatch(isMatch); // Notificar si el OTP coincide
    if (isMatch) {
      requestModalClose(false); // Cierra el modal si el OTP coincide
    }
  };
  const styles = colorScheme === "dark" ? darkStyles : lightStyles; // Estilos dinámicos

  return (
    <Modal
      visible={modalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={requestModalClose}
    >
      <View style={styles.container}>
        <View style={styles.modalContainer}>
          <View style={styles.blankViewStyle}>
            <TouchableOpacity onPress={requestModalClose}>
              <AntDesign name="closecircleo" size={24} color={colorScheme === "dark" ? "#FFFFFF" : "black"} />
            </TouchableOpacity>
          </View>
          <View style={styles.modalContainerViewStyle}>
            <TextInput
              style={styles.input}
              underlineColorAndroid="transparent"
              placeholder="Codigo de seguridad"
              keyboardType="numeric"
              value={inputValue}
              onChangeText={setInputValue}
              maxLength={5}
              placeholderTextColor={colorScheme === "dark" ? "#FFFFFF" : "#000000"}
            />
            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
              <Text style={styles.confirmButtonText}>Confirmar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const lightStyles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "80%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
    paddingTop: 120,
  },
  modalContainer: {
    height: 200,
    backgroundColor: "#FFF",
    width: "80%",
    borderRadius: 10,
    elevation: 15,
  },
  blankViewStyle: {
    flexDirection: "row",
    alignSelf: "flex-end",
    marginTop: 15,
    marginRight: 15,
  },
  modalContainerViewStyle: {
    flex: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    fontSize: 20,
    marginBottom: 20,
    borderColor: "#3333",
    borderWidth: 1,
    borderRadius: 8,
    width: "80%",
    paddingTop: 8,
    paddingBottom: 8,
    paddingRight: 10,
    paddingLeft: 10,
    textAlign: "center",
  },
  confirmButton: {
    backgroundColor: "#F20505",
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 18,
  },
});
const darkStyles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "80%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
    paddingTop: 120,
  },
  modalContainer: {
    height: 200,
    backgroundColor: "#474747",
    width: "80%",
    borderRadius: 10,
    elevation: 15,
  },
  blankViewStyle: {
    flexDirection: "row",
    alignSelf: "flex-end",
    marginTop: 15,
    marginRight: 15,
  },
  modalContainerViewStyle: {
    flex: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    fontSize: 20,
    marginBottom: 20,
    borderColor: "#fff",
    borderWidth: 1,
    borderRadius: 8,
    width: "80%",
    paddingTop: 8,
    paddingBottom: 8,
    paddingRight: 10,
    paddingLeft: 10,
    textAlign: "center",
    color: "#fff",
    tintColor: "#fff",
  },
  confirmButton: {
    backgroundColor: "#F20505",
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 18,
  },
});

export default OtpModal;