"use client";
import React, { useEffect, useState } from "react";
import { Eye, EyeOff, FileAudio, Mail, Lock, User } from "lucide-react";
import { useRouter } from "next/navigation";

/**
 * Working demo Login component
 * - Seeds random demo credentials (static for the session but persisted as demo examples)
 * - Allows "Use demo" to autofill credentials
 * - Mock login & signup (signup persists to localStorage)
 */

const DEMO_STORAGE_KEY = "pdf_audio_demo_accounts_v1";
const USER_STORAGE_KEY = "pdf_audio_user_accounts_v1";

const makeRandomDemo = (i = 0) => {
  const domains = ["example.com", "demo.io", "mail.test"];
  const name = `demouser${i + 1}`;
  const email = `${name}@${domains[i % domains.length]}`;
  // simple predictable passwords for demo
  const password = `password${100 + i}`;
  return { email, password, name: `Demo User ${i + 1}` };
};

const seedDemoAccountsIfNeeded = () => {
  const existing = localStorage.getItem(DEMO_STORAGE_KEY);
  if (existing) return JSON.parse(existing);
  const demos = Array.from({ length: 3 }).map((_, i) => makeRandomDemo(i));
  localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(demos));
  return demos;
};

const loadUserAccounts = () => {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveUserAccounts = (accounts) => {
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(accounts));
};

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [demoAccounts, setDemoAccounts] = useState([]);
  const [userAccounts, setUserAccounts] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");
  const { replace } = useRouter();

  useEffect(() => {
    // Seed demo accounts (persisted)
    const demos = seedDemoAccountsIfNeeded();
    setDemoAccounts(demos);

    // load registered user accounts (from previous signups)
    const users = loadUserAccounts();
    setUserAccounts(users);

    // default autofill for quick demo
    if (demos.length > 0) {
      setEmail(demos[0].email);
      setPassword(demos[0].password);
    } else {
      setEmail("demo@example.com");
      setPassword("password123");
    }
  }, []);

  const simulateNetwork = (result, delay = 700) =>
    new Promise((resolve) => setTimeout(() => resolve(result), delay));

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setIsLoading(true);

    if (!email || !password) {
      setError("Please provide both email and password.");
      setIsLoading(false);
      return;
    }

    const combined = [...demoAccounts, ...userAccounts];

    const found = combined.find(
      (a) =>
        a.email.toLowerCase().trim() === email.toLowerCase().trim() &&
        a.password === password
    );

    await simulateNetwork(true);

    if (found) {
      // ✅ Persist login
      localStorage.setItem("auth", "true");
      localStorage.setItem("user", JSON.stringify(found));

      setSuccessMessage(`Welcome back, ${found.name || "User"}!`);
      setError("");
      replace("/");
    } else {
      setError("Invalid email or password");
      setSuccessMessage("");
    }

    setIsLoading(false);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setIsLoading(true);

    if (!email || !password || !name) {
      setError("Please fill all signup fields.");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setIsLoading(false);
      return;
    }

    const existsInDemo = demoAccounts.some(
      (a) => a.email.toLowerCase().trim() === email.toLowerCase().trim()
    );
    const existsInUsers = userAccounts.some(
      (a) => a.email.toLowerCase().trim() === email.toLowerCase().trim()
    );

    if (existsInDemo || existsInUsers) {
      setError("User with this email already exists");
      setIsLoading(false);
      return;
    }

    const newUser = { email, password, name };
    const updated = [...userAccounts, newUser];

    // ✅ persist accounts
    setUserAccounts(updated);
    saveUserAccounts(updated);

    await simulateNetwork(true);

    setSuccessMessage("Account created! You can now sign in.");
    setIsLogin(true);
    setIsLoading(false);
    setPassword("");
  };

  // Autofill a demo credential
  const useDemo = (demo) => {
    setEmail(demo.email);
    setPassword(demo.password);
    setName(demo.name || "");
    setError("");
    setSuccessMessage(`Filled demo credentials for ${demo.email}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-4">
            <FileAudio className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            PDF to Audio Converter
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {isLogin ? "Sign in to your account" : "Create your account"}
          </p>
        </div>

        <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-gray-200">
          {/* Demo Credentials */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-blue-800">
                Demo Credentials
              </h4>
              <small className="text-xs text-blue-600">
                Click "Use" to autofill
              </small>
            </div>

            <div className="space-y-1">
              {demoAccounts.map((d, idx) => (
                <div
                  key={d.email}
                  className="flex items-center justify-between p-2 rounded-md bg-white/60 border border-blue-100"
                >
                  <div className="text-xs text-blue-700">
                    <div className="font-medium">{d.email}</div>
                    <div className="text-[11px]">Password: {d.password}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => useDemo(d)}
                    className="text-xs px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Use
                  </button>
                </div>
              ))}
            </div>
          </div>

          <form
            className="space-y-6"
            onSubmit={isLogin ? handleLogin : handleSignup}
          >
            {!isLogin && (
              <div>
                <label htmlFor="name" className="sr-only">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    className="relative block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="relative block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  className="relative block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-3 h-5 w-5 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 py-2 rounded-lg">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="text-green-700 text-sm text-center bg-green-50 py-2 rounded-lg">
                {successMessage}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : isLogin ? (
                  "Sign in"
                ) : (
                  "Sign up"
                )}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                className="text-sm text-blue-600 hover:text-blue-500"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError("");
                  setSuccessMessage("");
                }}
              >
                {isLogin
                  ? "Don't have an account? Sign up"
                  : "Already have an account? Sign in"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
