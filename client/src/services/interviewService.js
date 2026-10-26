import API from './api.js';

const unwrap = response => response?.data?.data ?? response?.data;

export const uploadResume = async file => {
  const formData = new FormData();
  formData.append('resume', file);
  const response = await API.post('/resume/upload', formData);
  return unwrap(response);
};

export const getResume = async () =>
  unwrap(await API.get('/resume'));

export const startInterview = async (
  role,
  difficulty,
  resumeText,
  totalQuestions = 5,
) => {
  let payload;

  // Support both the current and older calling conventions.
  if (typeof totalQuestions === 'string' || typeof difficulty === 'number') {
    payload = {
      role,
      resumeText: difficulty,
      totalQuestions: Number(resumeText) || 5,
    };
  } else {
    payload = {
      role,
      difficulty,
      resumeText,
      totalQuestions: Number(totalQuestions) || 5,
    };
  }

  const response = await API.post('/interview/start', payload);
  return unwrap(response);
};

export const getInterview = async interviewId =>
  unwrap(await API.get(`/interview/${interviewId}`));

export const submitTextAnswer = async (interviewId, answer) =>
  unwrap(
    await API.post(`/interview/${interviewId}/answer`, { answer }),
  );

export const submitInterviewAnswer = submitTextAnswer;

export const submitAudioAnswer = async (interviewId, audioFile) => {
  const formData = new FormData();
  formData.append(
    'audio',
    audioFile,
    audioFile.name || 'answer.webm',
  );

  return unwrap(
    await API.post(`/interview/${interviewId}/answer-audio`, formData),
  );
};

export const submitInterviewAudio = submitAudioAnswer;

export const submitCode = async (
  interviewId,
  code,
  language = 'javascript',
) =>
  unwrap(
    await API.post(`/interview/${interviewId}/code`, {
      code,
      language,
    }),
  );

export const submitCodeAnswer = submitCode;
export const submitInterviewCode = submitCode;

export const transcribeAudio = async audioBlob => {
  const formData = new FormData();
  formData.append(
    'audio',
    audioBlob,
    audioBlob.name || 'answer.webm',
  );

  return unwrap(
    await API.post('/interview/transcribe', formData),
  );
};

export const endInterview = async interviewId =>
  unwrap(await API.post(`/interview/${interviewId}/end`));

export const completeInterview = endInterview;

export const getFeedback = async interviewId =>
  unwrap(await API.get(`/interview/${interviewId}/feedback`));

export const getInterviewFeedback = getFeedback;