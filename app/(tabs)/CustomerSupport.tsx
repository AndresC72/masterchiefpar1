import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Linking,
  Image,
  useColorScheme,
} from "react-native";
import { Ionicons, AntDesign } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

type Props = NativeStackScreenProps<any>;

const CustomerSupport = ({ navigation }: Props) => {
  const [profileData] = useState(null);
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  const handleChatPressDriver = () => {
    Linking.openURL(`https://wa.me/message/BTQOY5GZC7REF1`);
  };

  const handleChatPress = () => {
    Linking.openURL("whatsapp://send?text=Hola&phone=573208202221");
  };

  const styles = getStyles(isDarkMode);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <AntDesign name="arrowleft" size={24} color={isDarkMode ? "#fff" : "black"} />
        </TouchableOpacity>
        <Text style={styles.headerText}>{"GIGIBot"} </Text>
      </View>

      <View
        style={{
          width: "100%",
          alignItems: "center",
          justifyContent: "center",
          height: "50%",
          margin: 0,
          borderRadius: 23,
          shadowColor: isDarkMode ? "#000" : "#ececec",
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.8,
          shadowRadius: 3.84,
          elevation: 5,
          marginTop: 50,
        }}
      >
        <Image
          source={require("@/assets/images/chatBot.png")}
          style={{ width: "100%", height: "100%", borderRadius: 23 }}
        />
      </View>

      {profileData && profileData.usertype === "customer" ? (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            onPress={handleChatPressDriver}
            style={{
              backgroundColor: isDarkMode ? "#ff6666" : "#ffcccc",
              borderRadius: 23,
              marginHorizontal: "16%",
              alignItems: "flex-end",
              bottom: -30,
            }}
          >
            <Ionicons
              name="chatbox-ellipses"
              size={53}
              color={isDarkMode ? "#f20505" : "#f20505"}
              style={{ marginHorizontal: 100, marginVertical: 8 }}
            />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            onPress={handleChatPress}
            style={{
              backgroundColor: isDarkMode ? "#ff6666" : "#ffcccc",
              borderRadius: 23,
              marginHorizontal: "16%",
              alignItems: "flex-end",
              bottom: -30,
            }}
          >
            <Ionicons
              name="chatbox-ellipses"
              size={53}
              color={isDarkMode ? "#fff" : "#fff"}
              style={{ marginHorizontal: 100, marginVertical: 8 }}
            />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const getStyles = (isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? "#121212" : "#F5F5F5",
      padding: 20,
    },
    headerTitleStyle: {
      color: isDarkMode ? "#FFF" : "#FFF",
      fontFamily: "SpaceMono",
      fontSize: 20,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
    },
    headerText: {
      fontSize: 24,
      fontWeight: "bold",
      color: isDarkMode ? "#FFF" : "#000",
    },
    buttonContainer: {
      flexDirection: "row",
      borderRadius: 40,
    },
    headerIcon: {
      backgroundColor: "#E0E0E0",
      borderRadius: 12,
      padding: 4,
    },
  });

export default CustomerSupport;
