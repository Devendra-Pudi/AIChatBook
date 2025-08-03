import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Box,
  IconButton,
  Typography,

  Slider,
  Tooltip,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  VolumeUp,
  VolumeOff,
  Download,
  Forward10,
  Replay10,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

export interface AudioPlayerProps {
  src: string;
  fileName?: string;
  duration?: number;
  autoPlay?: boolean;
  showDownload?: boolean;
  showControls?: boolean;
  compact?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onError?: (error: string) => void;
}

interface PlayerState {
  isPlaying: boolean;
  isLoading: boolean;
  isMuted: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  error: string | null;
}

const formatTime = (seconds: number): string => {
  if (!isFinite(seconds) || isNaN(seconds)) return '0:00';
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  src,
  fileName,
  duration: providedDuration,
  autoPlay = false,
  showDownload = true,
  showControls = true,
  compact = false,
  onPlay,
  onPause,
  onEnded,
  onError,
}) => {
  const theme = useTheme();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [state, setState] = useState<PlayerState>({
    isPlaying: false,
    isLoading: true,
    isMuted: false,
    currentTime: 0,
    duration: providedDuration || 0,
    volume: 1,
    error: null,
  });

  // Toggle play/pause
  const togglePlayPause = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (state.isPlaying) {
        audio.pause();
        onPause?.();
      } else {
        await audio.play();
        onPlay?.();
      }
    } catch (error) {
      console.error('Audio playback error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Playback failed';
      setState(prev => ({ ...prev, error: errorMessage }));
      onError?.(errorMessage);
    }
  }, [state.isPlaying, onPlay, onPause, onError]);

  // Seek to specific time
  const seekTo = useCallback((time: number) => {
    const audio = audioRef.current;
    if (audio && isFinite(time)) {
      audio.currentTime = time;
    }
  }, []);

  // Skip forward/backward
  const skip = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (audio) {
      const newTime = Math.max(0, Math.min(audio.currentTime + seconds, state.duration));
      seekTo(newTime);
    }
  }, [state.duration, seekTo]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.muted = !audio.muted;
      setState(prev => ({ ...prev, isMuted: audio.muted }));
    }
  }, []);

  // Change volume
  const changeVolume = useCallback((volume: number) => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = volume;
      setState(prev => ({ ...prev, volume }));
    }
  }, []);

  // Download audio file
  const downloadAudio = useCallback(() => {
    const link = document.createElement('a');
    link.href = src;
    link.download = fileName || 'audio.mp3';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [src, fileName]);

  // Setup audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadStart = () => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
    };

    const handleLoadedMetadata = () => {
      setState(prev => ({
        ...prev,
        isLoading: false,
        duration: providedDuration || audio.duration || 0,
      }));
    };

    const handlePlay = () => {
      setState(prev => ({ ...prev, isPlaying: true }));
    };

    const handlePause = () => {
      setState(prev => ({ ...prev, isPlaying: false }));
    };

    const handleTimeUpdate = () => {
      setState(prev => ({ ...prev, currentTime: audio.currentTime }));
    };

    const handleEnded = () => {
      setState(prev => ({ ...prev, isPlaying: false, currentTime: 0 }));
      onEnded?.();
    };

    const handleError = () => {
      const errorMessage = 'Failed to load audio file';
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        isPlaying: false, 
        error: errorMessage 
      }));
      onError?.(errorMessage);
    };

    const handleVolumeChange = () => {
      setState(prev => ({ 
        ...prev, 
        volume: audio.volume,
        isMuted: audio.muted,
      }));
    };

    // Add event listeners
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('volumechange', handleVolumeChange);

    // Cleanup
    return () => {
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('volumechange', handleVolumeChange);
    };
  }, [providedDuration, onEnded, onError]);

  // Auto-play effect
  useEffect(() => {
    if (autoPlay && !state.isLoading && !state.error) {
      togglePlayPause();
    }
  }, [autoPlay, state.isLoading, state.error]); // Don't include togglePlayPause to avoid infinite loop

  if (state.error) {
    return (
      <Box
        sx={{
          p: compact ? 1 : 2,
          bgcolor: 'error.light',
          borderRadius: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Typography variant="caption" color="error.main">
          {state.error}
        </Typography>
        {showDownload && (
          <Tooltip title="Download">
            <IconButton size="small" onClick={downloadAudio}>
              <Download fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: compact ? 1 : 2,
        bgcolor: 'background.paper',
        borderRadius: 1,
        border: `1px solid ${theme.palette.divider}`,
        minWidth: compact ? 200 : 300,
      }}
    >
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Main controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: showControls ? 1 : 0 }}>
        {/* Play/Pause button */}
        <Tooltip title={state.isPlaying ? "Pause" : "Play"}>
          <IconButton
            onClick={togglePlayPause}
            disabled={state.isLoading}
            color="primary"
            sx={{ 
              bgcolor: 'primary.light',
              '&:hover': { bgcolor: 'primary.main', color: 'white' },
            }}
          >
            {state.isLoading ? (
              <Box sx={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    border: '2px solid',
                    borderColor: 'primary.main',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    '@keyframes spin': {
                      '0%': { transform: 'rotate(0deg)' },
                      '100%': { transform: 'rotate(360deg)' },
                    },
                  }}
                />
              </Box>
            ) : state.isPlaying ? (
              <Pause />
            ) : (
              <PlayArrow />
            )}
          </IconButton>
        </Tooltip>

        {/* Progress and time */}
        <Box sx={{ flex: 1, mx: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" sx={{ minWidth: 35 }}>
              {formatTime(state.currentTime)}
            </Typography>
            
            <Slider
              size="small"
              value={state.currentTime}
              max={state.duration}
              onChange={(_, value) => seekTo(value as number)}
              disabled={state.isLoading || state.duration === 0}
              sx={{ flex: 1 }}
            />
            
            <Typography variant="caption" sx={{ minWidth: 35 }}>
              {formatTime(state.duration)}
            </Typography>
          </Box>
        </Box>

        {/* Download button */}
        {showDownload && (
          <Tooltip title="Download">
            <IconButton size="small" onClick={downloadAudio}>
              <Download fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Extended controls */}
      {showControls && !compact && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'space-between' }}>
          {/* Skip controls */}
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="Replay 10s">
              <IconButton size="small" onClick={() => skip(-10)}>
                <Replay10 fontSize="small" />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Forward 10s">
              <IconButton size="small" onClick={() => skip(10)}>
                <Forward10 fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Volume controls */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 120 }}>
            <Tooltip title={state.isMuted ? "Unmute" : "Mute"}>
              <IconButton size="small" onClick={toggleMute}>
                {state.isMuted ? <VolumeOff fontSize="small" /> : <VolumeUp fontSize="small" />}
              </IconButton>
            </Tooltip>
            
            <Slider
              size="small"
              value={state.isMuted ? 0 : state.volume}
              max={1}
              step={0.1}
              onChange={(_, value) => changeVolume(value as number)}
              sx={{ width: 80 }}
            />
          </Box>
        </Box>
      )}

      {/* File name */}
      {fileName && (
        <Typography 
          variant="caption" 
          color="text.secondary" 
          sx={{ display: 'block', mt: 0.5, textAlign: 'center' }}
          noWrap
        >
          {fileName}
        </Typography>
      )}
    </Box>
  );
};