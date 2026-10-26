import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  getInterview,
  submitInterviewAnswer,
  submitInterviewCode,
  endInterview,
} from '../../services/interviewService';

import CodeEditor from '../../components/CodeEditor';
import ConversationalMic from '../../components/ConversationalMic';

import './index.css';

const InterviewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [interview, setInterview] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const [answer, setAnswer] = useState('');
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [ending, setEnding] = useState(false);
  const [error, setError] = useState('');
  const [hasSubmittedCurrentQuestion, setHasSubmittedCurrentQuestion] =
    useState(false);

  const questions = interview?.questions || [];
  const currentQuestion = questions[currentQuestionIndex];

  const totalQuestions =
    interview?.totalQuestions || questions.length || 5;

  const questionNumber = currentQuestionIndex + 1;
  const isLastQuestion = questionNumber >= totalQuestions;

  const isCodeQuestion =
    currentQuestion?.isCodeQuestion === true ||
    currentQuestion?.type === 'coding';

  // Load the interview.
  useEffect(() => {
    let mounted = true;

    const loadInterview = async () => {
      try {
        setLoading(true);
        setError('');

        const data = await getInterview(id);

        if (!mounted) return;

        setInterview(data);

        const loadedQuestions = data?.questions || [];

        const unansweredIndex = loadedQuestions.findIndex(
          (question) => !question.answer && !question.codeAnswer,
        );

        setCurrentQuestionIndex(
          unansweredIndex >= 0 ? unansweredIndex : 0,
        );
      } catch (err) {
        console.error('Load interview error:', err);

        if (mounted) {
          setError(
            err?.response?.data?.message ||
              'Failed to load the interview.',
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    if (id) {
      loadInterview();
    }

    return () => {
      mounted = false;
    };
  }, [id]);

  // Reset answer fields when moving to a different question.
  useEffect(() => {
    setAnswer('');
    setCode('');
    setHasSubmittedCurrentQuestion(false);
    setError('');
  }, [currentQuestionIndex]);

  const handleEndInterview = useCallback(async () => {
    if (ending) return;

    try {
      setEnding(true);
      setError('');

      await endInterview(id);

      navigate(`/feedback/${id}`, { replace: true });
    } catch (err) {
      console.error('End interview error:', err);

      setEnding(false);
      setHasSubmittedCurrentQuestion(false);

      setError(
        err?.response?.data?.message ||
          'Your interview was saved, but feedback could not be generated. Please try again.',
      );
    }
  }, [ending, id, navigate]);

  // Handle the result returned by the backend.
  const processAnswerResult = async (result) => {
    console.log('ANSWER RESULT:', result);

    if (result?.completed) {
      await handleEndInterview();
      return;
    }

    // The current backend may return the next question in
    // one of these fields. Advance only if a next question exists.
    const nextQuestion =
      result?.nextQuestion ||
      result?.question ||
      result?.currentQuestion;

    if (nextQuestion) {
      setCurrentQuestionIndex((previousIndex) => previousIndex + 1);
      return;
    }

    // Some APIs return the saved result without the next question.
    // Refresh the interview before deciding that submission failed.
    try {
      const refreshedInterview = await getInterview(id);
      const refreshedQuestions = refreshedInterview?.questions || [];

      const nextUnansweredIndex = refreshedQuestions.findIndex(
        (question) => !question.answer && !question.codeAnswer,
      );

      setInterview(refreshedInterview);

      if (
        nextUnansweredIndex >= 0 &&
        nextUnansweredIndex !== currentQuestionIndex
      ) {
        setCurrentQuestionIndex(nextUnansweredIndex);
        return;
      }

      if (
        nextUnansweredIndex === -1 ||
        currentQuestionIndex + 1 >= refreshedQuestions.length
      ) {
        await handleEndInterview();
        return;
      }

      setError(
        'Your answer was submitted, but the next question could not be identified. Please check the interview response.',
      );
    } catch (err) {
      console.error('Refresh after answer error:', err);

      setError(
        'Your answer may have been saved, but the next question could not be loaded. Please refresh the page before submitting again.',
      );
    }
  };

  const submitAnswerText = async (text) => {
    const cleanedAnswer = String(text || '').trim();

    if (submitting || ending || hasSubmittedCurrentQuestion) {
      return;
    }

    if (!cleanedAnswer) {
      setError('Please speak or type an answer before submitting.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setHasSubmittedCurrentQuestion(true);

      // Display the transcript in the text area as well.
      setAnswer(cleanedAnswer);

      const result = await submitInterviewAnswer(id, cleanedAnswer);

      await processAnswerResult(result);
    } catch (err) {
      console.error('Submit answer error:', err);

      setHasSubmittedCurrentQuestion(false);
      setError(
        err?.response?.data?.message ||
          'Failed to submit your answer. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitAnswer = async () => {
    await submitAnswerText(answer);
  };

  const handleVoiceSubmit = async (transcript) => {
    await submitAnswerText(transcript);
  };

  const handleSubmitCode = async () => {
    if (submitting || ending || hasSubmittedCurrentQuestion) {
      return;
    }

    if (!code.trim()) {
      setError('Please write your code before submitting.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setHasSubmittedCurrentQuestion(true);

      const result = await submitInterviewCode(id, code, language);

      await processAnswerResult(result);
    } catch (err) {
      console.error('Submit code error:', err);

      setHasSubmittedCurrentQuestion(false);
      setError(
        err?.response?.data?.message ||
          'Failed to submit your code. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="interview-page">
        <div className="interview-loading">
          <h2>Loading interview...</h2>
          <p>Please wait.</p>
        </div>
      </div>
    );
  }

  if (!interview || !currentQuestion) {
    return (
      <div className="interview-page">
        <div className="interview-error">
          <h2>Unable to load interview</h2>
          {error && <p>{error}</p>}

          <button
            type="button"
            onClick={() => navigate('/setup')}
          >
            Back to Setup
          </button>
        </div>
      </div>
    );
  }

  const controlsDisabled =
    submitting || ending || hasSubmittedCurrentQuestion;

  return (
    <div className="interview-page">
      <div className="interview-container">
        <div className="interview-header">
          <div>
            <h1>AI Mock Interview</h1>
            <p>
              {interview.role || 'Software Engineer'}
              {' • '}
              {interview.difficulty || 'Medium'}
            </p>
          </div>

          <div className="question-counter">
            Question {questionNumber} of {totalQuestions}
          </div>
        </div>

        <div className="progress-container">
          <div
            className="progress-bar"
            style={{
              width: `${Math.min(
                (questionNumber / totalQuestions) * 100,
                100,
              )}%`,
            }}
          />
        </div>

        {error && (
          <div className="interview-error-message" role="alert">
            {error}
          </div>
        )}

        <div className="question-card">
          <div className="question-label">
            Question {questionNumber}
          </div>

          <h2 className="question-text">
            {currentQuestion.text ||
              currentQuestion.question ||
              'Interview Question'}
          </h2>

          {!isCodeQuestion && (
            <>
              <textarea
                className="answer-input"
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
                placeholder="Type your answer here, or use the microphone below..."
                disabled={controlsDisabled}
                rows={8}
              />

              <div className="answer-actions">
                <button
                  type="button"
                  className="submit-answer-button"
                  onClick={handleSubmitAnswer}
                  disabled={controlsDisabled || !answer.trim()}
                >
                  {submitting
                    ? 'Submitting...'
                    : isLastQuestion
                      ? 'Submit & Finish'
                      : 'Submit Answer'}
                </button>
              </div>

              <div className="voice-section">
                <div className="voice-divider">
                  <span>OR ANSWER BY VOICE</span>
                </div>

                <ConversationalMic
                  key={`mic-${questionNumber}`}
                  onTranscriptReady={(transcript) => {
                    setAnswer(transcript);
                    setError('');
                  }}
                  onAutoSubmit={handleVoiceSubmit}
                  disabled={controlsDisabled}
                />
              </div>
            </>
          )}

          {isCodeQuestion && (
            <div className="coding-section">
              <div className="language-selector">
                <label htmlFor="language">Language</label>

                <select
                  id="language"
                  value={language}
                  onChange={(event) => setLanguage(event.target.value)}
                  disabled={controlsDisabled}
                >
                  <option value="python">Python</option>
                  <option value="javascript">JavaScript</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                </select>
              </div>

              <CodeEditor
                value={code}
                onChange={setCode}
                language={language}
                readOnly={controlsDisabled}
              />

              <button
                type="button"
                className="submit-answer-button"
                onClick={handleSubmitCode}
                disabled={controlsDisabled || !code.trim()}
              >
                {submitting
                  ? 'Evaluating...'
                  : isLastQuestion
                    ? 'Submit Code & Finish'
                    : 'Submit Code'}
              </button>
            </div>
          )}
        </div>

        {(submitting || ending) && (
          <div className="interview-processing">
            <div className="processing-spinner" />

            <h3>
              {ending
                ? 'Preparing your feedback...'
                : 'Submitting your answer...'}
            </h3>

            <p>
              {ending
                ? 'Your interview is complete. Please wait while feedback is generated.'
                : 'Your answer is being saved. Please wait.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewPage;