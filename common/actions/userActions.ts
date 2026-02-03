import { getDatabase, ref, onValue, Unsubscribe } from "firebase/database";
import { Dispatch } from "redux";
import { login } from './../store/authSlice';
import { 
  DriverProfile, 
  CustomerProfile, 
  CompanyProfile, 
  UserType 
} from './../store/types';
import { UserProfile } from './../store/authSlice'; // ✅ USAR TIPO UNIFICADO

interface FirebaseUserData {
  usertype: UserType;
  carType?: string;
  car_image?: string;
  vehicleNumber?: string;
  vehicleMake?: string;
  companyName?: string;
  // Agrega otros campos comunes según sea necesario
  [key: string]: any;
}

const createUserProfile = (userData: FirebaseUserData): UserProfile => {
  switch (userData.usertype) {
    case "driver":
      return {
        ...userData,
        usertype: "driver",
        carType: userData.carType!,
        car_image: userData.car_image!,
        vehicleNumber: userData.vehicleNumber!,
        vehicleMake: userData.vehicleMake!,
      } as DriverProfile;
    case "customer":
      return {
        ...userData,
        usertype: "customer",
      } as CustomerProfile;
    default:
      throw new Error(`Unknown user type: ${userData.usertype}`);
  }
};

export const fetchAndDispatchUserData = (uid: string, dispatch: Dispatch): Unsubscribe => {
  const db = getDatabase();
  const userRef = ref(db, `users/${uid}`);

  const unsubscribe = onValue(
    userRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        console.error("No user data available");
        return;
      }

      const userData: FirebaseUserData = snapshot.val();

      if (!userData.usertype) {
        console.error("User type is undefined");
        return;
      }

      try {
        const userProfile = createUserProfile(userData);
        dispatch(login(userProfile));
      } catch (error) {
        console.error(error);
      }
    },
    (error) => {
      console.error("Error listening to user data:", error);
    }
  );

  return unsubscribe;
};
