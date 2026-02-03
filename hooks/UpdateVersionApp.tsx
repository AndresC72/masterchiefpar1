import { Platform, Linking } from "react-native";
import { updateProfile } from "@/common/actions/authactions";

export const checkAppVersion = async (dispatch: any) => {
    console.log('checkAppVersion------ Iniciando verificación de versión');
    console.log('checkAppVersion------ Iniciando verificación de versión',);
    try {
        const appConfig = require('../app/config');
        console.log('App Config Cargado:', appConfig);
        
    //    const dispatch = useDispatch();
        console.log('useDispatch hook inicializado');

        const currentVersion =  appConfig.expo.version; // Obtiene la versión actual de la app
        console.log('Versión Actual de la App:', currentVersion);

        // URLs de las tiendas configuradas según la plataforma
        const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.treasapp.treas22'; // Reemplaza con tu URL de Play Store
        const appleStoreUrl = 'https://apps.apple.com/app/treasapp/id6456222848'; // Reemplaza con tu URL de Apple Store
        console.log('URLs de las tiendas configuradas:', { playStoreUrl, appleStoreUrl });

        dispatch(updateProfile({ AppVersion: currentVersion }));
        console.log('Perfil actualizado con la versión actual de la app');

        if (Platform.OS === 'android') {
            const settingsVersion = parseInt(settings.android_app_version, 10); // Obtener la versión desde settings y convertir a número
            console.log('Versión obtenida de Settings:', settingsVersion);

            console.log(`Comparando versiones: Actual=${currentVersion} vs Settings=${settingsVersion}`);
            if (currentVersion < settingsVersion) {
                console.log('Nueva versión disponible según Settings. Abriendo URL de Play Store.');
                Linking.openURL(playStoreUrl);
            } else {
                console.log('La versión actual está actualizada con respecto a Settings.');
            }
        } else if (Platform.OS === 'ios') {
            const appleStoreVersion = await fetchAppleStoreVersion();
            console.log('Versión obtenida de Apple Store:', appleStoreVersion);

            if (appleStoreVersion) {
                console.log(`Comparando versiones: Actual=${currentVersion} vs AppleStore=${appleStoreVersion}`);
                if (currentVersion < appleStoreVersion) {
                    console.log('Nueva versión disponible en Apple Store. Abriendo URL de Apple Store.');
                    Linking.openURL(appleStoreUrl);
                } else {
                    console.log('La versión actual está actualizada con respecto a Apple Store.');
                }
            } else {
                console.log('No se pudo obtener la versión de Apple Store.');
            }
        } else {
            console.log('Plataforma no soportada para verificación de versión.');
        }

    } catch (error) {
        console.error("Error al verificar la versión de la aplicación:", error);
    }
};

export const fetchPlayStoreVersion = async () => {
    console.log('fetchPlayStoreVersion------ Iniciando fetch de Play Store');
    try {
        const response = await fetch('https://play.google.com/store/apps/details?id=com.treasapp.treas22');
        console.log('Respuesta de Play Store recibida:', response.status);
        if (!response.ok) {
            console.error('Error al fetch de Play Store:', response.statusText);
            return null;
        }
        const text = await response.text();
        const versionMatch = text.match(/Current Version<\/div><span class="htlgb">([^<]*)<\/span>/);
        const playStoreVersion = versionMatch ? versionMatch[1].trim() : null;
        console.log('Versión extraída de Play Store:', playStoreVersion);
        return playStoreVersion;
    } catch (error) {
        console.error('Error al obtener la versión de Play Store:', error);
        return null;
    }
};

export const fetchAppleStoreVersion = async () => {
    console.log('fetchAppleStoreVersion------ Iniciando fetch de Apple Store');
    try {
        const response = await fetch('https://itunes.apple.com/lookup?bundleId=com.treasapp.treas24');
        console.log('Respuesta de Apple Store recibida:', response.status);
        if (!response.ok) {
            console.error('Error al fetch de Apple Store:', response.statusText);
            return null;
        }
        const data = await response.json();
        const appleStoreVersion = data.results[0]?.version || null;
        console.log('Versión extraída de Apple Store:', appleStoreVersion);
        return appleStoreVersion;
    } catch (error) {
        console.error('Error al obtener la versión de Apple Store:', error);
        return null;
    }
};

