import { useState, useEffect, useCallback, useRef } from 'react';
import { Message } from '@philosopher/shared';

interface UseReplayOptions {
  messages: Message[];
  defaultSpeed?: number; // ms per character
}

interface UseReplayReturn {
  displayedMessages: Message[];
  currentMessageIndex: number;
  currentCharIndex: number;
  isPlaying: boolean;
  speed: number;
  play: () => void;
  pause: () => void;
  reset: () => void;
  setSpeed: (speed: number) => void;
  jumpToEnd: () => void;
}

export function useReplay({ messages, defaultSpeed = 30 }: UseReplayOptions): UseReplayReturn {
  const [displayedMessages, setDisplayedMessages] = useState<Message[]>([]);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(defaultSpeed);

  const intervalRef = useRef<number | null>(null);

  const clearIntervalRef = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const play = useCallback(() => {
    if (currentMessageIndex >= messages.length) {
      // Reset if at end
      setCurrentMessageIndex(0);
      setCurrentCharIndex(0);
      setDisplayedMessages([]);
    }
    setIsPlaying(true);
  }, [currentMessageIndex, messages.length]);

  const pause = useCallback(() => {
    setIsPlaying(false);
    clearIntervalRef();
  }, [clearIntervalRef]);

  const reset = useCallback(() => {
    setIsPlaying(false);
    clearIntervalRef();
    setCurrentMessageIndex(0);
    setCurrentCharIndex(0);
    setDisplayedMessages([]);
  }, [clearIntervalRef]);

  const jumpToEnd = useCallback(() => {
    setIsPlaying(false);
    clearIntervalRef();
    setDisplayedMessages([...messages]);
    setCurrentMessageIndex(messages.length);
    setCurrentCharIndex(0);
  }, [messages, clearIntervalRef]);

  useEffect(() => {
    if (!isPlaying) return;

    intervalRef.current = window.setInterval(() => {
      if (currentMessageIndex >= messages.length) {
        setIsPlaying(false);
        clearIntervalRef();
        return;
      }

      const currentMessage = messages[currentMessageIndex];
      const content = currentMessage.content;

      if (currentCharIndex < content.length) {
        // Update the current message being typed
        setDisplayedMessages((prev) => {
          const newMessages = [...prev];
          if (newMessages.length === currentMessageIndex) {
            // Add new message
            newMessages.push({
              ...currentMessage,
              content: content.slice(0, currentCharIndex + 1),
            });
          } else {
            // Update existing message
            newMessages[currentMessageIndex] = {
              ...currentMessage,
              content: content.slice(0, currentCharIndex + 1),
            };
          }
          return newMessages;
        });
        setCurrentCharIndex((prev) => prev + 1);
      } else {
        // Move to next message
        setCurrentMessageIndex((prev) => prev + 1);
        setCurrentCharIndex(0);
      }
    }, speed);

    return () => clearIntervalRef();
  }, [isPlaying, currentMessageIndex, currentCharIndex, messages, speed, clearIntervalRef]);

  return {
    displayedMessages,
    currentMessageIndex,
    currentCharIndex,
    isPlaying,
    speed,
    play,
    pause,
    reset,
    setSpeed,
    jumpToEnd,
  };
}
