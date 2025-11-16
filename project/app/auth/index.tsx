import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useUserData } from '@/contexts/UserDataContext';
import { usePremiumNotification } from '@/contexts/PremiumNotificationContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Music, Check } from 'lucide-react-native';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [activationKey, setActivationKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saveUserData, setSaveUserData] = useState(false);

  // DEBUG: Confirmar que estamos en la pantalla de auth
  console.log('🔐 [AuthScreen] PANTALLA DE LOGIN CARGADA CORRECTAMENTE');

  // Cargar datos guardados al montar el componente
  const { signIn, signUp, validateActivationKey } = useAuth();
  const { saveUserData: saveUserDataToStorage, savedUserData, loadUserData, hasSavedData } = useUserData();

  React.useEffect(() => {
    if (hasSavedData && savedUserData) {
      setUsername(savedUserData.username);
      setActivationKey(savedUserData.activationKey);
      console.log('💾 [AuthScreen] Datos cargados automáticamente');
    }
  }, [hasSavedData, savedUserData]);
  const { showNotification } = usePremiumNotification();

  const handleAuth = async () => {
    console.log('🔐 [AuthScreen] ===== INICIANDO AUTENTICACIÓN =====');
    console.log('🔐 [AuthScreen] Modo:', isLogin ? 'LOGIN' : 'REGISTRO');
    console.log('🔐 [AuthScreen] Activation Key:', activationKey);
    console.log('🔐 [AuthScreen] Email:', email);
    console.log('🔐 [AuthScreen] Username:', username);
    
    if (isLogin) {
      if (!activationKey) {
        console.log('🔐 [AuthScreen] Error: No hay activation key');
        setError('Por favor ingresa tu key de activación');
        return;
      }
    } else {
      if (!email || !password || !username || !activationKey) {
        console.log('🔐 [AuthScreen] Error: Campos incompletos');
        setError('Por favor completa todos los campos');
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        console.log('🔐 [AuthScreen] Intentando LOGIN con key:', activationKey);
        const { error } = await signIn(activationKey);
        if (error) {
          console.error('🔐 [AuthScreen] Error en login:', error);
          setError(error.message || 'Key de activación inválida');
        } else {
          console.log('🔐 [AuthScreen] Login exitoso, redirigiendo...');
          
          // Guardar datos si el usuario lo solicitó
          if (saveUserData) {
            await saveUserDataToStorage(username, activationKey);
            showNotification({
              type: 'success',
              title: 'Datos Guardados',
              message: 'Tu información de login se ha guardado exitosamente',
              duration: 3000,
            });
          }
          
          router.replace('/(tabs)');
        }
      } else {
        console.log('🔐 [AuthScreen] Validando key antes de registro...');
        // Validar key antes de crear cuenta
        const keyValidation = await validateActivationKey(activationKey);
        console.log('🔐 [AuthScreen] Resultado de validación:', keyValidation);
        
        if (!keyValidation.isValid) {
          console.error('🔐 [AuthScreen] Key inválida:', keyValidation.error);
          setError(keyValidation.error || 'Key de activación inválida');
          setLoading(false);
          return;
        }

        console.log('🔐 [AuthScreen] Key válida, creando cuenta...');
        const { error } = await signUp(email, password, username, activationKey);
        if (error) {
          console.error('🔐 [AuthScreen] Error en registro:', error);
          setError(error.message || 'Error al crear cuenta');
        } else {
          console.log('🔐 [AuthScreen] Registro exitoso, redirigiendo...');
          
          // Guardar datos si el usuario lo solicitó
          if (saveUserData) {
            await saveUserDataToStorage(username, activationKey);
            showNotification({
              type: 'success',
              title: 'Cuenta Creada',
              message: 'Tu cuenta y datos se han guardado exitosamente',
              duration: 3000,
            });
          }
          
          router.replace('/(tabs)');
        }
      }
    } catch (err) {
      console.error('🔐 [AuthScreen] Error inesperado:', err);
      setError('Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#000000', '#1a0033', '#000000']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Music size={64} color="#8b5cf6" />
            <Text style={styles.title}>Groovify</Text>
            <Text style={styles.subtitle}>Tu música, tu estilo</Text>
          </View>

          <View style={styles.form}>
            {!isLogin && (
              <TextInput
                style={styles.input}
                placeholder="Nombre de usuario"
                placeholderTextColor="#666"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="words"
              />
            )}

            {!isLogin && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#666"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />

                <TextInput
                  style={styles.input}
                  placeholder="Contraseña"
                  placeholderTextColor="#666"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </>
            )}

            <TextInput
              style={styles.input}
              placeholder={isLogin ? "Key de activación" : "Key de activación"}
              placeholderTextColor="#666"
              value={activationKey}
              onChangeText={setActivationKey}
              autoCapitalize="none"
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* Checkbox para guardar información */}
            <TouchableOpacity 
              style={styles.checkboxContainer}
              onPress={() => setSaveUserData(!saveUserData)}
            >
              <View style={[styles.checkbox, saveUserData && styles.checkboxChecked]}>
                {saveUserData && <Check size={16} color="#fff" />}
              </View>
              <Text style={styles.checkboxText}>💾 Guardar información de login</Text>
            </TouchableOpacity>

            {/* Mostrar información guardada si existe */}
            {hasSavedData && savedUserData && (
              <View style={styles.savedDataContainer}>
                <Text style={styles.savedDataText}>
                  📂 Datos guardados: {savedUserData.username}
                </Text>
                <Text style={styles.savedDataSubtext}>
                  Key: {savedUserData.activationKey.substring(0, 10)}...
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.button}
              onPress={handleAuth}
              disabled={loading}
            >
              <LinearGradient
                colors={['#06b6d4', '#8b5cf6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'Cargando...' : isLogin ? 'Iniciar Sesión' : 'Activar Cuenta'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
            >
              <Text style={styles.switchText}>
                {isLogin ? '¿No tienes cuenta? Activar con key' : '¿Ya tienes cuenta? Inicia sesión'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
    marginTop: 8,
  },
  form: {
    width: '100%',
    maxWidth: 400,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    color: '#ffffff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  button: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  buttonGradient: {
    padding: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  switchButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  switchText: {
    color: '#06b6d4',
    fontSize: 14,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#8b5cf6',
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  checkboxChecked: {
    backgroundColor: '#8b5cf6',
  },
  checkboxText: {
    color: '#ffffff',
    fontSize: 14,
    flex: 1,
  },
  savedDataContainer: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  savedDataText: {
    color: '#8b5cf6',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  savedDataSubtext: {
    color: '#999',
    fontSize: 12,
  },
});
