import React from 'react';
import { Box, Grid as MuiGrid } from '@mui/material';
import type { GridProps as MuiGridProps } from '@mui/material';
import { useResponsive } from '../../hooks';

interface GridProps extends Omit<MuiGridProps, 'container' | 'item'> {
  container?: boolean;
  item?: boolean;
  spacing?: number | { xs?: number; sm?: number; md?: number; lg?: number; xl?: number };
  columns?: number | { xs?: number; sm?: number; md?: number; lg?: number; xl?: number };
  children: React.ReactNode;
}

export const Grid: React.FC<GridProps> = ({
  container = false,
  item = false,
  spacing = 2,
  columns = 12,
  children,
  ...props
}) => {
  const { getResponsiveValue } = useResponsive();

  const getSpacing = () => {
    if (typeof spacing === 'number') return spacing;
    return getResponsiveValue(spacing) || 2;
  };

  const getColumns = () => {
    if (typeof columns === 'number') return columns;
    return getResponsiveValue(columns) || 12;
  };

  if (container) {
    return (
      <MuiGrid
        container
        spacing={getSpacing()}
        columns={getColumns()}
        {...props}
      >
        {children}
      </MuiGrid>
    );
  }

  if (item) {
    return (
      <MuiGrid item {...(props as any)}>
        {children}
      </MuiGrid>
    );
  }

  return (
    <MuiGrid {...props}>
      {children}
    </MuiGrid>
  );
};

// Responsive container component
interface ResponsiveGridContainerProps {
  children: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  spacing?: number;
  padding?: number;
}

export const ResponsiveGridContainer: React.FC<ResponsiveGridContainerProps> = ({
  children,
  maxWidth = 'lg',
  spacing = 2,
  padding = 2,
}) => {
  const { isMobile } = useResponsive();

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
        mx: 'auto',
        px: isMobile ? 1 : padding,
        py: padding,
      }}
    >
      <Grid container spacing={isMobile ? spacing - 1 : spacing}>
        {children}
      </Grid>
    </Box>
  );
};