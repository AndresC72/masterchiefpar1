import supabase from '@/config/SupabaseConfig';

const QUERY_TIMEOUT = 5000; // 5 segundos timeout para evitar cuelgues

/**
 * Servicio de validación contra Supabase
 * Verifica existencia de email y teléfono en BD
 */
export const ValidationService = {
  /**
   * Verifica si un email ya existe en la BD
   * @param email - Email a verificar
   * @returns { exists: boolean, error?: string }
   */
  async checkEmailExists(email: string): Promise<{ exists: boolean; error?: string }> {
    const trimmedEmail = email.toLowerCase().trim();
    const startTime = Date.now();
    
    console.log('🔍 [ValidationService] Verificando email:', trimmedEmail);
    
    try {
      // Buscar en tabla 'users' con timeout usando Promise.race
      const queryPromise = supabase
        .from('users')
        .select('email', { count: 'exact' })
        .ilike('email', trimmedEmail);
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout')), QUERY_TIMEOUT)
      );
      
      const { data: usersData, error: usersError, count } = await Promise.race([
        queryPromise,
        timeoutPromise
      ]) as any;
      
      const duration = Date.now() - startTime;
      
      if (usersError) {
        console.warn('⚠️ [ValidationService] Error en búsqueda users:', usersError?.message);
      }
      
      if (count && count > 0) {
        console.log(`✅ [ValidationService] Email existe en BD (${duration}ms)`);
        return { exists: true };
      }
      
      // Intentar búsqueda en auth.users usando RPC si existe
      try {
        const rpcQueryPromise = supabase.rpc('check_email_exists', {
          check_email: trimmedEmail,
        } as any);
        
        const rpcTimeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('RPC timeout')), QUERY_TIMEOUT)
        );
        
        const { data: rpcData, error: rpcError } = await Promise.race([
          rpcQueryPromise,
          rpcTimeoutPromise
        ]) as any;
        
        if (rpcData === true) {
          console.log(`✅ [ValidationService] Email existe en auth.users (${Date.now() - startTime}ms)`);
          return { exists: true };
        }
      } catch (rpcError: any) {
        console.warn('⚠️ [ValidationService] RPC check_email_exists no disponible:', rpcError?.message);
      }
      
      console.log(`✓ [ValidationService] Email disponible (${duration}ms)`);
      return { exists: false };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error(`❌ [ValidationService] Error verificando email (${duration}ms):`, error?.message);
      return { 
        exists: false, 
        error: error?.message || 'Error checking email' 
      };
    }
  },

  /**
   * Verifica si un teléfono ya existe en la BD
   * @param phone - Teléfono solo números (3133752565)
   * @param countryCode - Código país (+57, +1, etc)
   * @returns { exists: boolean, error?: string }
   */
  async checkPhoneExists(
    phone: string, 
    countryCode: string = '+57'
  ): Promise<{ exists: boolean; error?: string }> {
    const startTime = Date.now();
    
    try {
      const fullPhone = `${countryCode}${phone}`;  // +573133752565
      const mobileOnly = phone;                    // 3133752565
      
      console.log('📱 [ValidationService] Verificando teléfono:', { fullPhone, mobileOnly });
      
      const queryPromise = supabase
        .from('users')
        .select('mobile', { count: 'exact' })
        .in('mobile', [fullPhone, mobileOnly]);
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout')), QUERY_TIMEOUT)
      );
      
      const { data, error, count } = await Promise.race([
        queryPromise,
        timeoutPromise
      ]) as any;
      
      const duration = Date.now() - startTime;
      
      if (error) {
        console.error(`❌ [ValidationService] Error verificando teléfono (${duration}ms):`, error.message);
        return { 
          exists: false, 
          error: error.message 
        };
      }
      
      const exists = (count ?? 0) > 0;
      
      if (exists) {
        console.log(`✅ [ValidationService] Teléfono existe en BD (${duration}ms)`);
      } else {
        console.log(`✓ [ValidationService] Teléfono disponible (${duration}ms)`);
      }
      
      return { exists };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error(`❌ [ValidationService] Error verificando teléfono (${duration}ms):`, error?.message);
      return { 
        exists: false, 
        error: error?.message || 'Error checking phone' 
      };
    }
  },
};
