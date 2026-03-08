import { Dispatch } from "redux";
import { setProfile } from './../reducers/authReducer';
import { UserType } from './../store/types';
import { UserProfile } from './../store/authSlice';
import supabase from '@/config/SupabaseConfig';

const profileFetchInFlight = new Set<string>();
const lastProfileFetchAt = new Map<string, number>();
const PROFILE_FETCH_DEDUP_MS = 1500;

interface SupabaseUserData {
  id: string;
  auth_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  mobile?: string;
  user_type: UserType;
  car_type?: string;
  car_image?: string;
  vehicle_number?: string;
  vehicle_make?: string;
  company_name?: string;
  profile_image?: string;
  rating?: number;
  total_trips?: number;
  total_earnings?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

const createUserProfile = (userData: SupabaseUserData): UserProfile => {
  return {
    id: userData.id,
    auth_id: userData.auth_id,
    email: userData.email,
    first_name: userData.first_name || '',
    last_name: userData.last_name || '',
    mobile: userData.mobile || null,
    user_type: userData.user_type,
    wallet_balance: 0,
    location: null,
    profile_image: userData.profile_image || null,
    rating: userData.rating || 0,
    total_rides: userData.total_trips || 0,
    is_verified: false,
    approved: false,
    blocked: false,
    referral_id: null,
    city: null,
    driver_active_status: false,
    license_number: null,
    license_image: null,
    license_image_back: null,
    soat_image: null,
    card_prop_image: null,
    card_prop_image_bk: null,
    verify_id_image: null,
    verify_id_image_bk: null,
    push_token: null,
    user_platform: null,
    created_at: userData.created_at || new Date().toISOString(),
    updated_at: userData.updated_at || new Date().toISOString(),
  };
};

/**
 * Obtiene datos del usuario de Supabase y los dispatcha al Redux store
 * @param authId - UUID del usuario autenticado en auth.users
 * @param dispatch - Dispatch de Redux
 * @returns Función para desinscribirse (compatible con Firebase)
 */
export const fetchAndDispatchUserData = (authId: string, dispatch: Dispatch): (() => void) => {
  const unsubscribed = { current: false };

  const fetchUser = async () => {
    if (unsubscribed.current) return;

    const now = Date.now();
    const lastFetchTime = lastProfileFetchAt.get(authId) || 0;
    if (profileFetchInFlight.has(authId) || now - lastFetchTime < PROFILE_FETCH_DEDUP_MS) {
      return;
    }

    profileFetchInFlight.add(authId);
    lastProfileFetchAt.set(authId, now);

    try {
      console.log(`[UserActions] Fetching user profile for auth_id: ${authId}`);

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authId)
        .single();

      if (unsubscribed.current) return;

      if (error) {
        console.error('[UserActions] Error fetching user profile:', error.message);
        return;
      }

      if (!data) {
        console.warn('[UserActions] No user data found in Supabase');
        return;
      }

      if (!data.user_type) {
        console.error('[UserActions] User type is undefined');
        return;
      }

      const userProfile = createUserProfile(data as SupabaseUserData);
      console.log('[UserActions] User profile created:', userProfile);
      dispatch(setProfile(userProfile));
    } catch (error) {
      if (!unsubscribed.current) {
        console.error('[UserActions] Unexpected error fetching user data:', error);
      }
    } finally {
      profileFetchInFlight.delete(authId);
    }
  };

  // Realizar la búsqueda inicial
  fetchUser();

  // Retornar función de limpieza
  return () => {
    unsubscribed.current = true;
  };
};
