import Constants from 'expo-constants';

// ==================== INTERFACES TYPESCRIPT ====================
interface AppConfiguration {
  readonly app_name: string;
  readonly app_description: string;
  readonly app_display_name: string;
  readonly icon_app: string;
  readonly app_identifier: string;
  readonly app_identifier_ios: string;
  readonly ios_app_version: string;
  readonly runtime_Version: string;
  readonly android_app_version: number;
  readonly expo_owner: string;
  readonly expo_slug: string;
  readonly expo_project_id: string;
}

interface SupabaseConfiguration {
  readonly url: string;
  readonly anonKey: string;
  readonly serviceRoleKey: string;
  readonly jwtSecret: string;
}

interface StorageConfiguration {
  readonly USER_PROFILES: string;
  readonly USER_DOCUMENTS: string;
  readonly CAR_IMAGES: string;
  readonly BOOKING_MEDIA: string;
}

interface GoogleMapsConfiguration {
  readonly development: string;
  readonly production: string;
}

// ==================== VALIDACIÓN DE VARIABLES DE ENTORNO ====================
const validateEnvVars = (): void => {
  const requiredVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'APP_NAME',
    'EXPO_PROJECT_ID'
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(
      `Variables de entorno requeridas faltantes: ${missingVars.join(', ')}\n` +
      `Por favor verifica tu archivo .env`
    );
  }
};

// Ejecutar validación al cargar el módulo
if (process.env.NODE_ENV !== 'test') {
  validateEnvVars();
}

// ==================== CONFIGURACIÓN T+PLUS SEGURA ====================
export const AppConfig: AppConfiguration = {
  app_name: process.env.APP_NAME!,
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
  expo_owner: process.env.EXPO_OWNER || 'tmasplus_cto',
  expo_slug: process.env.EXPO_SLUG || 'treasapp',
  expo_project_id: process.env.EXPO_PROJECT_ID!
} as const;

// ==================== CONFIGURACIÓN SUPABASE SEGURA ====================
export const SupabaseConfig: SupabaseConfiguration = {
  url: process.env.SUPABASE_URL!,
  anonKey: process.env.SUPABASE_ANON_KEY!,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  jwtSecret: process.env.JWT_SECRET || ''
} as const;

// ==================== CONFIGURACIÓN GOOGLE MAPS SEGURA ====================
const GoogleMapsConfig: GoogleMapsConfiguration = {
  development: process.env.GOOGLE_MAPS_API_KEY_DEV || process.env.GOOGLE_MAPS_API_KEY_ANDROID || '',
  production: process.env.GOOGLE_MAPS_API_KEY_PROD || process.env.GOOGLE_MAPS_API_KEY_IOS || ''
} as const;

export const getGoogleMapsApiKey = (): string => {
  const isDev = process.env.NODE_ENV === 'development';
  const key = isDev ? GoogleMapsConfig.development : GoogleMapsConfig.production;
  
  if (!key) {
    console.warn('Google Maps API Key no configurada para entorno:', process.env.NODE_ENV);
  }
  
  return key;
};

// Mantener compatibilidad con código existente
export const API_KEY = getGoogleMapsApiKey();

// ==================== CONFIGURACIÓN DE STORAGE BUCKETS ====================
export const StorageBuckets: StorageConfiguration = {
  USER_PROFILES: 'user-profiles',    // Fotos de perfil (público)
  USER_DOCUMENTS: 'user-documents',  // Documentos privados (licencias, cédulas)
  CAR_IMAGES: 'car-images',          // Fotos de vehículos (público)
  BOOKING_MEDIA: 'booking-media'     // Media de viajes (privado)
} as const;

// ==================== SISTEMA DE VALIDACIÓN AVANZADO ====================
export const validateConfiguration = (): { 
  isValid: boolean; 
  errors: string[]; 
  warnings: string[];
  summary: string;
} => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Validaciones críticas de Supabase
  if (!SupabaseConfig.url || !SupabaseConfig.url.includes('supabase.co')) {
    errors.push('SUPABASE_URL inválida - debe contener supabase.co');
  }
  
  if (!SupabaseConfig.anonKey || SupabaseConfig.anonKey.length < 100) {
    errors.push('SUPABASE_ANON_KEY inválida - debe ser un JWT válido');
  }
  
  if (!AppConfig.expo_project_id || !AppConfig.expo_project_id.match(/^[a-f0-9\-]{36}$/)) {
    errors.push('EXPO_PROJECT_ID inválido - debe ser un UUID válido');
  }
  
  // Validaciones de seguridad
  if (SupabaseConfig.serviceRoleKey && process.env.NODE_ENV === 'production') {
    warnings.push('Service Role Key presente en producción - usar con precaución');
  }
  
  // Validaciones de Google Maps
  if (!getGoogleMapsApiKey()) {
    warnings.push('Google Maps API Key no configurada - funciones de mapas limitadas');
  }
  
  // Validaciones de configuración de app
  if (!AppConfig.app_identifier.includes('tmasplus')) {
    warnings.push('Bundle ID no coincide con el dominio de T+Plus');
  }
  
  const isValid = errors.length === 0;
  const summary = isValid 
    ? `Configuración válida (${warnings.length} advertencias)`
    : `${errors.length} errores críticos, ${warnings.length} advertencias`;
  
  return { isValid, errors, warnings, summary };
};

// ==================== UTILIDADES DE ENTORNO ====================
export const Environment = {
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
  
  // Helper para logs seguros
  logConfig: () => {
    if (Environment.isDevelopment) {
      console.log('T+Plus Configuration:', {
        appName: AppConfig.app_name,
        version: AppConfig.ios_app_version,
        bundleId: AppConfig.app_identifier,
        supabaseUrl: SupabaseConfig.url,
        expoProjectId: AppConfig.expo_project_id,
        environment: process.env.NODE_ENV
      });
      
      const validation = validateConfiguration();
      console.log('Config Validation:', validation.summary);
      
      if (validation.warnings.length > 0) {
        console.warn('Advertencias:', validation.warnings);
      }
      if (validation.errors.length > 0) {
        console.error('Errores:', validation.errors);
      }
    }
  }
} as const;

// Ejecutar log de configuración en desarrollo
Environment.logConfig();

// ==================== EXPORTS PRINCIPALES ====================
export default {
  AppConfig,
  SupabaseConfig,
  StorageBuckets,
  GoogleMapsConfig,
  API_KEY,
  getGoogleMapsApiKey,
  validateConfiguration,
  Environment
} as const;

// ==================== TIPOS PARA TYPESCRIPT ====================
export type { 
  AppConfiguration, 
  SupabaseConfiguration, 
  StorageConfiguration,
  GoogleMapsConfiguration 
};
