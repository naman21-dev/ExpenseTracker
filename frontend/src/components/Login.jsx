import React, { useState } from 'react'
import { loginStyles } from '../assets/dummyStyles'
import { User } from 'lucide-react'
import axios from 'axios'
import { Link, useNavigate } from 'react-router-dom'

const Login = ({ onLogin, API_URL = 'https://xpensy.onrender.com' }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate();

  //to fetch profile
  const fetchProfile = async (token) => {
    if(!token) return null;
    const res = await axios.get(`${API_URL}/api/user/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  };

  const persistAuth = (profile, token) => {
    const storage = localStorage;
    try{
    if (profile) storage.setItem('user', JSON.stringify(profile));
    if (token) storage.setItem('token', token);
    } catch (err) {
      console.error("persistAuth error:", err);
    }
  };

  //to login
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try{
        const res = await axios.post(
            `${API_URL}/api/user/login`,
             { email, password },
             { headers: { 'Content-Type': 'application/json' } }
        );
        const data = res.data || {};
        const token = data.token || null;

        //to derive user profile
        let profile = data.user ?? null;
        if(!profile){
            const copy = {...data};
            delete copy.token;
            delete copy.user;
            if(Object.keys(copy).length) {
                profile = copy;
            }
        }
        if(!profile && token){
            try {
                profile = await fetchProfile(token);
            } catch (error) {
                console.error("Error fetching profile:", error);
                profile = {email};
            }
        }

        if(!profile) profile = {email};
        persistAuth(profile, token);

        if(typeof onLogin === 'function') {
            try {
                onLogin(profile, remember, token);
            } catch (error) {
                console.error("onLogin error:", error);
                navigate("/");
            }
        } else{
            navigate("/");
        }
        setPassword('');
    }  catch (err) {
      console.error("Login error:", err?.response || err);
      const serverMsg =
        err.response?.data?.message ||
        (err.response?.data ? JSON.stringify(err.response.data) : null) ||
        err.message ||
        "Login failed";
      setError(serverMsg);
    } finally {
      setLoading(false);
    }
  }

  return (
       <div className={loginStyles.pageContainer}>
      <div className={loginStyles.cardContainer}>

        {/* ── Header ── */}
        <div className={loginStyles.header}>
          <div className={loginStyles.avatar}>
            <User className='w-10 h-10 text-white' />
          </div>
          <h1 className={loginStyles.headerTitle}>Welcome Back</h1>
          <p className={loginStyles.headerSubtitle}>Sign in to your Expense Tracker account</p>
        </div>

        {/* ── Form ── */}
        <div className={loginStyles.formContainer}>

          {/* Error banner */}
          {error && (
            <div className={loginStyles.errorContainer}>
              <div className={loginStyles.errorIcon}>
                <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75
                       1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92z
                       M11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1
                       1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <span className={loginStyles.errorText}>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>

            {/* Email */}
            <div className="mb-5">
              <label htmlFor="email" className={loginStyles.label}>
                Email address
              </label>
              <div className={loginStyles.inputContainer}>
                <div className={loginStyles.inputIcon}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0
                         002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={loginStyles.input}
                />
              </div>
            </div>

            {/* Password */}
            <div className="mb-5">
              <label htmlFor="password" className={loginStyles.label}>
                Password
              </label>
              <div className={loginStyles.inputContainer}>
                <div className={loginStyles.inputIcon}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0
                         00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4
                         4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={loginStyles.passwordInput}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className={loginStyles.passwordToggle}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24"
                      stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478
                           0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3
                           3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532
                           7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478
                           0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24"
                      stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268
                           2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477
                           0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className={loginStyles.checkboxContainer}>
              <input
                id="remember"
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className={loginStyles.checkbox}
              />
              <label htmlFor="remember" className={loginStyles.checkboxLabel}>
                Remember me for 30 days
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={`${loginStyles.button} ${loading ? loginStyles.buttonDisabled : ''}`}
            >
              {loading ? (
                <>
                  <svg className={loginStyles.spinner}
                    xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10"
                      stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in…
                </>
              ) : (
                <>
                  Sign in
                  <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Sign up link */}
          <div className={loginStyles.signUpContainer}>
            <span className={loginStyles.signUpText}>Don't have an account? </span>
            <Link to="/signup" className={loginStyles.signUpLink}>
              Create one free
            </Link>
          </div>
        </div>
      </div>
    </div>
  )

}

export default Login