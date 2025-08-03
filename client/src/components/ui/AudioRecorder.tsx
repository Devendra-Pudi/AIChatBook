import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Box,
  IconButton,
  Typography,
  LinearProgress,
  Paper,
  Tooltip,
  Alert,
} from '@mui/material';
import {
  Mic,
  Stop,
  PlayArrow,
  Pause,
  Delete,
  Send,
  MicOff,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

export interface AudioRecorderProps {
  onRecordingComplete: (audioBlob: Blob, duration: number) => void;
  onRecordingCancel?: () => void;
  maxDuration?: number; // in seconds
  disabled?: boolean;
  compact?: boolean;
}

interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  isPlaying: boolean;
  duration: number;
  audioBlob: Blob | null;
  audioUrl: string | null;
  error: string | null;
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onRecordingComplete,
  onRecordingCancel,
  maxDuration = 300, // 5 minutes default
  disabled = false,
  compact = false,
}) => {
  const theme = useTheme();
  const [state, setState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    isPlaying: false,
    duration: 0,
    audioBlob: null,
    audioUrl: null,
    error: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (mediaRecorderRef.current) {
      mediaRecorderRef.current = null;
    }

    if (state.audioUrl) {
      URL.revokeObjectURL(state.audioUrl);
    }

    chunksRef.current = [];
  }, [state.audioUrl]);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, error: null }));

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      streamRef.current = stream;
      chunksRef.current = [];

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4',
      });

      mediaRecorderRef.current = mediaRecorder;

      // Handle data available
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      // Handle recording stop
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { 
          type: mediaRecorder.mimeType || 'audio/webm' 
        });
        const audioUrl = URL.createObjectURL(audioBlob);

        setState(prev => ({
          ...prev,
          isRecording: false,
          isPaused: false,
          audioBlob,
          audioUrl,
        }));
      };

      // Start recording
      mediaRecorder.start(100); // Collect data every 100ms
      startTimeRef.current = Date.now();

      setState(prev => ({
        ...prev,
        isRecording: true,
        isPaused: false,
        duration: 0,
        audioBlob: null,
        audioUrl: null,
      }));

      // Start timer
      timerRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        
        setState(prev => ({
          ...prev,
          duration: elapsed,
        }));

        // Auto-stop at max duration
        if (elapsed >= maxDuration) {
          stopRecording();
        }
      }, 100);

    } catch (error) {
      console.error('Error starting recording:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to access microphone. Please check permissions.',
      }));
    }
  }, [maxDuration]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording) {
      mediaRecorderRef.current.stop();
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, [state.isRecording]);

  // Pause/Resume recording
  const togglePauseRecording = useCallback(() => {
    if (!mediaRecorderRef.current) return;

    if (state.isPaused) {
      mediaRecorderRef.current.resume();
      startTimeRef.current = Date.now() - (state.duration * 1000);
      
      timerRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        setState(prev => ({ ...prev, duration: elapsed }));

        if (elapsed >= maxDuration) {
          stopRecording();
        }
      }, 100);
    } else {
      mediaRecorderRef.current.pause();
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    setState(prev => ({ ...prev, isPaused: !prev.isPaused }));
  }, [state.isPaused, state.duration, maxDuration, stopRecording]);

  // Play/Pause audio
  const togglePlayback = useCallback(() => {
    if (!audioRef.current || !state.audioUrl) return;

    if (state.isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  }, [state.isPlaying, state.audioUrl]);

  // Delete recording
  const deleteRecording = useCallback(() => {
    if (state.audioUrl) {
      URL.revokeObjectURL(state.audioUrl);
    }

    setState(prev => ({
      ...prev,
      audioBlob: null,
      audioUrl: null,
      duration: 0,
      isPlaying: false,
    }));

    onRecordingCancel?.();
  }, [state.audioUrl, onRecordingCancel]);

  // Send recording
  const sendRecording = useCallback(() => {
    if (state.audioBlob) {
      onRecordingComplete(state.audioBlob, state.duration);
      deleteRecording();
    }
  }, [state.audioBlob, state.duration, onRecordingComplete, deleteRecording]);

  // Setup audio element event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => setState(prev => ({ ...prev, isPlaying: true }));
    const handlePause = () => setState(prev => ({ ...prev, isPlaying: false }));
    const handleEnded = () => setState(prev => ({ ...prev, isPlaying: false }));

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [state.audioUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Check if browser supports audio recording
  const isSupported = typeof navigator !== 'undefined' && 
    navigator.mediaDevices && 
    navigator.mediaDevices.getUserMedia &&
    typeof MediaRecorder !== 'undefined';

  if (!isSupported) {
    return (
      <Alert severity="warning">
        Audio recording is not supported in this browser.
      </Alert>
    );
  }

  // Recording in progress
  if (state.isRecording) {
    return (
      <Paper
        sx={{
          p: compact ? 1.5 : 2,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          bgcolor: 'error.light',
          border: `1px solid ${theme.palette.error.main}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              bgcolor: 'error.main',
              animation: 'pulse 1s infinite',
              '@keyframes pulse': {
                '0%': { opacity: 1 },
                '50%': { opacity: 0.5 },
                '100%': { opacity: 1 },
              },
            }}
          />
          <Typography variant={compact ? "caption" : "body2"} color="error.main" fontWeight={600}>
            {state.isPaused ? 'PAUSED' : 'RECORDING'}
          </Typography>
        </Box>

        <Typography variant={compact ? "caption" : "body2"} sx={{ flex: 1 }}>
          {formatTime(state.duration)} / {formatTime(maxDuration)}
        </Typography>

        <LinearProgress
          variant="determinate"
          value={(state.duration / maxDuration) * 100}
          sx={{ flex: 1, mx: 1 }}
        />

        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title={state.isPaused ? "Resume" : "Pause"}>
            <IconButton size="small" onClick={togglePauseRecording}>
              {state.isPaused ? <Mic fontSize="small" /> : <MicOff fontSize="small" />}
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Stop">
            <IconButton size="small" onClick={stopRecording} color="error">
              <Stop fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>
    );
  }

  // Recording completed - show playback controls
  if (state.audioBlob && state.audioUrl) {
    return (
      <Paper
        sx={{
          p: compact ? 1.5 : 2,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          bgcolor: 'success.light',
          border: `1px solid ${theme.palette.success.main}`,
        }}
      >
        <audio ref={audioRef} src={state.audioUrl} preload="metadata" />

        <Tooltip title={state.isPlaying ? "Pause" : "Play"}>
          <IconButton size="small" onClick={togglePlayback} color="success">
            {state.isPlaying ? <Pause fontSize="small" /> : <PlayArrow fontSize="small" />}
          </IconButton>
        </Tooltip>

        <Typography variant={compact ? "caption" : "body2"} sx={{ flex: 1 }}>
          Audio message • {formatTime(state.duration)}
        </Typography>

        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Delete">
            <IconButton size="small" onClick={deleteRecording}>
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Send">
            <IconButton size="small" onClick={sendRecording} color="primary">
              <Send fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>
    );
  }

  // Error state
  if (state.error) {
    return (
      <Alert 
        severity="error" 
        action={
          <IconButton size="small" onClick={() => setState(prev => ({ ...prev, error: null }))}>
            <Delete fontSize="small" />
          </IconButton>
        }
      >
        {state.error}
      </Alert>
    );
  }

  // Initial state - show record button
  return (
    <Tooltip title="Record audio message">
      <IconButton
        onClick={startRecording}
        disabled={disabled}
        color="primary"
        sx={{
          bgcolor: 'primary.light',
          '&:hover': {
            bgcolor: 'primary.main',
            color: 'white',
          },
        }}
      >
        <Mic />
      </IconButton>
    </Tooltip>
  );
};