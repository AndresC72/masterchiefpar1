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
 * Actualiza el perfil del usuario en Supabase y Redux
 * @param userId - ID del usuario en la tabla users
 * @param profileData - Datos a actualizar (campos personales)
 * @param dispatch - Dispatch de Redux
 * @param imageUri - (opcional) URI de imagen para subir
 * @returns Resultado de la operación
 */
export const updateUserProfileSupabase = async (
  userId: string,
  profileData: Partial<UserProfile>,
  dispatch: Dispatch,
  imageUri?: string
) => {
  try {
    let imageUrl = profileData.profile_image || null;
    // Si hay imagen, subirla a Supabase Storage (o Firebase si se requiere)
    if (imageUri) {
      // Aquí puedes agregar lógica para subir la imagen a Supabase Storage
      // Por ejemplo, usando supabase.storage
      // imageUrl = await subirImagenASupabase(imageUri, userId);
      // Por ahora, solo asigna el URI
      imageUrl = imageUri;
    }

    // Actualizar datos en Supabase
    const { data, error } = await supabase
      .from('users')
      .update({ ...profileData, profile_image: imageUrl, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select('*')
      .single();

    if (error) {
      console.error('[UserActions] Error actualizando perfil en Supabase:', error.message);
      return { success: false, error: error.message };
    }

    // Actualizar Redux
    if (data) {
      const userProfile = createUserProfile(data as SupabaseUserData);
      dispatch(setProfile(userProfile));
    }

    return { success: true, data };
  } catch (err: any) {
    console.error('[UserActions] Error inesperado actualizando perfil:', err);
    return { success: false, error: err?.message || 'Error desconocido' };
  }
};
