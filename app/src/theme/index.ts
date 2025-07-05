export const theme = {
  colors: {
    // Aspect Health брендовые цвета
    primary: '#FF6B9D', // Розовый из градиента
    primaryDark: '#C44569', // Темно-розовый из градиента
    secondary: '#2ECC71', // Зеленый для акцентов
    success: '#2ECC71',
    error: '#E74C3C',
    warning: '#F39C12',
    background: '#F5F6FA', // Светло-серый фон
    surface: '#FFFFFF', // Белый для карточек
    border: '#E8E9EA', // Очень светло-серый для границ
    text: {
      primary: '#2C3E50', // Темно-серый для основного текста
      secondary: '#7F8C8D', // Средне-серый для вторичного текста
      placeholder: '#BDC3C7', // Светло-серый для placeholder
      disabled: '#D1D5DB',
      white: '#FFFFFF', // Белый текст
    },
    // Дополнительные цвета для Aspect Health стиля
    gradientStart: '#FF6B9D',
    gradientEnd: '#C44569',
    cardShadow: '#000000',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  typography: {
    fontFamily: 'System',
    fontSize: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
      xxxl: 32,
    },
    fontWeight: {
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      loose: 1.8,
    },
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    full: 9999,
  },
  shadow: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 8,
    },
  },
};