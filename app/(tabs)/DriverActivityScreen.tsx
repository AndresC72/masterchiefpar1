import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const BG_IMAGE = require('../../assets/images/bg.png');

type TripSection = {
  key: 'activas' | 'completas' | 'canceladas';
  title: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  text: string;
  button: string;
};

const SECTIONS: TripSection[] = [
  {
    key: 'activas',
    title: 'Activas',
    icon: 'information-circle-outline',
    text: 'No hay viajes activos en este momento.',
    button: 'Ver detalles',
  },
  {
    key: 'completas',
    title: 'Completas',
    icon: 'checkmark-circle-outline',
    text: 'No hay viajes completados aún.',
    button: 'Ver historial',
  },
  {
    key: 'canceladas',
    title: 'Canceladas',
    icon: 'close-circle-outline',
    text: 'No hay viajes cancelados.',
    button: 'Ver historial',
  },
];

const FloatingEmptyIcon = ({ name }: { name: React.ComponentProps<typeof Ionicons>['name'] }) => {
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, { toValue: -10, duration: 2000, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [translateY]);

  return (
    <Animated.View style={[styles.emptyIconWrap, { transform: [{ translateY }] }]}>
      <Ionicons name={name} size={44} color="#00E5FF" />
    </Animated.View>
  );
};

const DriverActivityScreen = () => {
  const nav = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const topPad = Math.max(insets.top, Platform.OS === 'ios' ? 20 : 18) + 6;
  const androidBottomOffset = Platform.OS === 'android' ? 42 : 0;
  const bottomPad = insets.bottom + 120 + androidBottomOffset;

  return (
    <View style={styles.root}>
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <Image source={BG_IMAGE} style={styles.bgImage} resizeMode="cover" />
        <View style={styles.bgOverlay} />
      </View>

      <View style={[styles.header, { paddingTop: topPad }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => nav.goBack()} activeOpacity={0.75}>
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Actividad</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        {SECTIONS.map((section, index) => (
          <Animatable.View
            key={section.key}
            animation="fadeInUp"
            duration={480}
            delay={index * 90}
            useNativeDriver
            style={styles.sectionBlock}
          >
            <View style={styles.sectionTitleBar}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>

            <View style={styles.emptyCard}>
              <View style={styles.cardGlow} />
              <FloatingEmptyIcon name={section.icon} />
              <Text style={styles.emptyText}>{section.text}</Text>
              <TouchableOpacity
                style={styles.viewAllBtn}
                activeOpacity={0.8}
              >
                <Text style={styles.viewAllText}>{section.button}</Text>
                <Ionicons name="arrow-forward" size={15} color="#00E5FF" />
              </TouchableOpacity>
            </View>
          </Animatable.View>
        ))}
      </ScrollView>
    </View>
  );
};

export default DriverActivityScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#051A26',
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.34,
  },
  bgOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5,26,38,0.78)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: 'rgba(5,26,38,0.82)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  headerSpacer: {
    width: 40,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 18,
  },
  sectionBlock: {
    marginBottom: 28,
  },
  sectionTitleBar: {
    paddingVertical: 10,
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,229,255,0.1)',
    backgroundColor: 'rgba(5,26,38,0.95)',
  },
  sectionTitle: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
    color: '#00E5FF',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  emptyCard: {
    overflow: 'hidden',
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(10,46,61,0.48)',
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.14)',
    alignItems: 'center',
  },
  cardGlow: {
    position: 'absolute',
    top: -30,
    left: -30,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(0,229,255,0.06)',
  },
  emptyIconWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(10,46,61,0.75)',
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 6,
    marginBottom: 18,
  },
  emptyText: {
    fontSize: 16,
    lineHeight: 23,
    color: 'rgba(255,255,255,0.72)',
    textAlign: 'center',
    marginBottom: 18,
    fontWeight: '500',
  },
  viewAllBtn: {
    width: '100%',
    borderRadius: 16,
    paddingVertical: 13,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0,229,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.18)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#00E5FF',
    marginRight: 8,
    letterSpacing: 0.2,
  },
});
