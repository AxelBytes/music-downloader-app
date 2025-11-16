import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

type SavedUserData = {
  username: string;
  activationKey: string;
  isSaved: boolean;
  savedAt: string;
};

type UserDataContextType = {
  savedUserData: SavedUserData | null;
  saveUserData: (username: string, activationKey: string) => Promise<void>;
  loadUserData: () => Promise<void>;
  clearUserData: () => Promise<void>;
  hasSavedData: boolean;
};

const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

export function UserDataProvider({ children }: { children: React.ReactNode }) {
  const [savedUserData, setSavedUserData] = useState<SavedUserData | null>(null);
  const [hasSavedData, setHasSavedData] = useState(false);

  // Cargar datos guardados al iniciar
  useEffect(() => {
    loadUserData();
  }, []);

  const saveUserData = async (username: string, activationKey: string) => {
    try {
      const userData: SavedUserData = {
        username,
        activationKey,
        isSaved: true,
        savedAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem('saved_user_data', JSON.stringify(userData));
      setSavedUserData(userData);
      setHasSavedData(true);
      
      console.log('💾 [UserData] Información de usuario guardada:', { username, activationKey: activationKey.substring(0, 10) + '...' });
      
      Alert.alert(
        '✅ Información Guardada',
        `Los datos de ${username} han sido guardados exitosamente.`,
        [{ text: 'Perfecto', style: 'default' }]
      );
    } catch (error) {
      console.error('❌ [UserData] Error guardando datos:', error);
      Alert.alert(
        '❌ Error',
        'No se pudieron guardar los datos. Intenta nuevamente.',
        [{ text: 'Entendido', style: 'default' }]
      );
    }
  };

  const loadUserData = async () => {
    try {
      const savedData = await AsyncStorage.getItem('saved_user_data');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setSavedUserData(parsedData);
        setHasSavedData(true);
        
        console.log('📂 [UserData] Datos cargados:', { 
          username: parsedData.username, 
          activationKey: parsedData.activationKey.substring(0, 10) + '...',
          savedAt: parsedData.savedAt 
        });
      }
    } catch (error) {
      console.error('❌ [UserData] Error cargando datos:', error);
      setSavedUserData(null);
      setHasSavedData(false);
    }
  };

  const clearUserData = async () => {
    try {
      await AsyncStorage.removeItem('saved_user_data');
      setSavedUserData(null);
      setHasSavedData(false);
      
      console.log('🗑️ [UserData] Datos eliminados');
      
      Alert.alert(
        '🗑️ Datos Eliminados',
        'La información guardada ha sido eliminada exitosamente.',
        [{ text: 'Entendido', style: 'default' }]
      );
    } catch (error) {
      console.error('❌ [UserData] Error eliminando datos:', error);
      Alert.alert(
        '❌ Error',
        'No se pudieron eliminar los datos.',
        [{ text: 'Entendido', style: 'default' }]
      );
    }
  };

  return (
    <UserDataContext.Provider value={{
      savedUserData,
      saveUserData,
      loadUserData,
      clearUserData,
      hasSavedData,
    }}>
      {children}
    </UserDataContext.Provider>
  );
}

export function useUserData() {
  const context = useContext(UserDataContext);
  if (!context) {
    throw new Error('useUserData must be used within a UserDataProvider');
  }
  return context;
}
