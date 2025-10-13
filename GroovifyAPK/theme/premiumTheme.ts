import { Theme } from '@rneui/themed';

export const premiumTheme: Theme = {
  lightColors: {
    primary: '#8b5cf6',
    secondary: '#06b6d4',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    background: '#ffffff',
    surface: '#f8fafc',
    card: '#ffffff',
    text: '#1e293b',
    border: '#e2e8f0',
    notification: '#8b5cf6',
    disabled: '#94a3b8',
    placeholder: '#64748b',
    backdrop: 'rgba(0, 0, 0, 0.5)',
  },
  darkColors: {
    primary: '#8b5cf6',
    secondary: '#06b6d4',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    background: '#0a0a0a',
    surface: '#1a1a1a',
    card: '#1e1e1e',
    text: '#ffffff',
    border: '#2a2a2a',
    notification: '#8b5cf6',
    disabled: '#6b7280',
    placeholder: '#9ca3af',
    backdrop: 'rgba(0, 0, 0, 0.8)',
  },
  mode: 'dark',
  components: {
    Button: {
      buttonStyle: {
        borderRadius: 16,
        paddingVertical: 14,
        paddingHorizontal: 24,
        shadowColor: '#8b5cf6',
        shadowOffset: {
          width: 0,
          height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
      },
      titleStyle: {
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: 0.5,
      },
    },
    Card: {
      containerStyle: {
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.2)',
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 8,
        },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 12,
        backdropFilter: 'blur(10px)',
      },
    },
    Input: {
      containerStyle: {
        paddingHorizontal: 0,
        marginBottom: 16,
      },
      inputContainerStyle: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.3)',
        paddingHorizontal: 16,
        paddingVertical: 12,
      },
      inputStyle: {
        color: '#ffffff',
        fontSize: 16,
      },
      labelStyle: {
        color: '#8b5cf6',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
      },
    },
    ListItem: {
      containerStyle: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        marginHorizontal: 16,
        marginVertical: 6,
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.1)',
      },
    },
    Icon: {
      size: 24,
      color: '#8b5cf6',
    },
  },
};

// Colores premium adicionales para efectos especiales
export const premiumColors = {
  gradients: {
    primary: ['#8b5cf6', '#06b6d4'],
    secondary: ['#1a0033', '#000000'],
    card: ['rgba(139, 92, 246, 0.1)', 'rgba(6, 182, 212, 0.1)'],
    glass: ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)'],
  },
  effects: {
    glow: {
      primary: 'rgba(139, 92, 246, 0.4)',
      secondary: 'rgba(6, 182, 212, 0.4)',
    },
    blur: {
      light: 'rgba(255, 255, 255, 0.1)',
      medium: 'rgba(255, 255, 255, 0.05)',
      dark: 'rgba(0, 0, 0, 0.3)',
    },
  },
};
