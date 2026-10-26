import { useCallback, useEffect, useRef, useState } from 'react';
import { BsMicFill } from 'react-icons/bs';
import './index.css';

const SILENCE_TIMEOUT = 3000;

function ConversationalMic({
  onTranscriptReady,
  onAutoSubmit,
  disabled = false,
}) {
  const [isListening, setIsListening] = useState(false);
  const [finalText, setFinalText] = useState('');
  const [liveText, setLiveText] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const [countdown, setCountdown] = useState(null);
  const [micError, setMicError] = useState('');

  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const countdownTimerRef = useRef(null);
  const finalTextRef = useRef('');
  const liveTextRef = useRef('');
  const submittedRef = useRef(false);
  const listeningRef = useRef(false);
  const disabledRef = useRef(disabled);
  const onTranscriptReadyRef = useRef(onTranscriptReady);
  const onAutoSubmitRef = useRef(onAutoSubmit);

  useEffect(() => {
    disabledRef.current = disabled;
    onTranscriptReadyRef.current = onTranscriptReady;
    onAutoSubmitRef.current = onAutoSubmit;
  }, [disabled, onTranscriptReady, onAutoSubmit]);

  const clearTimers = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }

    setCountdown(null);
  }, []);

  const stopRecognition = useCallback(() => {
    listeningRef.current = false;
    setIsListening(false);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        // Recognition may already be stopped.
      }
    }
  }, []);

  const submitAnswer = useCallback(
    async (text) => {
      const answer = String(text || '').trim();

      if (!answer || submittedRef.current || disabledRef.current) {
        return;
      }

      submittedRef.current = true;
      clearTimers();
      stopRecognition();

      setMicError('');
      setFinalText(answer);
      setLiveText('');

      finalTextRef.current = answer;
      liveTextRef.current = '';

      onTranscriptReadyRef.current?.(answer);

      try {
        await onAutoSubmitRef.current?.(answer);
      } catch (error) {
        // The parent displays the submission error.
        // Allow the user to retry.
        submittedRef.current = false;
        console.error('Answer submission failed:', error);
      }
    },
    [clearTimers, stopRecognition],
  );

  const startSilenceTimer = useCallback(() => {
    clearTimers();

    if (!finalTextRef.current.trim()) {
      return;
    }

    setCountdown(3);

    let secondsLeft = 3;

    countdownTimerRef.current = setInterval(() => {
      secondsLeft -= 1;

      if (secondsLeft > 0) {
        setCountdown(secondsLeft);
      }
    }, 1000);

    silenceTimerRef.current = setTimeout(() => {
      const answer = finalTextRef.current.trim();

      if (answer) {
        void submitAnswer(answer);
      } else {
        clearTimers();
      }
    }, SILENCE_TIMEOUT);
  }, [clearTimers, submitAnswer]);

  const startListening = useCallback(() => {
    if (disabledRef.current || !recognitionRef.current) {
      return;
    }

    clearTimers();
    submittedRef.current = false;

    setMicError('');
    setFinalText('');
    setLiveText('');

    finalTextRef.current = '';
    liveTextRef.current = '';

    listeningRef.current = true;
    setIsListening(true);

    try {
      recognitionRef.current.start();
    } catch (error) {
      listeningRef.current = false;
      setIsListening(false);

      if (error.name === 'InvalidStateError') {
        setMicError(
          'Microphone is already active. Please try again.',
        );
      } else {
        setMicError(
          'Unable to start speech recognition. Check microphone access.',
        );
      }

      console.error('Speech recognition start error:', error);
    }
  }, [clearTimers]);

  const stopListening = useCallback(() => {
    clearTimers();
    stopRecognition();
  }, [clearTimers, stopRecognition]);

  const handleManualSubmit = () => {
    const answer = [
      finalTextRef.current,
      liveTextRef.current,
    ]
      .filter(Boolean)
      .join(' ')
      .trim();

    if (!answer) {
      setMicError('Please speak your answer before submitting.');
      return;
    }

    void submitAnswer(answer);
  };

  const handleKeepTalking = () => {
    clearTimers();

    if (!listeningRef.current) {
      startListening();
    }
  };

  const handleSpeakAgain = () => {
    startListening();
  };

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return undefined;
    }

    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-IN';
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      // Rebuild the transcript from the current results.
      // This avoids appending duplicate text after each event.
      for (let i = 0; i < event.results.length; i += 1) {
        const result = event.results[i];
        const transcript = result[0]?.transcript || '';

        if (result.isFinal) {
          finalTranscript += `${transcript} `;
        } else {
          interimTranscript += `${transcript} `;
        }
      }

      finalTranscript = finalTranscript.trim();
      interimTranscript = interimTranscript.trim();

      finalTextRef.current = finalTranscript;
      liveTextRef.current = interimTranscript;

      setFinalText(finalTranscript);
      setLiveText(interimTranscript);

      onTranscriptReadyRef.current?.(
        [finalTranscript, interimTranscript]
          .filter(Boolean)
          .join(' ')
          .trim(),
      );

      // Wait until the browser produces a final transcript
      // before starting the automatic submission countdown.
      if (interimTranscript) {
        clearTimers();
      } else if (finalTranscript && listeningRef.current) {
        startSilenceTimer();
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);

      if (event.error === 'not-allowed' ||
          event.error === 'service-not-allowed') {
        setMicError(
          'Microphone access is blocked. Allow microphone access in your browser settings.',
        );
        listeningRef.current = false;
        setIsListening(false);
        clearTimers();
      } else if (event.error === 'no-speech') {
        setMicError('No speech detected. Please try speaking again.');
      } else if (event.error === 'network') {
        setMicError(
          'Speech recognition network error. Check your internet connection and try again.',
        );
      }
    };

    recognition.onend = () => {
      listeningRef.current = false;
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      clearTimers();
      listeningRef.current = false;

      try {
        recognition.stop();
      } catch (error) {
        // Recognition may already be stopped.
      }

      recognitionRef.current = null;
    };
  }, [clearTimers, startSilenceTimer]);

  useEffect(() => {
    if (disabled) {
      clearTimers();
      stopRecognition();
    }
  }, [disabled, clearTimers, stopRecognition]);

  const displayText = [finalText, liveText]
    .filter(Boolean)
    .join(' ')
    .trim();

  if (!isSupported) {
    return (
      <div className="cm-unsupported">
        <p className="cm-unsupported-text">
          Voice recognition is not supported in this browser.
          Please use Google Chrome or Microsoft Edge.
        </p>
      </div>
    );
  }

  return (
    <div className="cm-container">
      <div className="cm-mic-button-wrapper">
        <button
          type="button"
          className={`cm-mic-button ${
            isListening ? 'cm-mic-active' : ''
          } ${disabled ? 'cm-mic-button-disabled' : ''}`}
          onClick={isListening ? stopListening : startListening}
          disabled={disabled}
          aria-label={isListening ? 'Stop listening' : 'Start listening'}
        >
          <BsMicFill className="cm-mic-icon" />
        </button>
      </div>

      <div className="cm-status">
        {isListening && !displayText && (
          <p className="cm-status-listening">
            Listening... Speak clearly.
          </p>
        )}

        {isListening && displayText && countdown === null && (
          <p className="cm-status-listening">
            Hearing you...
          </p>
        )}

        {countdown !== null && (
          <p className="cm-status-countdown">
            Submitting in {countdown}s...
            <button
              type="button"
              className="cm-keep-talking-btn"
              onClick={handleKeepTalking}
              disabled={disabled}
            >
              Keep talking
            </button>
          </p>
        )}

        {!isListening && displayText && (
          <p className="cm-status-done">
            Review your transcript before submitting.
          </p>
        )}

        {!isListening && !displayText && (
          <p className="cm-status-ready">
            Ready to listen
          </p>
        )}
      </div>

      {micError && (
        <p role="alert" className="cm-status-countdown">
          {micError}
        </p>
      )}

      {displayText && (
        <div className="cm-transcript-box">
          <span className="cm-transcript-final">
            {finalText}
          </span>{' '}
          {liveText && (
            <span className="cm-transcript-interim">
              {liveText}
            </span>
          )}
        </div>
      )}

      <div className="cm-controls">
        {isListening ? (
          <button
            type="button"
            className="cm-submit-btn"
            onClick={handleManualSubmit}
            disabled={!displayText || disabled}
          >
            Submit Answer
          </button>
        ) : displayText ? (
          <div className="cm-done-actions">
            <button
              type="button"
              className="cm-speak-again-btn"
              onClick={handleSpeakAgain}
              disabled={disabled}
            >
              Speak Again
            </button>

            <button
              type="button"
              className="cm-submit-btn"
              onClick={handleManualSubmit}
              disabled={disabled}
            >
              Submit Answer
            </button>
          </div>
        ) : (
          <button
            type="button"
            className={`cm-start-btn ${
              disabled ? 'cm-start-btn-disabled' : ''
            }`}
            onClick={startListening}
            disabled={disabled}
          >
            Start listening
          </button>
        )}
      </div>
    </div>
  );
}

export default ConversationalMic;