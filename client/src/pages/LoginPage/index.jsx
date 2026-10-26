
import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext.jsx';
import { register, emailLogin } from '../../services/authService.js';
import {
  BsCameraVideo,
  BsMicFill,
  BsFileEarmarkTextFill,
  BsCodeSlash,
  BsBarChartFill,
  BsShieldCheck,
  BsPeopleFill,
} from 'react-icons/bs';
import toast from 'react-hot-toast';
import './index.css';

function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let result;

      if (isSignUp) {
        result = await register(name, email, password);
        toast.success('Account created successfully!');
      } else {
        result = await emailLogin(email, password);
        toast.success('Welcome back!');
      }

      login(result.token, result.user);
      navigate('/');
    } catch (error) {
      const message =
        error.response?.data?.message || 'Something went wrong';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <nav className="login-nav">
        <div className="login-nav-brand">
          <BsCameraVideo className="login-nav-icon" />
          <span className="login-nav-name">AI Mock Interview</span>
        </div>
      </nav>

      <div className="login-hero">
        <h1 className="login-hero-heading">
          Ace Your Next{' '}
          <span className="login-hero-accent">
            Technical Interview
          </span>
        </h1>

        <p className="login-hero-tagline">
          Practice with an AI interviewer that speaks, listens, and gives you
          real-time feedback on your performance.
        </p>

        <div className="login-hero-features">
          <div className="login-hero-pill">
            <BsMicFill className="login-pill-icon" />
            <span className="login-pill-text">Voice Interviews</span>
          </div>

          <div className="login-hero-pill">
            <BsFileEarmarkTextFill className="login-pill-icon" />
            <span className="login-pill-text">Resume Analysis</span>
          </div>

          <div className="login-hero-pill">
            <BsCodeSlash className="login-pill-icon" />
            <span className="login-pill-text">Live Coding</span>
          </div>

          <div className="login-hero-pill">
            <BsBarChartFill className="login-pill-icon" />
            <span className="login-pill-text">AI Scoring</span>
          </div>
        </div>
      </div>

      <div className="login-form-wrapper">
        <div className="login-card">
          <div className="login-tabs">
            <button
              type="button"
              className={`login-tab ${
                !isSignUp ? 'login-tab-active' : ''
              }`}
              onClick={() => setIsSignUp(false)}
            >
              Sign In
            </button>

            <button
              type="button"
              className={`login-tab ${
                isSignUp ? 'login-tab-active' : ''
              }`}
              onClick={() => setIsSignUp(true)}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {isSignUp && (
              <div className="login-field">
                <label htmlFor="name" className="login-label">
                  Full Name
                </label>

                <input
                  id="name"
                  type="text"
                  className="login-input"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="login-field">
              <label htmlFor="email" className="login-label">
                Email Address
              </label>

              <input
                id="email"
                type="email"
                className="login-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="login-field">
              <label htmlFor="password" className="login-label">
                Password
              </label>

              <input
                id="password"
                type="password"
                className="login-input"
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              className={`login-submit ${
                loading ? 'login-submit-disabled' : ''
              }`}
              disabled={loading}
            >
              {loading
                ? 'Please wait...'
                : isSignUp
                  ? 'Create Account'
                  : 'Sign In'}
            </button>
          </form>
        </div>

        <div className="login-trust">
          <div className="login-trust-item">
            <BsShieldCheck className="login-trust-icon" />
            <span className="login-trust-text">Secure &amp; Private</span>
          </div>

          <div className="login-trust-item">
            <BsPeopleFill className="login-trust-icon" />
            <span className="login-trust-text">Join 10,000+ users</span>
          </div>

          <div className="login-trust-item">
            <BsBarChartFill className="login-trust-icon" />
            <span className="login-trust-text">5 Score Categories</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
