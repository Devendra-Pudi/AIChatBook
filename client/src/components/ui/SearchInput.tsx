import React, { useState, useCallback } from 'react';
import {
  TextField,
  InputAdornment,
  IconButton,
  Box,
  Chip,
  useTheme,
} from '@mui/material';
import {
  Search,
  Clear,
  FilterList,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

interface SearchInputProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  onClear?: () => void;
  debounceMs?: number;
  showFilters?: boolean;
  filters?: string[];
  onFilterChange?: (filters: string[]) => void;
  disabled?: boolean;
  fullWidth?: boolean;
}

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: theme.spacing(3),
    backgroundColor: theme.palette.mode === 'dark' 
      ? 'rgba(255, 255, 255, 0.05)' 
      : 'rgba(0, 0, 0, 0.02)',
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
      backgroundColor: theme.palette.mode === 'dark' 
        ? 'rgba(255, 255, 255, 0.08)' 
        : 'rgba(0, 0, 0, 0.04)',
    },
    '&.Mui-focused': {
      backgroundColor: theme.palette.background.paper,
      boxShadow: `0 0 0 2px ${theme.palette.primary.main}20`,
    },
  },
}));

export const SearchInput: React.FC<SearchInputProps> = ({
  placeholder = 'Search...',
  value = '',
  onChange,
  onSearch,
  onClear,
  debounceMs = 300,
  showFilters = false,
  filters = [],
  onFilterChange,
  disabled = false,
  fullWidth = true,
}) => {
  const [searchValue, setSearchValue] = useState(value);
  const [showFilterChips, setShowFilterChips] = useState(false);
  const theme = useTheme();

  // Debounced search function
  const debounce = useCallback(
    (func: Function, delay: number) => {
      let timeoutId: NodeJS.Timeout;
      return (...args: any[]) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(null, args), delay);
      };
    },
    []
  );

  const debouncedSearch = useCallback(
    debounce((searchTerm: string) => {
      onSearch?.(searchTerm);
    }, debounceMs),
    [onSearch, debounceMs]
  );

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setSearchValue(newValue);
    onChange?.(newValue);
    debouncedSearch(newValue);
  };

  const handleClear = () => {
    setSearchValue('');
    onChange?.('');
    onClear?.();
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      onSearch?.(searchValue);
    }
  };

  const handleFilterToggle = (filter: string) => {
    const newFilters = filters.includes(filter)
      ? filters.filter(f => f !== filter)
      : [...filters, filter];
    onFilterChange?.(newFilters);
  };

  const availableFilters = ['Messages', 'Files', 'Images', 'Links'];

  return (
    <Box>
      <StyledTextField
        fullWidth={fullWidth}
        size="small"
        placeholder={placeholder}
        value={searchValue}
        onChange={handleInputChange}
        onKeyPress={handleKeyPress}
        disabled={disabled}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search 
                sx={{ 
                  color: 'text.secondary',
                  fontSize: '1.2rem',
                }} 
              />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                {showFilters && (
                  <IconButton
                    size="small"
                    onClick={() => setShowFilterChips(!showFilterChips)}
                    sx={{
                      color: showFilterChips ? 'primary.main' : 'text.secondary',
                    }}
                  >
                    <FilterList fontSize="small" />
                  </IconButton>
                )}
                {searchValue && (
                  <IconButton
                    size="small"
                    onClick={handleClear}
                    sx={{ color: 'text.secondary' }}
                  >
                    <Clear fontSize="small" />
                  </IconButton>
                )}
              </Box>
            </InputAdornment>
          ),
        }}
      />
      
      {showFilters && showFilterChips && (
        <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {availableFilters.map((filter) => (
            <Chip
              key={filter}
              label={filter}
              size="small"
              variant={filters.includes(filter) ? 'filled' : 'outlined'}
              color={filters.includes(filter) ? 'primary' : 'default'}
              onClick={() => handleFilterToggle(filter)}
              sx={{
                borderRadius: 2,
                '&:hover': {
                  backgroundColor: filters.includes(filter)
                    ? theme.palette.primary.dark
                    : theme.palette.action.hover,
                },
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};