// This is a wrapper around AppConfig.ts to make it accessible to app.config.js
// Since app.config.js is executed by Node.js before transpilation, we need a JS version

// Check if environment variables are set
const requiredVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'APP_NAME', 'EXPO_PROJECT_ID'];
const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0 && process.env.NODE_ENV !== 'test') {
  console.error(
    `Variables de entorno requeridas faltantes: ${missingVars.join(', ')}\n` +
    `Por favor verifica tu archivo .env`
  );
}

// ==================== CONFIGURACIÓN T+PLUS SEGURA ====================
const AppConfig = {
  app_name: process.env.APP_NAME || 'TmasPlus',
  app_description: process.env.APP_DESCRIPTION || 'Sistema de transporte urbano inteligente T+Plus',
  app_display_name: process.env.APP_DISPLAY_NAME || 'TmasPlus',
  icon_app: './assets/images/logo-Preview.png',
  
  // Identificadores de aplicación
  app_identifier: process.env.APP_IDENTIFIER || 'com.tmasplus.tmasplus',
  app_identifier_ios: process.env.APP_IDENTIFIER_IOS || 'tmasplus.tmasplus',
  
  // Control de versiones
  ios_app_version: process.env.APP_VERSION || '1.10.3',
  runtime_Version: process.env.EXPO_RUNTIME_VERSION || '1.0.4',
  android_app_version: parseInt(process.env.ANDROID_APP_VERSION || '1', 10),
  
  // Configuración Expo
  expo_owner: process.env.EXPO_OWNER || 'tmasplus',
  expo_slug: process.env.EXPO_SLUG || 'tmasplus',
  expo_project_id: process.env.EXPO_PROJECT_ID || ''
};

// ==================== CONFIGURACIÓN SUPABASE SEGURA ====================
/* const SupabaseConfig = {
  url: process.env.SUPABASE_URL || '',
  anonKey: process.env.SUPABASE_ANON_KEY || '', 
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  jwtSecret: process.env.JWT_SECRET || ''
};  */
/* const SupabaseConfig = {
  url: process.env.SUPABASE_URL || 'https://utofhxgzkdhljrixperh.supabase.co',
  anonKey: process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0b2ZoeGd6a2RobGpyaXhwZXJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMzAzNTcsImV4cCI6MjA3MjYwNjM1N30.m3I2UMBCDz8b3TwChMpws53B3FtvhCL9nydaYbOydew', 
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  jwtSecret: process.env.JWT_SECRET || ''
}; */  
const SupabaseConfig = {
  url: '',
  anonKey: '',
  serviceRoleKey: '',
  jwtSecret: '',
};



// ==================== CONFIGURACIÓN GOOGLE MAPS SEGURA ====================
const GoogleMapsConfig = {
  development: process.env.GOOGLE_MAPS_API_KEY_DEV || process.env.GOOGLE_MAPS_API_KEY_ANDROID || '',
  production: process.env.GOOGLE_MAPS_API_KEY_PROD || process.env.GOOGLE_MAPS_API_KEY_IOS || ''
};

const getGoogleMapsApiKey = () => {
  const isDev = process.env.NODE_ENV === 'development';
  const key = isDev ? GoogleMapsConfig.development : GoogleMapsConfig.production;
  
  if (!key) {
    console.warn('Google Maps API Key no configurada para entorno:', process.env.NODE_ENV);
  }
  
  return key;
};

// Mantener compatibilidad con código existente
const API_KEY = getGoogleMapsApiKey();

// ==================== CONFIGURACIÓN DE STORAGE BUCKETS ====================
const StorageBuckets = {
  USER_PROFILES: 'user-profiles',
  USER_DOCUMENTS: 'user-documents',
  CAR_IMAGES: 'car-images',
  BOOKING_MEDIA: 'booking-media'
};

module.exports = {
  AppConfig,
  SupabaseConfig,
  StorageBuckets,
  GoogleMapsConfig,
  API_KEY,
  getGoogleMapsApiKey
};
