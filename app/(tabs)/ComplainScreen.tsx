import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Alert,
  FlatList,
  TouchableOpacity,
  Animated,
  Dimensions,
  useColorScheme,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import moment from "moment";
import { fetchComplains, addComplain } from "@/common/store/complainSlice";
import { RootState } from "@/common/store";
import { Ionicons, AntDesign } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

var { width } = Dimensions.get("window");
type Props = NativeStackScreenProps<any>;

const Complain = ({ navigation }: Props) => {
  const [state, setState] = useState({
    subject: "",
    body: "",
    check: false,
  });

  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const complains = useSelector((state: RootState) => state.complains.list);
  const [scaleAnim] = useState(new Animated.Value(0));
  const [fadeAnim] = useState(new Animated.Value(0));

  // Detecta el esquema de color del dispositivo
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    }, 500);

    if (user && user.id) {
      dispatch(fetchComplains(user.id));
    }
  }, [user]);

  const submitComplain = () => {
    if (user.mobile || user.email) {
      if (state.subject && state.body) {
        const complainData = {
          ...state,
          uid: user.id,
          complainDate: new Date().getTime(),
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          email: user.email || "",
          mobile: user.mobile || "",
          role: user.usertype,
          id: `${user.uid}_${new Date().getTime()}`,
        };

        dispatch(addComplain(complainData));

        setState({
          subject: "",
          body: "",
          check: false,
        });
      } else {
        Alert.alert("Error", "Por favor completa todos los campos.");
      }
    } else {
      Alert.alert(
        "Error",
        "Por favor verifica tu número de teléfono o correo electrónico."
      );
    }
  };

  const renderComplainItem = ({ item }) => (
    <View style={[styles.complainItem, isDarkMode ? styles.complainItemDark : {}]}>
      <Text style={[styles.complainSubject, isDarkMode ? styles.textDark : {}]}>
        {item.subject}
      </Text>
      <Text style={[styles.complainDate, isDarkMode ? styles.textDark : {}]}>
        {moment(item.complainDate).format("LL")}
      </Text>
      <Text style={[styles.complainBody, isDarkMode ? styles.textDark : {}]}>
        {item.body}
      </Text>
      <Text style={[styles.complainUser, isDarkMode ? styles.textDark : {}]}>
        {item.firstName} {item.lastName}
      </Text>
      <Text style={[styles.complainContact, isDarkMode ? styles.textDark : {}]}>
        {item.email} | {item.mobile}
      </Text>
      <Text
        style={[
          styles.complainStatus,
          item.check ? styles.solved : styles.pending,
          isDarkMode ? styles.textDark : {},
        ]}
      >
        {item.check ? "Resuelto" : "Pendiente"}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, isDarkMode ? styles.containerDark : {}]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <AntDesign name="arrowleft" size={24} color={isDarkMode ? "white" : "black"} />
        </TouchableOpacity>
        <Text style={[styles.headerText, isDarkMode ? styles.textDark : {}]}>
          {"Quejas"}{" "}
        </Text>
      </View>
      <View style={[styles.inputContainer, isDarkMode ? styles.inputContainerDark : {}]}>
        <TextInput
          style={[styles.textInput, isDarkMode ? styles.textInputDark : {}]}
          placeholder="Título"
          placeholderTextColor={isDarkMode ? "#888" : "#CCC"}
          value={state.subject}
          onChangeText={(text) => setState({ ...state, subject: text })}
        />
        <TextInput
          style={[styles.textInput, styles.textArea, isDarkMode ? styles.textInputDark : {}]}
          placeholder="Mensaje de la queja"
          placeholderTextColor={isDarkMode ? "#888" : "#CCC"}
          value={state.body}
          multiline
          onChangeText={(text) => setState({ ...state, body: text })}
        />
        <TouchableOpacity style={styles.submitButton} onPress={submitComplain}>
          <Text style={styles.buttonText}>Enviar Queja</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={complains}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderComplainItem}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: "#F7F7F7",
  },
  containerDark: {
    backgroundColor: "#474747",
  },
  inputContainer: {
    marginBottom: 20,
    padding: 20,
    backgroundColor: "#FFF",
    borderRadius: 10,
  },
  inputContainerDark: {
    backgroundColor: "#1E1E1E",
  },
  textInput: {
    height: 50,
    borderColor: "#DDD",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 10,
    backgroundColor: "#FFF",
    fontSize: 16,
  },
  textInputDark: {
    backgroundColor: "#333",
    color: "#FFF",
    borderColor: "#555",
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
  },
  submitButton: {
    backgroundColor: "#F20505",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  listContainer: {
    paddingBottom: 20,
  },
  complainItem: {
    backgroundColor: "#FFF",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  complainItemDark: {
    backgroundColor: "#1E1E1E",
  },
  complainSubject: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  textDark: {
    color: "#FFF",
  },
  complainDate: {
    fontSize: 14,
    color: "#888",
    marginBottom: 5,
  },
  complainBody: {
    fontSize: 14,
    color: "#555",
    marginBottom: 5,
  },
  complainUser: {
    fontSize: 14,
    color: "#555",
    marginBottom: 5,
  },
  complainContact: {
    fontSize: 14,
    color: "#555",
    marginBottom: 5,
  },
  complainStatus: {
    fontSize: 14,
    fontWeight: "bold",
  },
  solved: {
    color: "red",
  },
  pending: {
    color: "pink",
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
  },
});

export default Complain;