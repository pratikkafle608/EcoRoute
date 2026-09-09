import React, { useState } from 'react';
import axios from 'axios';
import PublicTransitCard from './components/PublicTransitCard';
import LoginForm from './components/LoginForm';
import SignupForm from './components/SignupForm';
import AppHeader from './components/AppHeader';
import RouteForm from './components/RouteForm';
import ResultCard from './components/ResultCard';
import HistoryTable from './components/HistoryTable';
import { errStyle } from './styles';

const API = 'http://localhost:8080/api'; //this points to the backend running in the port 8080

export default function App() {
  // auth state
  const [view,         setView]         = useState('login'); // 'login' | 'signup'
  const [loggedInUser, setLoggedInUser] = useState(null);

  // login form
  const [loginForm,    setLoginForm]    = useState({ email: '', password: '' });
  const [loginError,   setLoginError]   = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // signup form
  const [signupForm,    setSignupForm]    = useState({ name: '', email: '', password: '', confirm: '' });
  const [signupError,   setSignupError]   = useState('');
  const [signupLoading, setSignupLoading] = useState(false);

  // main app state
  const [form,     setForm]     = useState({ vehicleName: '', fuelType: 'petrol', origin: '', destination: '' });
  const [result,   setResult]   = useState(null);
  const [history,  setHistory]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  //state to store transit data
  const [transitResult, setTransitResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setResult(null); setTransitResult(null);
    try {
      const vehicleRes = await axios.post(`${API}/vehicles`, {
        user:      { userId: loggedInUser.userId },
        modelType: form.vehicleName.trim(),
        fuelType:  form.fuelType,
      });
      const r = await axios.post(`${API}/routes/calculate`, {
        userId:      loggedInUser.userId,
        vehicleId:   vehicleRes.data.vehicleId,
        origin:      form.origin,
        destination: form.destination,
      });
      setResult(r.data);

      // ADD THIS: Estimate public transit CO2 savings (approx 0.035 kg CO2/km for train/bus)
      const drivingCo2 = r.data.co2EmittedKg;
      const distance = r.data.distanceKm;
      const estimatedTransitCo2 = distance * 0.035;
      const saved = Math.max(0, drivingCo2 - estimatedTransitCo2);

      setTransitResult({
        bestOption: 'City Transit / Regional Rail',
        transitCo2Kg: estimatedTransitCo2,
        savedCo2Kg: saved,
        savingsPercent: drivingCo2 > 0 ? Math.round((saved / drivingCo2) * 100) : 0,
        estimatedTime: `${Math.round(distance * 1.4)} mins`,
        transfers: 1,
      });

      const h = await axios.get(`${API}/routes/history/${loggedInUser.userId}`);
      setHistory(h.data);
    } catch (err) {
      setError('Calculation failed. Check the console.');
      console.error(err);
    } finally { setLoading(false); }
  };

  const switchView = (v) => {
    setView(v);
    setLoginError('');
    setSignupError('');
  };

  // ── Login ──────────────────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      const r = await axios.post(`${API}/login`, {
        email:    loginForm.email.trim(),
        password: loginForm.password,
      });
      await enterApp(r.data);
    } catch (err) {
      setLoginError(
        err.response?.status === 401
          ? 'Incorrect password. Please try again.'
          : 'Login failed. Please try again.'
      );
    } finally {
      setLoginLoading(false);
    }
  };

  // ── Signup ─────────────────────────────────────────────────────────────────
  const handleSignup = async (e) => {
    e.preventDefault();
    if (signupForm.password !== signupForm.confirm) {
      setSignupError('Passwords do not match.');
      return;
    }
    setSignupLoading(true);
    setSignupError('');
    try {
      // register
      await axios.post(`${API}/signup`, {
        name:     signupForm.name.trim(),
        email:    signupForm.email.trim(),
        password: signupForm.password,
      });
      // auto-login with the new account's credentials
      const loginRes = await axios.post(`${API}/login`, {
        email:    signupForm.email.trim(),
        password: signupForm.password,
      });
      await enterApp(loginRes.data);
    } catch (err) {
      if (err.response?.status === 409) {
        setSignupError('An account with that email already exists.');
      } else {
        setSignupError('Sign up failed. Please try again.');
      }
    } finally {
      setSignupLoading(false);
    }
  };

  // shared: load user data and enter the main app
  const enterApp = async (user) => {
    setLoggedInUser(user);
    const historyRes = await axios.get(`${API}/routes/history/${user.userId}`);
    setHistory(historyRes.data);
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    setLoginForm({ email: '', password: '' });
    setSignupForm({ name: '', email: '', password: '', confirm: '' });
    setLoginError('');
    setSignupError('');
    setForm({ vehicleName: '', fuelType: 'petrol', origin: '', destination: '' });
    setResult(null);
    setHistory([]);
    setError('');
    setView('login');
  };

  // ── Render: Login ──────────────────────────────────────────────────────────
  if (!loggedInUser && view === 'login') {
    return (
      <LoginForm
          loginForm={loginForm}
          setLoginForm={setLoginForm}
          loginError={loginError}
          loginLoading={loginLoading}
          onSubmit={handleLogin}
          onSwitchView={switchView}
      />
    );
  }

  // ── Render: Signup ─────────────────────────────────────────────────────────
  if (!loggedInUser && view === 'signup') {
    return (
      <SignupForm
          signupForm={signupForm}
          setSignupForm={setSignupForm}
          signupError={signupError}
          signupLoading={signupLoading}
          onSubmit={handleSignup}
          onSwitchView={switchView}
      />
    );
  }

  // ── Render: Main app ───────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#f5f7f6', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: 700, margin: '0 auto', fontFamily: 'sans-serif', padding: '2rem 1rem' }}>
        <AppHeader userName={loggedInUser.name} onLogout={handleLogout} />

        <RouteForm form={form} setForm={setForm} loading={loading} onSubmit={handleSubmit} />

        {error && <p style={errStyle}>{error}</p>}

        <ResultCard result={result} />

        <PublicTransitCard
            transit={transitResult}
            drivingCo2={result?.co2EmittedKg}
        />

        <HistoryTable history={history} />
      </div>
    </div>

  );
}