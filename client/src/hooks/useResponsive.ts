import { useMediaQuery, useTheme } from '@mui/material';

export const useResponsive = () => {
  const theme = useTheme();
  
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('xl'));

  // Specific breakpoint checks
  const isXs = useMediaQuery(theme.breakpoints.only('xs'));
  const isSm = useMediaQuery(theme.breakpoints.only('sm'));
  const isMd = useMediaQuery(theme.breakpoints.only('md'));
  const isLg = useMediaQuery(theme.breakpoints.only('lg'));
  const isXl = useMediaQuery(theme.breakpoints.only('xl'));

  // Utility functions
  const getResponsiveValue = <T>(values: {
    xs?: T;
    sm?: T;
    md?: T;
    lg?: T;
    xl?: T;
    mobile?: T;
    tablet?: T;
    desktop?: T;
  }): T | undefined => {
    if (values.mobile && isMobile) return values.mobile;
    if (values.tablet && isTablet) return values.tablet;
    if (values.desktop && isDesktop) return values.desktop;
    
    if (values.xs && isXs) return values.xs;
    if (values.sm && isSm) return values.sm;
    if (values.md && isMd) return values.md;
    if (values.lg && isLg) return values.lg;
    if (values.xl && isXl) return values.xl;
    
    return undefined;
  };

  const getSpacing = (mobile: number, desktop?: number) => {
    return isMobile ? mobile : (desktop ?? mobile * 1.5);
  };

  const getFontSize = (mobile: string, desktop?: string) => {
    return isMobile ? mobile : (desktop ?? mobile);
  };

  return {
    // Breakpoint booleans
    isMobile,
    isTablet,
    isDesktop,
    isSmallScreen,
    isLargeScreen,
    isXs,
    isSm,
    isMd,
    isLg,
    isXl,
    
    // Utility functions
    getResponsiveValue,
    getSpacing,
    getFontSize,
    
    // Current breakpoint name
    currentBreakpoint: isXs ? 'xs' : isSm ? 'sm' : isMd ? 'md' : isLg ? 'lg' : 'xl',
  };
};