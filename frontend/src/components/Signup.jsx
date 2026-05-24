import React, { useState } from 'react'
import { signupStyles } from '../assets/dummyStyles'
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus } from 'lucide-react';
import axios from 'axios';

const Signup = ({ API_URL = 'https://xpensy.onrender.com', onSignup }) => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    //to fetch profile
    const fetchProfile = async (token) => {
        if (!token) return null;
        const res = await axios.get(`${API_URL}/api/user/me`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data;
    };

    const persistAuth = (profile, token) => {
        const storage = rememberMe ? localStorage : sessionStorage;
        try {
            if (profile) storage.setItem('user', JSON.stringify(profile));
            if (token) storage.setItem('token', token);
        } catch (err) {
            console.error("persistAuth error:", err);
        }
    };

    //to validate that all fields are filled by user
    const validateForm = () => {
        const newErrors = {};

        if (!name.trim()) {
            newErrors.name = "Name is required";
        }
        if (!email.trim()) {
            newErrors.email = "Email is required";
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = "Email is invalid";
        }
        if (!password) {
            newErrors.password = "Password is required";
        } else if (password.length < 6) {
            newErrors.password = "Password must be at least 6 characters";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});
        if (!validateForm()) return;
        setIsLoading(true);
        try {
            const res = await axios.post(
                `${API_URL}/api/user/register`,
                { name, email, password },
                { headers: { "Content-Type": "application/json" } }
            )

            const data = res.data || {};
            const token = data.token ?? null;
            let profile = data.user ?? null;
            if (!profile) {
                // check for any extra fields returned that could be user info
                const copy = { ...data };
                delete copy.token;
                delete copy.user;
                if (Object.keys(copy).length) profile = copy;
            }

            if (!profile && token) {
                try {
                    profile = await fetchProfile(token);
                } catch (fetchErr) {
                    console.warn("Could not fetch profile after signup token:", fetchErr);
                    profile = null;
                }
            }

            if (!profile) profile = { name, email };
            persistAuth(profile, token);
            if (typeof onSignup === "function") {
                try {
                    onSignup(profile, rememberMe, token);
                } catch (callErr) {
                    console.warn("onSignup threw:", callErr);
                    navigate("/");
                }
            } else {
                navigate("/");
            }
            setPassword("");
        }
        catch (err) {
            console.error("Signup error:", err?.response || err);
            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors);
            } else if (err.response?.data?.message) {
                setErrors({ api: err.response.data.message });
            } else {
                setErrors({ api: err.message || "An unexpected error occurred" });
            }
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className={signupStyles.pageContainer}>
            <div className={signupStyles.cardContainer}>
 
                {/* ── Header ── */}
                <div className={signupStyles.header}>
                    <button
                        className={signupStyles.backButton}
                        onClick={() => navigate('/login')}
                        aria-label="Back to login"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className={signupStyles.avatar}>
                        <UserPlus className="w-10 h-10 text-white" />
                    </div>
                    <h1 className={signupStyles.headerTitle}>Create Account</h1>
                    <p className={signupStyles.headerSubtitle}>Sign up for your Expense Tracker account</p>
                </div>
 
                {/* ── Form ── */}
                <div className={signupStyles.formContainer}>
 
                    {/* API Error banner */}
                    {errors.api && (
                        <p className={signupStyles.apiError}>{errors.api}</p>
                    )}
 
                    <form onSubmit={handleSubmit} noValidate>
 
                        {/* Name */}
                        <div className="mb-5">
                            <label htmlFor="name" className={signupStyles.label}>
                                Full name
                            </label>
                            <div className={signupStyles.inputContainer}>
                                <div className={signupStyles.inputIcon}>
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24"
                                        stroke="currentColor" strokeWidth={1.8}>
                                        <path strokeLinecap="round" strokeLinejoin="round"
                                            d="M5.121 17.804A8.966 8.966 0 0112 15c2.21 0 4.232.8 5.879 2.118M15 
                                               11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                                <input
                                    id="name"
                                    type="text"
                                    required
                                    autoComplete="name"
                                    placeholder="John Doe"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className={signupStyles.input}
                                />
                            </div>
                            {errors.name && (
                                <p className={signupStyles.fieldError}>{errors.name}</p>
                            )}
                        </div>
 
                        {/* Email */}
                        <div className="mb-5">
                            <label htmlFor="email" className={signupStyles.label}>
                                Email address
                            </label>
                            <div className={signupStyles.inputContainer}>
                                <div className={signupStyles.inputIcon}>
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
                                    className={signupStyles.input}
                                />
                            </div>
                            {errors.email && (
                                <p className={signupStyles.fieldError}>{errors.email}</p>
                            )}
                        </div>
 
                        {/* Password */}
                        <div className="mb-5">
                            <label htmlFor="password" className={signupStyles.label}>
                                Password
                            </label>
                            <div className={signupStyles.inputContainer}>
                                <div className={signupStyles.inputIcon}>
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
                                    autoComplete="new-password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={signupStyles.passwordInput}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    className={signupStyles.passwordToggle}
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
                            {errors.password && (
                                <p className={signupStyles.fieldError}>{errors.password}</p>
                            )}
                        </div>
 
                        {/* Remember me */}
                        <div className={signupStyles.checkboxContainer}>
                            <input
                                id="rememberMe"
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className={signupStyles.checkbox}
                            />
                            <label htmlFor="rememberMe" className={signupStyles.checkboxLabel}>
                                Remember me for 30 days
                            </label>
                        </div>
 
                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`${signupStyles.button} ${isLoading ? signupStyles.buttonDisabled : ''}`}
                        >
                            {isLoading ? (
                                <>
                                    <svg className={signupStyles.spinner}
                                        xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10"
                                            stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Creating account…
                                </>
                            ) : (
                                <>
                                    Create Account
                                    <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24"
                                        stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round"
                                            d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </>
                            )}
                        </button>
                    </form>
 
                    {/* Sign in link */}
                    <div className={signupStyles.signInContainer}>
                        <span className={signupStyles.signInText}>Already have an account? </span>
                        <a href="/login" className={signupStyles.signInLink}>Sign in</a>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Signup