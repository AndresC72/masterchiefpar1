import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { createMembership } from '@/common/reducers/membershipSlice'; // Import the createMembership action

export default function WebViewLayout({ route }) {
  const webViewRef = useRef(null);
  const { payData } = route.params;
  const [payUUrl, setPayUUrl] = useState(null);
  const dispatch = useDispatch();
  const navigation = useNavigation();

  useEffect(() => {
    const generatePayUUrl = async () => {
      try {
        const response = await fetch('https://us-central1-treasupdate.cloudfunctions.net/payulatam-link', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payData),
        });
        const data = await response.text();
        setPayUUrl(`data:text/html,${encodeURIComponent(data)}`);
      } catch (error) {
        Alert.alert("Error", "No se pudo generar la URL de PayU.");
      }
    };

    generatePayUUrl();
  }, [payData]);

  const onLoadStart = (syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    const { url } = nativeEvent;

    if (url.includes('success')) {
      webViewRef.current.stopLoading();
      Alert.alert("Pago exitoso", "Tu pago se ha realizado con éxito.", [
        { text: "OK", onPress: () => handleSuccess() }
      ]);
    }

    if (url.includes('cancel')) {
      webViewRef.current.stopLoading();
      Alert.alert("Pago cancelado", "Tu pago ha sido cancelado.", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
    }
  };

  const handleSuccess = () => {
    // Dispatch the action to create the membership in the database
    dispatch(createMembership({ uid: payData.uid, costo: payData.amount }))
      .then(() => {
        navigation.navigate('Memberships');
      })
      .catch((error) => {
        console.error("Error creating membership:", error);
        Alert.alert("Error", "No se pudo crear la membresía. Inténtalo de nuevo.");
      });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Procesando Pago con PayU</Text>
      {payUUrl ? (
        <WebView
          ref={webViewRef}
          source={{ uri: payUUrl }}
          onLoadStart={onLoadStart}
          style={styles.webview}
        />
      ) : (
        <ActivityIndicator size="large" color="#F20505" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  webview: {
    flex: 1,
  },
});

