import React from 'react';
import { Skeleton as MuiSkeleton, Box } from '@mui/material';
import type { SkeletonProps as MuiSkeletonProps } from '@mui/material';

interface SkeletonProps extends MuiSkeletonProps {
  lines?: number;
  spacing?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  lines = 1,
  spacing = 1,
  ...props
}) => {
  if (lines === 1) {
    return <MuiSkeleton {...props} />;
  }

  return (
    <Box>
      {Array.from({ length: lines }).map((_, index) => (
        <MuiSkeleton
          key={index}
          {...props}
          sx={{
            mb: index < lines - 1 ? spacing : 0,
            ...props.sx,
          }}
        />
      ))}
    </Box>
  );
};

// Predefined skeleton components for common use cases
export const MessageSkeleton: React.FC = () => (
  <Box sx={{ display: 'flex', gap: 1, p: 2 }}>
    <MuiSkeleton variant="circular" width={40} height={40} />
    <Box sx={{ flex: 1 }}>
      <MuiSkeleton variant="text" width="60%" />
      <MuiSkeleton variant="text" width="80%" />
    </Box>
  </Box>
);

export const ChatListSkeleton: React.FC = () => (
  <Box>
    {Array.from({ length: 5 }).map((_, index) => (
      <Box key={index} sx={{ display: 'flex', gap: 2, p: 2 }}>
        <MuiSkeleton variant="circular" width={48} height={48} />
        <Box sx={{ flex: 1 }}>
          <MuiSkeleton variant="text" width="70%" />
          <MuiSkeleton variant="text" width="50%" />
        </Box>
        <MuiSkeleton variant="text" width={60} />
      </Box>
    ))}
  </Box>
);

export const ProfileSkeleton: React.FC = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, p: 3 }}>
    <MuiSkeleton variant="circular" width={80} height={80} />
    <MuiSkeleton variant="text" width={200} />
    <MuiSkeleton variant="text" width={150} />
    <Box sx={{ width: '100%', mt: 2 }}>
      <Skeleton lines={4} spacing={1} />
    </Box>
  </Box>
);