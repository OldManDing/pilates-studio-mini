// Brand Colors
export const Colors = {
  // Primary
  mint: '#43c7ab',
  mintLight: '#e6f7f4',
  mintDark: '#35a090',

  violet: '#8b7cff',
  violetLight: '#f0eeff',
  violetDark: '#6b5fd9',

  // Accent
  orange: '#ffb760',
  orangeLight: '#fff4e6',
  orangeDark: '#e09a4a',

  pink: '#ff8da8',
  pinkLight: '#ffeef2',
  pinkDark: '#e0708f',

  // Functional
  success: '#43c7ab',
  warning: '#ffb760',
  error: '#ff4d4f',
  info: '#8b7cff',

  // Neutral
  white: '#ffffff',
  black: '#000000',

  gray: {
    100: '#f7f9fc',
    200: '#eef1f7',
    300: '#e2e8f0',
    400: '#cbd5e0',
    500: '#a0aec0',
    600: '#6f8198',
    700: '#4a5568',
    800: '#2d3748',
    900: '#1a202c',
  },
} as const;

// Color maps for course types, levels, etc.
export const CourseTypeColors: Record<string, string> = {
  'MAT': Colors.mint,
  'REFORMER': Colors.violet,
  'CADILLAC': Colors.orange,
  'CHAIR': Colors.pink,
  'BARREL': Colors.info,
  'PRIVATE': Colors.warning,
};

export const LevelColors: Record<string, string> = {
  'BEGINNER': Colors.mint,
  'INTERMEDIATE': Colors.orange,
  'ADVANCED': Colors.pink,
  'ALL_LEVELS': Colors.violet,
};

export const BookingStatusColors: Record<string, string> = {
  'PENDING': Colors.orange,
  'CONFIRMED': Colors.mint,
  'COMPLETED': Colors.violet,
  'CANCELLED': Colors.gray[400],
  'NO_SHOW': Colors.error,
};

export const TransactionStatusColors: Record<string, string> = {
  'PENDING': Colors.orange,
  'COMPLETED': Colors.mint,
  'FAILED': Colors.error,
  'REFUNDED': Colors.gray[400],
};
