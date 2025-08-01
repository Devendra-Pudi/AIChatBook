import React from 'react';
import { Box, useMediaQuery, useTheme } from '@mui/material';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  padding?: number | string;
  center?: boolean;
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  maxWidth = 'lg',
  padding = 2,
  center = true,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const maxWidthMap = {
    xs: 444,
    sm: 600,
    md: 900,
    lg: 1200,
    xl: 1536,
  };

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: maxWidthMap[maxWidth],
        mx: center ? 'auto' : 0,
        px: isMobile ? 1 : padding,
        py: padding,
      }}
    >
      {children}
    </Box>
  );
};