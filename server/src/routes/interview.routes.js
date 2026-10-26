import { Router } from 'express';

import {
  startInterviewController,
  getInterviewController,
  submitTextAnswer,
  submitCodeAnswer,
  submitAudioAnswer,
  endInterview,
  getFeedbackController,
} from '../controllers/interview.controller.js';

import authenticate from '../middleware/auth.middleware.js';
import { uploadAudio } from '../middleware/upload.middleware.js';

const router = Router();

router.use(authenticate);

// Start interview
router.post('/start', startInterviewController);

// Submit text answer
router.post('/:id/answer', submitTextAnswer);

// Submit audio answer
router.post('/:id/answer-audio', uploadAudio, submitAudioAnswer);

// Submit code answer
router.post('/:id/code', submitCodeAnswer);

// End interview
router.post('/:id/end', endInterview);

// Get interview
router.get('/:id', getInterviewController);

// Get feedback
router.get('/:id/feedback', getFeedbackController);

export default router;