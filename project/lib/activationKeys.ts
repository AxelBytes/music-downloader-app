// Migrado a backend propio (FastAPI + Neon)
const API_URL = 'http://192.168.100.112:8000';
// Nota: mantenemos tipos; las funciones ahora llaman al backend.

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

      const res = await fetch(`${API_URL}/admin/create-keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count })
      });
      if (!res.ok) throw new Error(`Error creando keys: HTTP ${res.status}`);
      return await res.json();
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
      const res = await fetch(`${API_URL}/auth/validate-key?key=${encodeURIComponent(key)}`, { method: 'POST' });
      if (!res.ok) return { isValid: false, error: `HTTP ${res.status}` };
      return await res.json();
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
      // No necesario si /auth/sign-up marca la key como usada.
      const res = await fetch(`${API_URL}/admin/mark-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, userId })
      });
      return res.ok;
    } catch (_e) {
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
