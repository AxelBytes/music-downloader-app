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
      const { data, error } = await supabase
        .from('activation_keys')
        .select('*')
        .eq('key', key)
        .single();

      if (error) {
        return { isValid: false, error: 'Key de activación no encontrada' };
      }

      if (data.is_used) {
        return { isValid: false, error: 'Key de activación ya ha sido utilizada' };
      }

      return { isValid: true, key: data };
    } catch (error) {
      return { isValid: false, error: 'Error validando key de activación' };
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
