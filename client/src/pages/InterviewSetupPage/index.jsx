
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  uploadResume,
  getResume,
  startInterview,
} from '../../services/interviewService.js';

import INTERVIEW_ROLES from '../../constants/roles.js';
import DIFFICULTY_LEVELS from '../../constants/difficulty.js';

import {
  BsDisplay,
  BsServer,
  BsLightningFill,
  BsGraphUp,
  BsCloudFill,
  BsStarFill,
  BsStar,
  BsFileEarmarkArrowUp,
  BsCheckCircleFill,
} from 'react-icons/bs';

import { FaPython, FaReact, FaJava } from 'react-icons/fa';
import toast from 'react-hot-toast';
import './index.css';

const ROLE_ICONS = {
  'frontend-developer': BsDisplay,
  'backend-developer': BsServer,
  'full-stack-developer': BsLightningFill,
  'data-analyst': BsGraphUp,
  'devops-engineer': BsCloudFill,
  'python-developer': FaPython,
  'react-developer': FaReact,
  'java-developer': FaJava,
};

const DIFFICULTY_ICONS = {
  easy: (
    <span className="setup-difficulty-stars">
      <BsStarFill className="setup-star-filled" />
      <BsStar className="setup-star-empty" />
      <BsStar className="setup-star-empty" />
    </span>
  ),
  medium: (
    <span className="setup-difficulty-stars">
      <BsStarFill className="setup-star-filled" />
      <BsStarFill className="setup-star-filled" />
      <BsStar className="setup-star-empty" />
    </span>
  ),
  hard: (
    <span className="setup-difficulty-stars">
      <BsStarFill className="setup-star-filled" />
      <BsStarFill className="setup-star-filled" />
      <BsStarFill className="setup-star-filled" />
    </span>
  ),
};

function InterviewSetupPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('medium');

  const [resumeText, setResumeText] = useState('');
  const [resumeFileName, setResumeFileName] = useState('');

  const [loading, setLoading] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);

  useEffect(() => {
    let active = true;

    const loadSavedResume = async () => {
      try {
        const savedResume = await getResume();

        if (active && savedResume) {
          setResumeText(savedResume.text || '');
          setResumeFileName(savedResume.fileName || '');
        }
      } catch (error) {
        console.error('Saved resume loading failed:', error);
      }
    };

    loadSavedResume();

    return () => {
      active = false;
    };
  }, []);

  const handleResumeUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF resume.');
      event.target.value = '';
      return;
    }

    try {
      setUploadingResume(true);

      const result = await uploadResume(file);

      setResumeText(result.text || '');
      setResumeFileName(result.fileName || file.name);

      toast.success('Resume uploaded successfully.');
    } catch (error) {
      console.error('Resume upload error:', error);

      toast.error(
        error.response?.data?.message ||
          'Failed to upload resume. Please try again.',
      );
    } finally {
      setUploadingResume(false);
      event.target.value = '';
    }
  };

  const handleNext = () => {
    if (step === 1 && !selectedRole) {
      toast.error('Please select an interview role.');
      return;
    }

    if (step === 2 && !selectedDifficulty) {
      toast.error('Please select a difficulty level.');
      return;
    }

    setStep((current) => Math.min(current + 1, 3));
  };

  const handleBack = () => {
    setStep((current) => Math.max(current - 1, 1));
  };

  const handleStartInterview = async () => {
    if (!selectedRole) {
      toast.error('Please select an interview role.');
      return;
    }

    if (!resumeText) {
      toast.error('Please upload your resume.');
      return;
    }

    const selectedLevel = DIFFICULTY_LEVELS.find(
      (level) => level.id === selectedDifficulty,
    );

    if (!selectedLevel) {
      toast.error('Please select a valid difficulty level.');
      return;
    }

    try {
      setLoading(true);

      const result = await startInterview(
        selectedRole,
        selectedDifficulty,
        resumeText,
        selectedLevel.questions,
      );

      if (!result?.interviewId) {
        throw new Error('Interview ID was not returned by the server.');
      }

      navigate(`/interview/${result.interviewId}`);
    } catch (error) {
      console.error('Start interview error:', error);

      toast.error(
        error.response?.data?.message ||
          error.message ||
          'Failed to start interview. Please try again.',
      );

      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="setup-page">
        <div className="setup-preparing">
          <div
            className="spinner-border setup-preparing-spinner"
            role="status"
          >
            <span className="visually-hidden">Loading...</span>
          </div>

          <h2 className="setup-preparing-heading">
            Preparing Your Interview...
          </h2>

          <p className="setup-preparing-text">
            AI is analyzing your resume and generating{' '}
            {DIFFICULTY_LEVELS.find(
              (level) => level.id === selectedDifficulty,
            )?.questions}{' '}
            personalized questions for <strong>{selectedRole}</strong>.
          </p>

          <div className="setup-preparing-steps">
            <div className="setup-prep-step">
              <BsCheckCircleFill className="setup-prep-step-icon-active" />
              <span className="setup-prep-step-text">
                Analyzing resume
              </span>
            </div>

            <div className="setup-prep-step">
              <BsCheckCircleFill className="setup-prep-step-icon-active" />
              <span className="setup-prep-step-text">
                Generating questions
              </span>
            </div>

            <div className="setup-prep-step">
              <BsCheckCircleFill className="setup-prep-step-icon-pending" />
              <span className="setup-prep-step-text">
                Setting up voice interviewer
              </span>
            </div>
          </div>

          <p className="setup-preparing-hint">
            This may take some time...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="setup-page">
      <div className="setup-container">
        <div className="setup-step-indicator">
          <span
            className={`setup-step-badge ${
              step >= 1 ? 'setup-step-active' : ''
            }`}
          >
            1. Role
          </span>

          <span
            className={`setup-step-badge ${
              step >= 2 ? 'setup-step-active' : ''
            }`}
          >
            2. Difficulty
          </span>

          <span
            className={`setup-step-badge ${
              step >= 3 ? 'setup-step-active' : ''
            }`}
          >
            3. Resume
          </span>
        </div>

        {step === 1 && (
          <div className="setup-section">
            <h2 className="setup-section-heading">
              Select Interview Role
            </h2>

            <div className="setup-roles-grid">
              {INTERVIEW_ROLES.map((role) => {
                const RoleIcon = ROLE_ICONS[role.id];

                return (
                  <button
                    key={role.id}
                    type="button"
                    className={`setup-role-card ${
                      selectedRole === role.title
                        ? 'setup-role-selected'
                        : ''
                    }`}
                    onClick={() => setSelectedRole(role.title)}
                  >
                    {RoleIcon && (
                      <RoleIcon className="setup-role-icon" />
                    )}

                    <h3 className="setup-role-title">
                      {role.title}
                    </h3>

                    <p className="setup-role-desc">
                      {role.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="setup-section">
            <h2 className="setup-section-heading">
              Choose Difficulty
            </h2>

            <div className="setup-difficulty-row">
              {DIFFICULTY_LEVELS.map((level) => (
                <button
                  key={level.id}
                  type="button"
                  className={`setup-difficulty-card ${
                    selectedDifficulty === level.id
                      ? 'setup-difficulty-selected'
                      : ''
                  }`}
                  onClick={() => setSelectedDifficulty(level.id)}
                >
                  {DIFFICULTY_ICONS[level.id]}

                  <h3 className="setup-difficulty-label">
                    {level.label}
                  </h3>

                  <p className="setup-difficulty-desc">
                    {level.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="setup-section">
            <h2 className="setup-section-heading">
              Upload Your Resume
            </h2>

            <div className="setup-resume-area">
              {resumeText ? (
                <div className="setup-resume-uploaded">
                  <div className="setup-resume-info">
                    <BsFileEarmarkArrowUp className="setup-resume-file-icon" />

                    <p className="setup-resume-name">
                      {resumeFileName}
                    </p>
                  </div>

                  <label className="setup-change-resume-btn">
                    Change
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={handleResumeUpload}
                      disabled={uploadingResume}
                      hidden
                    />
                  </label>
                </div>
              ) : (
                <label className="setup-upload-zone">
                  <BsFileEarmarkArrowUp className="setup-upload-icon" />

                  <p className="setup-upload-text">
                    {uploadingResume
                      ? 'Uploading...'
                      : 'Click to upload PDF resume'}
                  </p>

                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleResumeUpload}
                    disabled={uploadingResume}
                    hidden
                  />
                </label>
              )}
            </div>
          </div>
        )}

        <div className="setup-nav-buttons">
          {step > 1 && (
            <button
              type="button"
              className="setup-back-btn"
              onClick={handleBack}
            >
              Back
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              className="setup-next-btn"
              onClick={handleNext}
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              className={`setup-start-btn ${
                loading || !selectedRole || !resumeText
                  ? 'setup-start-btn-disabled'
                  : ''
              }`}
              onClick={handleStartInterview}
              disabled={
                loading ||
                !selectedRole ||
                !resumeText ||
                uploadingResume
              }
            >
              Start Interview
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default InterviewSetupPage;
