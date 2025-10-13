import { supabase } from './supabase';

export interface ActivationKey {
  id: string;
  key: string;
  is_used: boolean;
  user_id: string | null;
  created_at: string;
}

export class ActivationKeyManager {
  /**
   * Generar una nueva key de activación
   */
  static async generateKey(): Promise<string> {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `GROOVIFY-${new Date().getFullYear()}-${random}`;
  }

  /**
   * Crear múltiples keys de activación
   */
  static async createKeys(count: number): Promise<ActivationKey[]> {
    try {
      const keys = await Promise.all(
        Array.from({ length: count }, async () => ({
          key: await this.generateKey(),
          is_used: false,
          user_id: null,
          created_at: new Date().toISOString()
        }))
      );

      const { data, error } = await supabase
        .from('activation_keys')
        .insert(keys)
        .select();

      if (error) {
        throw new Error(`Error creando keys: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error creando keys de activación:', error);
      throw error;
    }
  }

  /**
   * Validar una key de activación
   */
  static async validateKey(key: string): Promise<{ isValid: boolean; key?: ActivationKey; error?: string }> {
    try {
      console.log('🔐 [ActivationKeyManager] ===== VALIDANDO KEY =====');
      console.log('🔐 [ActivationKeyManager] Key recibida:', key);
      console.log('🔐 [ActivationKeyManager] Tipo de key:', typeof key);
      console.log('🔐 [ActivationKeyManager] Longitud de key:', key.length);
      console.log('🔐 [ActivationKeyManager] Key exacta:', JSON.stringify(key));
      
      console.log('🔐 [ActivationKeyManager] Conectando a Supabase...');
      // console.log('🔐 [ActivationKeyManager] URL de Supabase:', supabase.supabaseUrl); // Propiedad protegida
      
      // Test de conexión básico
      console.log('🔐 [ActivationKeyManager] Probando conexión...');
      const { data: testData, error: testError } = await supabase
        .from('activation_keys')
        .select('count(*)')
        .limit(1);
      
      console.log('🔐 [ActivationKeyManager] Test de conexión:', { testData, testError });
      
      console.log('🔐 [ActivationKeyManager] Buscando key específica:', key);
      console.log('🔐 [ActivationKeyManager] Query: SELECT * FROM activation_keys WHERE key =', key);
      
      const { data, error } = await supabase
        .from('activation_keys')
        .select('*')
        .eq('key', key)
        .limit(1);

      console.log('🔐 [ActivationKeyManager] ===== RESPUESTA DE SUPABASE =====');
      console.log('🔐 [ActivationKeyManager] Data:', data);
      console.log('🔐 [ActivationKeyManager] Error:', error);
      console.log('🔐 [ActivationKeyManager] Tipo de data:', typeof data);
      console.log('🔐 [ActivationKeyManager] Data es null?:', data === null);
      console.log('🔐 [ActivationKeyManager] Data es undefined?:', data === undefined);

      if (error) {
        console.error('🔐 [ActivationKeyManager] ===== ERROR EN VALIDACIÓN =====');
        console.error('🔐 [ActivationKeyManager] Código de error:', error.code);
        console.error('🔐 [ActivationKeyManager] Mensaje:', error.message);
        console.error('🔐 [ActivationKeyManager] Detalles:', error.details);
        console.error('🔐 [ActivationKeyManager] Hint:', error.hint);
        
        return { isValid: false, error: `Error de Supabase: ${error.message}` };
      }

      // data ahora es un array, tomar el primer elemento
      const keyData = Array.isArray(data) ? data[0] : data;
      
      if (!keyData) {
        console.log('🔐 [ActivationKeyManager] ===== KEY NO ENCONTRADA =====');
        console.log('🔐 [ActivationKeyManager] No se encontró la key');
        
        // Buscar todas las keys para debug
        console.log('🔐 [ActivationKeyManager] Buscando TODAS las keys para debug...');
        const { data: allKeys, error: allKeysError } = await supabase
          .from('activation_keys')
          .select('*');
        
        console.log('🔐 [ActivationKeyManager] Todas las keys:', allKeys);
        console.log('🔐 [ActivationKeyManager] Error en búsqueda de todas las keys:', allKeysError);
        
        return { isValid: false, error: 'Key de activación no encontrada' };
      }

      if (keyData.is_used) {
        console.log('🔐 [ActivationKeyManager] ===== KEY YA USADA =====');
        console.log('🔐 [ActivationKeyManager] Key encontrada pero ya está usada:', keyData);
        return { isValid: false, error: 'Key de activación ya ha sido utilizada' };
      }

      console.log('🔐 [ActivationKeyManager] ===== KEY VÁLIDA ENCONTRADA =====');
      console.log('🔐 [ActivationKeyManager] Key válida:', keyData);
      return { isValid: true, key: keyData };
    } catch (error) {
      console.error('🔐 [ActivationKeyManager] ===== ERROR EXCEPCIÓN =====');
      console.error('🔐 [ActivationKeyManager] Error completo:', error);
      console.error('🔐 [ActivationKeyManager] Stack trace:', (error as Error).stack);
      return { isValid: false, error: `Error al validar la key: ${(error as Error).message}` };
    }
  }

  /**
   * Marcar key como usada
   */
  static async markKeyAsUsed(key: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('activation_keys')
        .update({ is_used: true, user_id: userId })
        .eq('key', key);

      if (error) {
        console.error('Error marcando key como usada:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error marcando key como usada:', error);
      return false;
    }
  }

  /**
   * Obtener todas las keys (para administración)
   */
  static async getAllKeys(): Promise<ActivationKey[]> {
    try {
      const { data, error } = await supabase
        .from('activation_keys')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Error obteniendo keys: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error obteniendo keys:', error);
      throw error;
    }
  }

  /**
   * Obtener keys disponibles
   */
  static async getAvailableKeys(): Promise<ActivationKey[]> {
    try {
      const { data, error } = await supabase
        .from('activation_keys')
        .select('*')
        .eq('is_used', false)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Error obteniendo keys disponibles: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error obteniendo keys disponibles:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de keys
   */
  static async getKeyStats(): Promise<{ total: number; used: number; available: number }> {
    try {
      const { data: allKeys, error: allError } = await supabase
        .from('activation_keys')
        .select('is_used');

      if (allError) {
        throw new Error(`Error obteniendo estadísticas: ${allError.message}`);
      }

      const total = allKeys?.length || 0;
      const used = allKeys?.filter(key => key.is_used).length || 0;
      const available = total - used;

      return { total, used, available };
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      throw error;
    }
  }
}
