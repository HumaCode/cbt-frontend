import { useState, useEffect, useRef } from 'react';

interface UseTimerProps {
  endTime: string | Date;
  onTimeUp?: () => void;
  disabled?: boolean;
}

export const useTimer = ({ endTime, onTimeUp, disabled = false }: UseTimerProps) => {
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const onTimeUpRef = useRef(onTimeUp);

  // Keep callback ref updated
  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  useEffect(() => {
    if (disabled) return;

    const calculateSecondsLeft = () => {
      const difference = new Date(endTime).getTime() - new Date().getTime();
      return Math.max(0, Math.floor(difference / 1000));
    };

    // Initial calculation
    const initialSeconds = calculateSecondsLeft();
    setSecondsLeft(initialSeconds);

    if (initialSeconds <= 0) {
      if (onTimeUpRef.current) onTimeUpRef.current();
      return;
    }

    const timer = setInterval(() => {
      const left = calculateSecondsLeft();
      setSecondsLeft(left);

      if (left <= 0) {
        clearInterval(timer);
        if (onTimeUpRef.current) onTimeUpRef.current();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime, disabled]);

  const formatTime = () => {
    const hours = Math.floor(secondsLeft / 3600);
    const minutes = Math.floor((secondsLeft % 3600) / 60);
    const secs = secondsLeft % 60;

    return [
      hours > 0 ? String(hours).padStart(2, '0') : null,
      String(minutes).padStart(2, '0'),
      String(secs).padStart(2, '0'),
    ]
      .filter(Boolean)
      .join(':');
  };

  return {
    secondsLeft,
    formattedTime: formatTime(),
    isTimeUp: secondsLeft <= 0,
  };
};
