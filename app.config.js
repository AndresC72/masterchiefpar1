import { AppConfig, API_KEY } from "./config/AppConfig";

export default {
    name: AppConfig.app_name,
    description: AppConfig.app_description,
    owner: AppConfig.expo_owner,
    slug: AppConfig.expo_slug,
    scheme: AppConfig.expo_slug,
    privacy: "public",

    runtimeVersion: AppConfig.runtime_Version,

    platforms: [
        "ios",
        "android"
    ],
    androidStatusBar: {
        hidden: true,
        translucent: true
    },
    version: AppConfig.ios_app_version,
    orientation: "portrait",
    icon: AppConfig.icon_app,
    splash: {
        "image": "./assets/images/splash.png",
        "resizeMode": 'cover',
        "backgroundColor": "#ffffff"
    },
    updates: {
        "fallbackToCacheTimeout": 0,
        "url": "https://u.expo.dev/" + AppConfig.expo_project_id,
    },
    extra: {
        eas: {
            projectId: AppConfig.expo_project_id
        }
    },
    assetBundlePatterns: [
        "**/*"
    ],
    packagerOpts: {
        config: "metro.config.js"
    },
    ios: {
        supportsTablet: true,
        usesAppleSignIn: true,
        bundleIdentifier: AppConfig.app_identifier_ios,
        entitlements: {
            "com.apple.developer.devicecheck.appattest-environment": "production"
        },
        infoPlist: {
            "NSMotionUsageDescription": "Esta aplicación utiliza el giroscopio para mejorar la experiencia del usuario.",
            "NSUserTrackingUsageDescription": "Para brindar un servicio de transporte confiable...",
            "NSLocationAlwaysUsageDescription": "This app uses the always location access...",
            "NSLocationAlwaysAndWhenInUseUsageDescription": "This app uses the always location access...",
            "NSLocationWhenInUseUsageDescription": "For a reliable ride...",
            "NSCameraUsageDescription": "This app uses the camera to take your profile picture.",
            "NSPhotoLibraryUsageDescription": "This app uses Photo Library for uploading your profile picture.",
            "ITSAppUsesNonExemptEncryption": false,
            "UIBackgroundModes": [
                "location",
                "fetch",
                "remote-notification"
            ]
        },
        "privacyManifests": {
            "NSPrivacyAccessedAPITypes": [
                {
                    "NSPrivacyAccessedAPIType": "NSPrivacyAccessedAPICategoryUserDefaults",
                    "NSPrivacyAccessedAPITypeReasons": ["CA92.1"]
                },
                {
                    "NSPrivacyAccessedAPIType": "NSPrivacyAccessedAPICategoryFileTimestamp",
                    "NSPrivacyAccessedAPITypeReasons": ["3B52.1"]
                },
                {
                    "NSPrivacyAccessedAPIType": "NSPrivacyAccessedAPICategoryDiskSpace",
                    "NSPrivacyAccessedAPITypeReasons": ["E174.1"]
                },
                {
                    "NSPrivacyAccessedAPIType": "NSPrivacyAccessedAPICategorySystemBootTime",
                    "NSPrivacyAccessedAPITypeReasons": ["35F9.1"]
                }
            ]
        },
        config: {
            googleMapsApiKey: API_KEY
        },
        googleServicesFile: "./GoogleService-Info.plist",
        buildNumber: AppConfig.ios_app_version
    },
    android: {
        compileSdkVersion: 34,
        targetSdkVersion: 34,
        buildToolsVersion: "34.0.0",
        package: AppConfig.app_identifier,
        versionCode: AppConfig.android_app_version,
        "permissions": [
            "CAMERA",
            "READ_EXTERNAL_STORAGE",
            "WRITE_EXTERNAL_STORAGE",
            "ACCESS_FINE_LOCATION",
            "ACCESS_COARSE_LOCATION",
            "CAMERA_ROLL",
            "FOREGROUND_SERVICE",
            "FOREGROUND_SERVICE_LOCATION",
            "ACCESS_BACKGROUND_LOCATION",
            "SCHEDULE_EXACT_ALARM",
            "BODY_SENSORS"
        ],
        blockedPermissions: ["com.google.android.gms.permission.AD_ID"],
        googleServicesFile: "./google-services.json",
        config: {
            googleMaps: {
                apiKey: API_KEY
            }
        }
    },
    "plugins": [
        "expo-asset",
        "expo-localization",
        "@react-native-firebase/app",
        "@react-native-firebase/auth",
        // "react-native-background-fetch",
        [
            "expo-notifications",
            {
                "icon": "./assets/images/logo1024x1024.png",
                "sounds": [
                    "./assets/sounds/horn.wav",
                    "./assets/sounds/repeat.wav"
                ]
            }
        ],
        [
            "expo-build-properties",
            {
                "ios": {
                    "useFrameworks": "static"
                }
            }
        ],
        [
            "expo-image-picker",
            {
                "photosPermission": "This app uses Photo Library for uploading your profile picture.",
                "cameraPermission": "This app uses the camera to take your profile picture."
            }
        ],
        [
            "expo-location",
            {
                "locationAlwaysAndWhenInUsePermission": "This app uses the always location access in the background...",
                "locationAlwaysPermission": "This app uses the always location access in the background...",
                "locationWhenInUsePermission": "For a reliable ride, App collects location data from the time you open the app until a trip ends...",
                "isIosBackgroundLocationEnabled": true,
                "isAndroidBackgroundLocationEnabled": true,
                "isAndroidForegroundServiceEnabled": true
            }
        ],
        [
            "expo-tracking-transparency",
            {
                "userTrackingPermission": "This identifier will be used to deliver personalized ads to you."
            }
        ],
        "expo-router"
    ]
}