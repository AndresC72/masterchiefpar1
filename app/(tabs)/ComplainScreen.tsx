import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import moment from "moment";
import { fetchComplains, addComplain } from "@/common/store/complainSlice";
import { RootState, AppDispatch } from "@/common/store";
import { Ionicons, AntDesign } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

type Props = NativeStackScreenProps<any>;
type ComplaintType = "queja" | "reclamo" | "sugerencia" | "otro";
type PriorityType = "baja" | "media" | "alta";

const Complain = ({ navigation }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user);
  const userAny = user as any;
  const complains = useSelector((state: RootState) => state.complains.list) || [];

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState<ComplaintType>("queja");
  const [priority, setPriority] = useState<PriorityType>("media");
  const [showSuccess, setShowSuccess] = useState(false);

  const glow1 = useRef(new Animated.Value(0)).current;
  const glow2 = useRef(new Animated.Value(0)).current;
  const orbRotate = useRef(new Animated.Value(0)).current;
  const ctaPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchComplains(user.id));
    }
  }, [dispatch, user?.id]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow1, {
          toValue: 1,
          duration: 3500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glow1, {
          toValue: 0,
          duration: 3500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glow2, {
          toValue: 1,
          duration: 4600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glow2, {
          toValue: 0,
          duration: 4600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(orbRotate, {
        toValue: 1,
        duration: 22000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(ctaPulse, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(ctaPulse, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [ctaPulse, glow1, glow2, orbRotate]);

  const charCount = body.length;

  const latestComplaints = useMemo(() => {
    return [...complains].sort((a: any, b: any) => (b.complainDate || 0) - (a.complainDate || 0)).slice(0, 3);
  }, [complains]);

  const submitComplain = () => {
    if (!userAny?.mobile && !userAny?.email) {
      Alert.alert("Error", "Por favor verifica tu numero de telefono o correo electronico.");
      return;
    }

    if (!subject.trim() || !body.trim()) {
      Alert.alert("Error", "Por favor completa asunto y mensaje.");
      return;
    }

    const complainData = {
      subject: subject.trim(),
      body: body.trim(),
      check: false,
      complaintType: type,
      priority,
      uid: user?.id,
      complainDate: new Date().getTime(),
      firstName: userAny?.firstName || userAny?.first_name || "",
      lastName: userAny?.lastName || userAny?.last_name || "",
      email: userAny?.email || "",
      mobile: userAny?.mobile || "",
      role: userAny?.usertype || userAny?.user_type || "",
      id: `${userAny?.uid || userAny?.id}_${new Date().getTime()}`,
    };

    dispatch(addComplain(complainData));
    setShowSuccess(true);
  };

  const resetAndCloseSuccess = () => {
    setSubject("");
    setBody("");
    setType("queja");
    setPriority("media");
    setShowSuccess(false);
  };

  const orbSpin = orbRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const glow1Scale = glow1.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.22],
  });

  const glow2Scale = glow2.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.18],
  });

  const ctaGlowOpacity = ctaPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 1],
  });

  return (
    <View style={styles.container}>
      <View pointerEvents="none" style={styles.bgLayer}>
        <Animated.View style={[styles.bgGlowOne, { transform: [{ scale: glow1Scale }] }]} />
        <Animated.View style={[styles.bgGlowTwo, { transform: [{ scale: glow2Scale }] }]} />
        <Animated.View style={[styles.bgOrb, { transform: [{ rotate: orbSpin }] }]}>
          <View style={styles.bgOrbInner} />
        </Animated.View>
        <View style={styles.bgGrid} />
      </View>

      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <AntDesign name="arrow-left" size={22} color="#EAFBFF" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={styles.headerBadgeIcon}>
            <Ionicons name="chatbubble-ellipses-outline" size={16} color="#00E5FF" />
          </View>
          <Text style={styles.headerTitle}>Quejas y Reclamos</Text>
        </View>

        <View style={styles.iconBtnPlaceholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.introBanner}>
          <View style={styles.introIcon}>
            <Ionicons name="alert-circle-outline" size={24} color="#00E5FF" />
          </View>
          <View style={styles.introTextWrap}>
            <Text style={styles.introTitle}>Tu voz importa</Text>
            <Text style={styles.introSub}>Revisamos cada mensaje. Tiempo de respuesta: 24-48 horas.</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Tipo de solicitud</Text>
          <View style={styles.chipsRow}>
            {(["queja", "reclamo", "sugerencia", "otro"] as ComplaintType[]).map((item) => (
              <TouchableOpacity
                key={item}
                style={[styles.chip, type === item && styles.chipActive]}
                onPress={() => setType(item)}
              >
                <Text style={[styles.chipText, type === item && styles.chipTextActive]}>{item[0].toUpperCase() + item.slice(1)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Asunto</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="create-outline" size={16} color="rgba(255,255,255,0.45)" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Describe brevemente el asunto..."
              placeholderTextColor="rgba(255,255,255,0.35)"
              value={subject}
              maxLength={80}
              onChangeText={setSubject}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Mensaje</Text>
          <View style={styles.textAreaWrap}>
            <TextInput
              style={styles.textArea}
              placeholder="Cuentanos en detalle que ocurrio, cuando y como podemos ayudarte..."
              placeholderTextColor="rgba(255,255,255,0.35)"
              value={body}
              maxLength={500}
              multiline
              textAlignVertical="top"
              onChangeText={setBody}
            />
            <Text style={styles.counter}>{charCount}/500</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Prioridad</Text>
          <View style={styles.priorityRow}>
            {(["baja", "media", "alta"] as PriorityType[]).map((item) => (
              <TouchableOpacity
                key={item}
                style={[styles.priorityBtn, priority === item && styles.priorityBtnActive]}
                onPress={() => setPriority(item)}
              >
                <View
                  style={[
                    styles.priorityDot,
                    item === "baja" && styles.priorityLow,
                    item === "media" && styles.priorityMid,
                    item === "alta" && styles.priorityHigh,
                  ]}
                />
                <Text style={styles.priorityText}>{item[0].toUpperCase() + item.slice(1)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={styles.attachBtn}
            onPress={() => Alert.alert("Adjuntar evidencia", "Esta opcion se conectara con galeria/camara en el siguiente paso.")}
          >
            <View style={styles.attachIconWrap}>
              <Ionicons name="attach-outline" size={20} color="#00E5FF" />
            </View>
            <View style={styles.attachTextWrap}>
              <Text style={styles.attachTitle}>Adjuntar evidencia</Text>
              <Text style={styles.attachSub}>Fotos o capturas de pantalla (opcional)</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.4)" />
          </TouchableOpacity>
        </View>

        <View style={styles.ctaSection}>
          <TouchableOpacity style={styles.submitBtn} onPress={submitComplain} activeOpacity={0.9}>
            <Animated.View style={[styles.submitGlow, { opacity: ctaGlowOpacity }]} />
            <View style={styles.submitContent}>
              <Ionicons name="send" size={18} color="#051A26" />
              <Text style={styles.submitText}>Enviar Solicitud</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.disclaimer}>
            Al enviar, aceptas nuestra politica de privacidad. No compartiremos tu informacion con terceros.
          </Text>
        </View>

        <View style={styles.historySection}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>Tus solicitudes recientes</Text>
            {complains.length > 3 && <Text style={styles.seeAll}>Ultimas 3</Text>}
          </View>

          {latestComplaints.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="document-text-outline" size={24} color="#00E5FF" />
              <Text style={styles.emptyText}>Aun no tienes solicitudes registradas.</Text>
            </View>
          ) : (
            latestComplaints.map((item: any) => (
              <View key={item.id} style={styles.historyCard}>
                <Text style={styles.historySubject}>{item.subject}</Text>
                <Text style={styles.historyDate}>{moment(item.complainDate).format("LL")}</Text>
                <Text style={styles.historyBody} numberOfLines={2}>{item.body}</Text>
                <Text style={[styles.historyStatus, item.check ? styles.statusSolved : styles.statusPending]}>
                  {item.check ? "Resuelto" : "Pendiente"}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {showSuccess && (
        <View style={styles.successOverlay}>
          <View style={styles.successCircle}>
            <Ionicons name="checkmark" size={42} color="#051A26" />
          </View>
          <Text style={styles.successTitle}>Solicitud enviada</Text>
          <Text style={styles.successSub}>Te responderemos en un plazo de 24-48 horas.</Text>
          <TouchableOpacity style={styles.successBtn} onPress={resetAndCloseSuccess}>
            <Text style={styles.successBtnText}>Volver al inicio</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#051A26",
  },
  bgLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  bgGlowOne: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    top: -60,
    left: -80,
    backgroundColor: "rgba(0,229,255,0.15)",
  },
  bgGlowTwo: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    bottom: "14%",
    right: -70,
    backgroundColor: "rgba(0,176,255,0.12)",
  },
  bgGrid: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.08,
  },
  bgOrb: {
    position: "absolute",
    bottom: "28%",
    right: -80,
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  bgOrbInner: {
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.06)",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 48,
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: "rgba(5,26,38,0.9)",
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(10,46,61,0.55)",
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.16)",
  },
  iconBtnPlaceholder: {
    width: 44,
    height: 44,
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerBadgeIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,229,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.24)",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  introBanner: {
    marginTop: 10,
    marginBottom: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.18)",
    backgroundColor: "rgba(0,229,255,0.08)",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  introIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,229,255,0.16)",
  },
  introTextWrap: {
    flex: 1,
  },
  introTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  introSub: {
    color: "rgba(255,255,255,0.62)",
    marginTop: 2,
    fontSize: 12,
    lineHeight: 18,
  },
  section: {
    marginBottom: 14,
  },
  label: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
    fontWeight: "600",
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.16)",
    backgroundColor: "rgba(10,46,61,0.65)",
  },
  chipActive: {
    backgroundColor: "rgba(0,229,255,0.18)",
    borderColor: "rgba(0,229,255,0.35)",
  },
  chipText: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
    fontWeight: "600",
  },
  chipTextActive: {
    color: "#00E5FF",
  },
  inputWrap: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.16)",
    backgroundColor: "rgba(10,46,61,0.56)",
    paddingLeft: 40,
    position: "relative",
  },
  inputIcon: {
    position: "absolute",
    left: 14,
    top: 15,
    zIndex: 1,
  },
  input: {
    color: "#FFFFFF",
    fontSize: 15,
    paddingVertical: 12,
    paddingRight: 12,
  },
  textAreaWrap: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.16)",
    backgroundColor: "rgba(10,46,61,0.56)",
    padding: 12,
    minHeight: 130,
  },
  textArea: {
    color: "#FFFFFF",
    fontSize: 15,
    minHeight: 92,
    paddingRight: 8,
  },
  counter: {
    alignSelf: "flex-end",
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
    marginTop: 4,
  },
  priorityRow: {
    flexDirection: "row",
    gap: 8,
  },
  priorityBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.16)",
    backgroundColor: "rgba(10,46,61,0.56)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  priorityBtnActive: {
    borderColor: "rgba(0,229,255,0.35)",
    backgroundColor: "rgba(0,229,255,0.12)",
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  priorityLow: {
    backgroundColor: "#4CAF50",
  },
  priorityMid: {
    backgroundColor: "#FFC107",
  },
  priorityHigh: {
    backgroundColor: "#FF4D6A",
  },
  priorityText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  attachBtn: {
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(0,229,255,0.2)",
    backgroundColor: "rgba(10,46,61,0.56)",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  attachIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,229,255,0.16)",
  },
  attachTextWrap: {
    flex: 1,
  },
  attachTitle: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    fontWeight: "600",
  },
  attachSub: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 12,
    marginTop: 2,
  },
  ctaSection: {
    marginTop: 6,
    marginBottom: 18,
  },
  submitBtn: {
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#00E5FF",
    overflow: "hidden",
  },
  submitGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  submitContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  submitText: {
    color: "#051A26",
    fontSize: 16,
    fontWeight: "800",
  },
  disclaimer: {
    marginTop: 10,
    textAlign: "center",
    color: "rgba(255,255,255,0.35)",
    fontSize: 11,
    lineHeight: 16,
  },
  historySection: {
    marginBottom: 18,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  historyTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  seeAll: {
    color: "#00E5FF",
    fontSize: 13,
    fontWeight: "600",
  },
  emptyCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.16)",
    backgroundColor: "rgba(10,46,61,0.56)",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  emptyText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    flex: 1,
  },
  historyCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.16)",
    backgroundColor: "rgba(10,46,61,0.56)",
    padding: 12,
    marginBottom: 10,
  },
  historySubject: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  historyDate: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 12,
    marginTop: 3,
  },
  historyBody: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 13,
    marginTop: 6,
  },
  historyStatus: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  statusSolved: {
    color: "#4CAF50",
  },
  statusPending: {
    color: "#FF4D6A",
  },
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5,26,38,0.97)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  successCircle: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: "#00E5FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  successTitle: {
    color: "#FFFFFF",
    fontSize: 27,
    fontWeight: "800",
    textAlign: "center",
  },
  successSub: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 18,
    lineHeight: 20,
  },
  successBtn: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.35)",
    backgroundColor: "rgba(0,229,255,0.16)",
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  successBtnText: {
    color: "#00E5FF",
    fontSize: 15,
    fontWeight: "700",
  },
});

export default Complain;
