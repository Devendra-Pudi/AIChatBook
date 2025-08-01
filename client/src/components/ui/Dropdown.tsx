import React, { useState } from 'react';
import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  type MenuProps,
} from '@mui/material';

interface DropdownItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  divider?: boolean;
}

interface DropdownProps extends Omit<MenuProps, 'open' | 'onClose'> {
  trigger: React.ReactElement;
  items: DropdownItem[];
  onItemClick?: (itemId: string) => void;
}

export const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  items,
  onItemClick,
  ...menuProps
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleItemClick = (item: DropdownItem) => {
    item.onClick?.();
    onItemClick?.(item.id);
    handleClose();
  };

  return (
    <>
      {React.cloneElement(trigger, {
        onClick: handleClick,
        'aria-controls': open ? 'dropdown-menu' : undefined,
        'aria-haspopup': 'true' as const,
        'aria-expanded': open ? 'true' : undefined,
      } as any)}
      <Menu
        id="dropdown-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'dropdown-button',
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          elevation: 8,
          sx: {
            borderRadius: 2,
            minWidth: 180,
            mt: 1,
            '& .MuiMenuItem-root': {
              borderRadius: 1,
              mx: 1,
              my: 0.5,
            },
          },
        }}
        {...menuProps}
      >
        {items.map((item, index) => (
          <React.Fragment key={item.id}>
            <MenuItem
              onClick={() => handleItemClick(item)}
              disabled={item.disabled}
              sx={{
                py: 1.5,
                px: 2,
              }}
            >
              {item.icon && (
                <ListItemIcon sx={{ minWidth: 36 }}>
                  {item.icon}
                </ListItemIcon>
              )}
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  variant: 'body2',
                  fontWeight: 500,
                }}
              />
            </MenuItem>
            {item.divider && index < items.length - 1 && (
              <Divider sx={{ my: 0.5 }} />
            )}
          </React.Fragment>
        ))}
      </Menu>
    </>
  );
};