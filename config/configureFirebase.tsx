import React, { createContext, useContext } from 'react';
import { initializeApp, getApp, getApps } from "firebase/app";
import { getDatabase, ref, query, orderByChild, equalTo } from "firebase/database";
import { initializeAuth, getAuth, OAuthProvider, PhoneAuthProvider, signInWithPhoneNumber, unlink, updatePhoneNumber, linkWithPhoneNumber, browserLocalPersistence, browserPopupRedirectResolver } from "firebase/auth";
import { getReactNativePersistence } from './react-native-persistance';
import { getStorage, ref as stRef } from "firebase/storage";
import FirebaseConfig from './SupabaseConfig';

const FirebaseContext = createContext<any>(null);

let firebase = {
    app: null,
    database: null,
    auth: null,
    storage: null,
}

const createFullStructure = (app: any, db: any, auth: any, storage: any, config: any) => {
    return {
        app: app,
        config: config,
        database: db,
        auth: auth,
        storage: storage,
        appleProvider: new OAuthProvider('apple.com'),
        phoneProvider: new PhoneAuthProvider(auth),  
        signInWithPhoneNumber: signInWithPhoneNumber,   
        updatePhoneNumber: updatePhoneNumber,
        linkWithPhoneNumber: linkWithPhoneNumber,
        unlink: unlink, 
        usersRef: ref(db, 'users'),
        cancelreasonRef: ref(db, 'cancel_reason'),
        settingsRef: ref(db, 'settings'),
        smtpRef: ref(db, "smtpdata"),
        smsRef: ref(db, "smsConfig"),
        carTypesRef: ref(db, 'cartypes'),
        carTypesEditRef: (id: string) => ref(db, `cartypes/${id}`),
        carDocImage: (id: string) => stRef(storage, `cartypes/${id}`),
        promoRef: ref(db, 'promos'),
        promoEditRef: (id: string) => ref(db, `promos/${id}`),
        notifyRef: ref(db, "notifications/"),
        notifyEditRef: (id: string) => ref(db, `notifications/${id}`),
        addressRef: (uid: string, id: string) => ref(db, `savedAddresses/${uid}/${id}`),
        addressEditRef: (uid: string) => ref(db, `savedAddresses/${uid}`),
        singleUserRef: (uid: string) => ref(db, `users/${uid}`),
        profileImageRef: (uid: string) => stRef(storage, `users/${uid}/profileImage`),
        verifyIdImageRef: (uid: string) => stRef(storage, `users/${uid}/verifyIdImage`),
        bookingImageRef: (bookingId: string, imageType: string) => stRef(storage, `bookings/${bookingId}/${imageType}`),
        driversRef: query(ref(db, "users"), orderByChild("usertype"), equalTo("driver")),
        driverDocsRef: (uid: string) => stRef(storage, `users/${uid}/license`),
        driverDocsRefBack: (uid: string) => stRef(storage, `users/${uid}/licenseBack`),
        singleBookingRef: (bookingKey: string) => ref(db, `bookings/${bookingKey}`),
        requestedDriversRef: (bookingKey: string) => ref(db, `bookings/${bookingKey}/requestedDrivers`),
        referralIdRef: (referralId: string) => query(ref(db, "users"), orderByChild("referralId"), equalTo(referralId)),
        trackingRef: (bookingId: string) => ref(db, `tracking/${bookingId}`),
        tasksRef: () => query(ref(db, 'bookings'), orderByChild('status'), equalTo('NEW')),
        singleTaskRef: (uid: string, bookingId: string) => ref(db, `bookings/${bookingId}/requestedDrivers/${uid}`),
        bookingListRef: (uid: string, role: string) =>
            role === 'customer' ? query(ref(db, 'bookings'), orderByChild('customer'), equalTo(uid)) :
                (role === 'driver' ?
                    query(ref(db, 'bookings'), orderByChild('driver'), equalTo(uid)) :
                    (role === 'fleetadmin' ?
                        query(ref(db, 'bookings'), orderByChild('fleetadmin'), equalTo(uid)) :
                        ref(db, 'bookings')
                    )
                ),
        chatRef: (bookingId: string) => ref(db, `chats/${bookingId}/messages`),
        withdrawRef: ref(db, 'withdraws/'),
        languagesRef: ref(db, "languages"),
        languagesEditRef: (id: string) => ref(db, `languages/${id}`),
        walletHistoryRef: (uid: string) => ref(db, `walletHistory/${uid}`),
        userNotificationsRef: (uid: string) => ref(db, `userNotifications/${uid}`),
        userRatingsRef: (uid: string) => ref(db, `userRatings/${uid}`),
        carsRef: (uid: string, role: string) =>
            role === 'driver' ?
                query(ref(db, 'cars'), orderByChild('driver'), equalTo(uid)) :
                (role === 'fleetadmin' ?
                    query(ref(db, 'cars'), orderByChild('fleetadmin'), equalTo(uid)) :
                    ref(db, 'cars')
                ),
        carAddRef: ref(db, "cars"),
        carEditRef: (id: string) => ref(db, `cars/${id}`),
        carImage: (id: string) => stRef(storage, `cars/${id}`),
        allLocationsRef: ref(db, "locations"),
        userLocationRef: (uid: string) => ref(db, `locations/${uid}`),
        sosRef: ref(db, 'sos'),
        editSosRef: (id: string) => ref(db, `sos/${id}`),
        complainRef: ref(db, 'complain'),
        editComplainRef: (id: string) => ref(db, `complain/${id}`),
        paymentSettingsRef: ref(db, "payment_settings"),
        usedreferralRef: ref(db, 'usedreferral'),
    };
};

const FirebaseProvider: React.FC<{ config: any, children: React.ReactNode, AsyncStorage: any }> = ({ config, children, AsyncStorage }) => {
    let app: any, auth: any, database: any, storage: any;

    if (!getApps().length) {
        try {
            app = initializeApp(config);

            if (typeof document !== 'undefined') {
                auth = initializeAuth(app, {
                    persistence: browserLocalPersistence,
                    popupRedirectResolver: browserPopupRedirectResolver,
                });
            } else {
                auth = initializeAuth(app, {
                    persistence: getReactNativePersistence(AsyncStorage),
                });
            }
            database = getDatabase(app);
            storage = getStorage(app);
        } catch (error) {
            //console.log("Error initializing app: " + error);
        }
    } else {
        app = getApp();
        auth = getAuth(app);
        database = getDatabase(app);
        storage = getStorage(app);
    }

    firebase = createFullStructure(app, database, auth, storage, config);

    return (
        <FirebaseContext.Provider value={firebase}>
            {children}
        </FirebaseContext.Provider>
    );
};

const useFirebase = () => {
    const context = useContext(FirebaseContext);
    if (!context) {
        throw new Error('useFirebase debe ser usado dentro de un FirebaseProvider');
    }
    return context;
};

export const initializeFirebaseApp = () => {
    if (!getApps().length) {
        initializeApp(FirebaseConfig);
    }
};

export { FirebaseProvider, useFirebase, FirebaseContext, firebase };