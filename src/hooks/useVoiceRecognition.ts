import { useState, useEffect, useRef, useCallback } from "react";

interface VoiceRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

interface UseVoiceRecognitionOptions {
  continuous?: boolean;
  interimResults?: boolean;
  language?: string;
  onResult?: (result: VoiceRecognitionResult) => void;
  onError?: (error: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
}

interface UseVoiceRecognitionReturn {
  isSupported: boolean;
  isListening: boolean;
  transcript: string;
  confidence: number;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

export function useVoiceRecognition(
  options: UseVoiceRecognitionOptions = {}
): UseVoiceRecognitionReturn {
  const {
    continuous = false,
    interimResults = true,
    language = "en-US",
    onResult,
    onError,
    onStart,
    onEnd,
  } = options;

  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check for browser support
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();
    } else {
      setIsSupported(false);
      setError("Speech recognition not supported in this browser");
    }
  }, []);

  // Setup recognition instance
  useEffect(() => {
    if (!recognitionRef.current) return;

    const recognition = recognitionRef.current;
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = language;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      onStart?.();
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcriptPart = result[0].transcript;

        if (result.isFinal) {
          finalTranscript += transcriptPart;
          setConfidence(result[0].confidence);

          // Call result callback for final results
          onResult?.({
            transcript: transcriptPart,
            confidence: result[0].confidence,
            isFinal: true,
          });
        } else {
          interimTranscript += transcriptPart;

          // Call result callback for interim results
          if (interimResults) {
            onResult?.({
              transcript: transcriptPart,
              confidence: result[0].confidence,
              isFinal: false,
            });
          }
        }
      }

      // Update the transcript state
      if (finalTranscript) {
        setTranscript((prev) => prev + finalTranscript);
      } else if (interimResults && interimTranscript) {
        setTranscript((prev) => prev + interimTranscript);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const errorMessage = `Speech recognition error: ${event.error}`;
      setError(errorMessage);
      setIsListening(false);
      onError?.(errorMessage);
    };

    recognition.onend = () => {
      setIsListening(false);
      onEnd?.();
    };

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [continuous, interimResults, language, onResult, onError, onStart, onEnd]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [isListening]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || !isSupported) {
      setError("Speech recognition not available");
      return;
    }

    if (isListening) {
      return; // Already listening
    }

    try {
      recognitionRef.current.start();

      // Set a timeout to automatically stop listening after 30 seconds
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        stopListening();
      }, 30000); // 30 second timeout
    } catch (err) {
      const errorMessage = `Failed to start speech recognition: ${err}`;
      setError(errorMessage);
      onError?.(errorMessage);
    }
  }, [isSupported, isListening, onError, stopListening]);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setConfidence(0);
    setError(null);
  }, []);

  return {
    isSupported,
    isListening,
    transcript,
    confidence,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
}

// Extend the Window interface to include speech recognition types
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}
