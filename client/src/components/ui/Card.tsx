import React from 'react';
import { Paper, Box } from '@mui/material';
import type { PaperProps } from '@mui/material';
import { styled } from '@mui/material/styles';

interface CardProps extends PaperProps {
  hover?: boolean;
  padding?: number | string;
  children: React.ReactNode;
}

const StyledCard = styled(Paper)<{ hover?: boolean }>(({ theme, hover }) => ({
  borderRadius: theme.spacing(2),
  transition: 'all 0.2s ease-in-out',
  border: `1px solid ${theme.palette.divider}`,
  
  ...(hover && {
    cursor: 'pointer',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: theme.shadows[8],
      borderColor: theme.palette.primary.main,
    },
  }),
}));

export const Card: React.FC<CardProps> = ({
  hover = false,
  padding = 2,
  children,
  ...props
}) => {
  return (
    <StyledCard hover={hover} {...props}>
      <Box sx={{ p: padding }}>
        {children}
      </Box>
    </StyledCard>
  );
};