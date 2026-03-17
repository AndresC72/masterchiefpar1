import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  ScrollView,
} from "react-native";
import { Ionicons, MaterialIcons, FontAwesome, Feather } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/common/store";
import { format } from "date-fns";
import {
  fetchWalletHistory,
  selectWalletHistory,
  selectWalletLoading,
} from "@/common/reducers/walletSlice";
import {
  fetchMemberships,
  selectMembershipLoading,
} from "@/common/reducers/membershipSlice";
import { listenToSettingsChanges, selectSettings } from "@/common/reducers/settingsSlice";

type Props = NativeStackScreenProps<any>;

const WalletDetails = ({ navigation }: Props) => {
  const user = useSelector((state: RootState) => state.auth.user);
  const walletHistory = useSelector(selectWalletHistory);
  const walletLoading = useSelector(selectWalletLoading);
  const memberships = useSelector(
    (state: RootState) => state.memberships.memberships
  );
  const isLoadingMemberships = useSelector(selectMembershipLoading);
  const dispatch = useDispatch<AppDispatch>();
  const settings = useSelector(selectSettings);

  const glow1 = useRef(new Animated.Value(0)).current;
  const glow2 = useRef(new Animated.Value(0)).current;
  const glow3 = useRef(new Animated.Value(0)).current;
  const orbRotate = useRef(new Animated.Value(0)).current;
  const shineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    dispatch(listenToSettingsChanges());
  }, [dispatch]);

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchWalletHistory(user?.id));
      dispatch(fetchMemberships(user?.id));
    }
  }, [dispatch, user?.id]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow1, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glow1, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glow2, {
          toValue: 1,
          duration: 4200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glow2, {
          toValue: 0,
          duration: 4200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glow3, {
          toValue: 1,
          duration: 2600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glow3, {
          toValue: 0,
          duration: 2600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(orbRotate, {
        toValue: 1,
        duration: 20000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.timing(shineAnim, {
        toValue: 1,
        duration: 6000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      })
    ).start();
  }, [glow1, glow2, glow3, orbRotate, shineAnim]);

  const calculateDaysRemaining = (endDate: Date | undefined) => {
    if (!endDate) return 0;
    const today = new Date();
    const timeDiff = endDate.getTime() - today.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  };

  const activeMembership = memberships.find(
    (membership) => membership.status === "ACTIVA"
  );
  const daysRemaining = activeMembership
    ? calculateDaysRemaining(new Date(activeMembership?.fecha_terminada))
    : 0;

  if (walletLoading || isLoadingMemberships) return <Text>Loading...</Text>;

  const walletBalance = user?.walletBalance || 0;
  const hasHistory = Array.isArray(walletHistory) && walletHistory.length > 0;
  const latestHistory = hasHistory ? walletHistory[walletHistory.length - 1] : null;
  const membershipStatus = activeMembership ? "Activo" : "Expirado";
  const expiryDate = activeMembership?.fecha_terminada
    ? format(new Date(activeMembership.fecha_terminada), "dd/MM/yyyy")
    : "-- / --";

  const orbSpin = orbRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const shineX = shineAnim.interpolate({
    inputRange: [0, 0.8, 1],
    outputRange: [-320, -320, 420],
  });

  const cardGlowOpacity = glow1.interpolate({
    inputRange: [0, 1],
    outputRange: [0.16, 0.28],
  });

  const topGlowScale = glow1.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.18],
  });

  const leftGlowScale = glow2.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });

  const midGlowScale = glow3.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.25],
  });

  const renewalText =
    activeMembership && daysRemaining > 0
      ? `Te quedan ${daysRemaining} dias de membresia`
      : "Necesita renovar su suscripcion";

  return (
    <View style={styles.container}>
      {/* Eliminado: elipses/círculos de fondo (walletGlowOne, walletGlowTwo, walletGlowThree, walletOrb, walletOrbInner) */}

      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color="#D9F6FF" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Mi Billetera</Text>
        <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation.navigate("Memberships")}> 
          <Feather name="settings" size={19} color="#D9F6FF" />
        </TouchableOpacity>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.cardWrap}>
          <View style={styles.membershipCard}>
            <Animated.View style={[styles.cardShine, { transform: [{ translateX: shineX }] }]} />
            <View style={styles.cardTopRow}>
              <View style={styles.cardLogoWrap}>
                <Text style={styles.cardLogoMain}>T</Text>
                <Text style={styles.cardLogoPlus}>+</Text>
              </View>
              <View
                style={[
                  styles.statusPill,
                  !activeMembership && styles.statusPillExpired,
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    !activeMembership && styles.statusDotExpired,
                  ]}
                />
                <Text
                  style={[
                    styles.statusPillText,
                    !activeMembership && styles.statusPillTextExpired,
                  ]}
                >
                  {membershipStatus}
                </Text>
              </View>
            </View>

            <View style={styles.balanceSection}>
              <Text style={styles.balanceLabel}>Saldo Disponible</Text>
              <View style={styles.balanceRow}>
                <Text style={styles.balanceCurrency}>$</Text>
                <Text style={styles.balanceAmount}>{Number(walletBalance || 0).toLocaleString("es-CO")}</Text>
              </View>
            </View>

            <View style={styles.cardFooter}>
              <View>
                <Text style={styles.cardFooterLabel}>Membresia</Text>
                <Text style={styles.cardFooterValue}>Conductor Premium</Text>
              </View>
              <View style={styles.cardFooterRight}>
                <Text style={styles.cardFooterLabel}>Vence</Text>
                <Text style={styles.cardFooterDate}>{expiryDate}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.alertBanner}>
          <View style={styles.alertIconWrap}>
            <Ionicons name="warning-outline" size={18} color="#FFFFFF" />
          </View>
          <View style={styles.alertTextWrap}>
            <Text style={styles.alertTitle}>Membresia por Vencer</Text>
            <Text style={styles.alertSub}>{renewalText}</Text>
          </View>
          <TouchableOpacity
            style={styles.renewMiniBtn}
            onPress={() => navigation.navigate("ChosePlan", { mode: "membership" })}
          >
            <Text style={styles.renewMiniBtnText}>Renovar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={styles.statIconWrap}>
              <Ionicons name="car-sport-outline" size={18} color="#00E5FF" />
            </View>
            <Text style={styles.statValue}>{walletHistory?.length || 0}</Text>
            <Text style={styles.statLabel}>Viajes</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconWrap}>
              <Ionicons name="cash-outline" size={18} color="#00E5FF" />
            </View>
            <Text style={styles.statValue}>${Number(walletBalance || 0).toLocaleString("es-CO")}</Text>
            <Text style={styles.statLabel}>Ganado</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconWrap}>
              <Ionicons name="star-outline" size={18} color="#00E5FF" />
            </View>
            <Text style={styles.statValue}>5.0</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>

        <View style={styles.historySection}>
          <View style={styles.historyHeader}>
            <View>
              <Text style={styles.historyTitle}>Historial de Servicios</Text>
              <Text style={styles.historyBadge}>Ultimo Servicio</Text>
            </View>
          </View>

          {latestHistory ? (
            <View style={styles.historyCard}>
              <Text style={styles.historyLine}>Fecha: {format(new Date(latestHistory.date), "dd/MM/yyyy HH:mm")}</Text>
              <Text style={styles.historyLine}>
                {user?.cartype === "TREAS-X"
                  ? `Kilometros descontados: ${latestHistory.kilometros ?? 0} KM`
                  : `Valor del servicio: $${latestHistory.amount ?? 0}`}
              </Text>
              <Text style={styles.historyLine}>Referencia: {latestHistory.txRef || "N/A"}</Text>
            </View>
          ) : (
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="document-text-outline" size={28} color="#00E5FF" />
              </View>
              <Text style={styles.emptyTitle}>Sin historial aun</Text>
              <Text style={styles.emptySub}>Tus servicios completados apareceran aqui</Text>
            </View>
          )}
        </View>

        <View style={styles.ctaWrap}>
          <TouchableOpacity
            style={styles.ctaMain}
            onPress={() => navigation.navigate("ChosePlan", { mode: "membership" })}
          >
            <Ionicons name="refresh-outline" size={20} color="#051A26" />
            <Text style={styles.ctaMainText}>Renovar Membresia</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.packagesWrap}>
        {[
          ...(settings.Membership
            ? [{ icon: "local-offer", text: "Membresía", mode: "membership" }]
            : []),
          ...(user && user?.cartype === "TREAS-X" && settings.KilimetrsWallet
            ? [{ icon: "road", text: "Kilómetros", mode: "kms" }]
            : []),
        ].map(({ icon, text, mode }, idx) => (
          <TouchableOpacity
            key={mode}
            style={[
              styles.packageBtn,
              idx === 1 && { marginTop: 10 },
            ]}
            onPress={() => navigation.navigate("ChosePlan", { mode })}
          >
            {icon === "local-offer" ? (
              <MaterialIcons name={icon} size={24} color="white" />
            ) : (
              <FontAwesome name={icon} size={24} color="white" />
            )}
            <Text style={styles.packageBtnText}>
              Paquete {text}
            </Text>
          </TouchableOpacity>
        ))}
        </View>
      </ScrollView>
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
  walletGlowOne: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: "#00E5FF",
    top: -80,
    right: -80,
    opacity: 0.2,
  },
  walletGlowTwo: {
    position: "absolute",
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: "#00b0ff",
    left: -80,
    bottom: "18%",
    opacity: 0.18,
  },
  walletGlowThree: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(0,229,255,0.65)",
    left: "50%",
    top: "45%",
    marginLeft: -90,
    marginTop: -90,
    opacity: 0.1,
  },
  walletOrb: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    top: "20%",
    right: -60,
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  walletOrbInner: {
    width: 155,
    height: 155,
    borderRadius: 77.5,
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.08)",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 48,
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: "rgba(5,26,38,0.75)",
  },
  headerIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(10,46,61,0.55)",
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    fontSize: 19,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  cardWrap: {
    marginTop: 10,
    marginBottom: 14,
  },
  membershipCard: {
    borderRadius: 26,
    paddingHorizontal: 18,
    paddingVertical: 18,
    width: "100%",
    backgroundColor: "rgba(0, 55, 84, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.28)",
    overflow: "hidden",
  },
  cardShine: {
    position: "absolute",
    top: -20,
    width: 140,
    height: 300,
    backgroundColor: "rgba(255,255,255,0.08)",
    transform: [{ rotate: "-20deg" }],
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardLogoWrap: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  cardLogoMain: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "800",
    lineHeight: 34,
  },
  cardLogoPlus: {
    color: "#00E5FF",
    fontSize: 20,
    fontWeight: "800",
    marginTop: -2,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 30,
    backgroundColor: "rgba(0,229,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.32)",
    gap: 6,
  },
  statusPillExpired: {
    backgroundColor: "transparent",
    borderColor: "#FFFFFF",
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#00E5FF",
  },
  statusDotExpired: {
    backgroundColor: "#FFFFFF",
  },
  statusPillText: {
    color: "#00E5FF",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  statusPillTextExpired: {
    color: "#FFFFFF",
  },
  balanceSection: {
    paddingVertical: 18,
    alignItems: "center",
  },
  balanceLabel: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    letterSpacing: 0.7,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  balanceCurrency: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 24,
    marginTop: 8,
    marginRight: 3,
    fontWeight: "600",
  },
  balanceAmount: {
    color: "#FFFFFF",
    fontSize: 46,
    fontWeight: "800",
    letterSpacing: -1.5,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "rgba(0,229,255,0.16)",
    paddingTop: 12,
  },
  cardFooterRight: {
    alignItems: "flex-end",
  },
  cardFooterLabel: {
    color: "rgba(255,255,255,0.38)",
    fontSize: 11,
    textTransform: "uppercase",
  },
  cardFooterValue: {
    color: "#00E5FF",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 2,
  },
  cardFooterDate: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 2,
  },
  alertBanner: {
    marginBottom: 12,
    borderRadius: 16,
    padding: 12,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
  },
  alertIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  alertTextWrap: {
    flex: 1,
  },
  alertTitle: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },
  alertSub: {
    color: "rgba(255,255,255,0.65)",
    marginTop: 1,
    fontSize: 12,
  },
  renewMiniBtn: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    backgroundColor: "transparent",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  renewMiniBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 13,
    paddingHorizontal: 8,
    backgroundColor: "rgba(10,46,61,0.6)",
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.18)",
    alignItems: "center",
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,229,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  statValue: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 17,
    textAlign: "center",
  },
  statLabel: {
    marginTop: 2,
    color: "rgba(255,255,255,0.55)",
    fontSize: 11,
    textTransform: "uppercase",
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
    fontWeight: "700",
    fontSize: 18,
  },
  historyBadge: {
    marginTop: 4,
    alignSelf: "flex-start",
    color: "#00E5FF",
    backgroundColor: "rgba(0,229,255,0.13)",
    borderRadius: 20,
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 3,
    fontSize: 11,
    textTransform: "uppercase",
    fontWeight: "600",
  },
  historyCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.18)",
    backgroundColor: "rgba(8,33,46,0.75)",
    padding: 12,
    gap: 6,
  },
  historyLine: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
  },
  emptyWrap: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.14)",
    backgroundColor: "rgba(8,33,46,0.5)",
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.18)",
    backgroundColor: "rgba(0,229,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  emptyTitle: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 16,
    fontWeight: "700",
  },
  emptySub: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 13,
    marginTop: 4,
  },
  ctaWrap: {
    marginBottom: 14,
  },
  ctaMain: {
    borderRadius: 22,
    backgroundColor: "#00E5FF",
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  ctaMainText: {
    color: "#051A26",
    fontWeight: "800",
    fontSize: 16,
  },
  packagesWrap: {
    paddingBottom: 24,
  },
  packageBtn: {
    borderRadius: 14,
    paddingVertical: 13,
    backgroundColor: "rgba(0,229,255,0.2)",
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.35)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  packageBtnText: {
    color: "#E8FCFF",
    fontWeight: "700",
    fontSize: 14,
  },
});

export default WalletDetails;