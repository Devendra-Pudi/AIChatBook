import type { Theme } from '@mui/material/styles';

// Theme utility functions
export const getThemeColor = (theme: Theme, color: string, shade?: number) => {
  const colorMap: Record<string, any> = {
    primary: theme.palette.primary,
    secondary: theme.palette.secondary,
    error: theme.palette.error,
    warning: theme.palette.warning,
    info: theme.palette.info,
    success: theme.palette.success,
  };

  const colorPalette = colorMap[color];
  if (!colorPalette) return color;

  if (shade) {
    return colorPalette[shade] || colorPalette.main;
  }

  return colorPalette.main;
};

export const getResponsiveSpacing = (theme: Theme, mobile: number, desktop?: number) => {
  return {
    [theme.breakpoints.down('md')]: theme.spacing(mobile),
    [theme.breakpoints.up('md')]: theme.spacing(desktop || mobile * 1.5),
  };
};

export const getResponsiveFontSize = (mobile: string, desktop?: string) => {
  return {
    '@media (max-width: 768px)': {
      fontSize: mobile,
    },
    '@media (min-width: 769px)': {
      fontSize: desktop || mobile,
    },
  };
};

export const createGradient = (colors: string[], direction = '135deg') => {
  return `linear-gradient(${direction}, ${colors.join(', ')})`;
};

export const createBoxShadow = (
  theme: Theme,
  elevation: number = 1,
  color?: string
) => {
  const shadowColor = color || (theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.1)');
  const shadows = [
    'none',
    `0 1px 3px ${shadowColor}`,
    `0 2px 6px ${shadowColor}`,
    `0 4px 12px ${shadowColor}`,
    `0 8px 24px ${shadowColor}`,
    `0 16px 48px ${shadowColor}`,
  ];
  
  return shadows[elevation] || shadows[1];
};

export const createHoverEffect = (theme: Theme, scale = 1.02, shadow = 2) => ({
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    transform: `scale(${scale})`,
    boxShadow: createBoxShadow(theme, shadow),
  },
});

export const createFocusEffect = (theme: Theme, color?: string) => ({
  '&:focus-visible': {
    outline: `2px solid ${color || theme.palette.primary.main}`,
    outlineOffset: '2px',
  },
});

// Animation utilities
export const fadeIn = {
  '@keyframes fadeIn': {
    from: { opacity: 0 },
    to: { opacity: 1 },
  },
  animation: 'fadeIn 0.3s ease-in-out',
};

export const slideUp = {
  '@keyframes slideUp': {
    from: { transform: 'translateY(20px)', opacity: 0 },
    to: { transform: 'translateY(0)', opacity: 1 },
  },
  animation: 'slideUp 0.3s ease-out',
};

export const pulse = {
  '@keyframes pulse': {
    '0%': { transform: 'scale(1)' },
    '50%': { transform: 'scale(1.05)' },
    '100%': { transform: 'scale(1)' },
  },
  animation: 'pulse 2s infinite',
};

// Responsive breakpoint utilities
export const breakpoints = {
  xs: '@media (max-width: 599px)',
  sm: '@media (min-width: 600px) and (max-width: 899px)',
  md: '@media (min-width: 900px) and (max-width: 1199px)',
  lg: '@media (min-width: 1200px) and (max-width: 1535px)',
  xl: '@media (min-width: 1536px)',
  mobile: '@media (max-width: 899px)',
  tablet: '@media (min-width: 900px) and (max-width: 1199px)',
  desktop: '@media (min-width: 1200px)',
};