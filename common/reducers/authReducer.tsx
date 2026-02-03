import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { UserProfile } from '../store/authSlice'; // ✅ USAR TIPO UNIFICADO

interface AuthState {
  isAuthenticated: boolean;
  user: SupabaseUser | null; // ✅ USAR SUPABASE USER
  profile: UserProfile | null;
  loading: boolean;
  error: {
    flag: boolean;
    msg: string | null;
  };
  verificationId: string | null;
}

const initialState: AuthState = {
  isAuthenticated: true || null,
  user: null,
  profile: null,
  loading: false,
  error: {
    flag: false,
    msg: null,
  },
  verificationId: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login: (state, action: PayloadAction<SupabaseUser | null>) => {
      if (action.payload) {
        state.isAuthenticated = true;
        state.user = action.payload;
        state.error = { flag: false, msg: null };
      } else {
        state.error = { flag: true, msg: "Autenticación fallida." };
      }
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.profile = null;
    },
    setProfile: (state, action: PayloadAction<UserProfile | null>) => {
      state.profile = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (
      state,
      action: PayloadAction<{ flag: boolean; msg: string | null }>
    ) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error.flag = false;
      state.error.msg = null;
    },
    setVerificationId: (state, action: PayloadAction<string | null>) => {
      state.verificationId = action.payload;
    },
    updatePushToken: (state, action: PayloadAction<string>) => {
      // ✅ PushToken se maneja en el perfil, no en el usuario de Supabase
      if (state.profile) {
        state.profile.push_token = action.payload;
      }
    },
    updateUserProfile: (state, action: PayloadAction<Partial<UserProfile>>) => {
      if (state.profile) {
        state.profile = { ...state.profile, ...action.payload };
      }
    },
    loadSession: (state, action: PayloadAction<SupabaseUser | null>) => {
      if (action.payload) {
        state.isAuthenticated = true;
        state.user = action.payload;
        state.error = { flag: false, msg: null }; // Limpiar errores al cargar sesión
      } else {
        state.isAuthenticated = false;
        state.user = null;
      }
    },
  },
});

export const {
  loadSession,
  login,
  logout,
  setProfile,
  setLoading,
  setError,
  clearError,
  setVerificationId,
  updatePushToken,
  updateUserProfile,
} = authSlice.actions;

export default authSlice.reducer;