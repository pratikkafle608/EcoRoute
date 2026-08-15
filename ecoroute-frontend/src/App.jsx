import React, { useState } from 'react';
import axios from 'axios';

const API = 'http://localhost:8080/api';

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

  // ── Route calculation ──────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setResult(null);
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
      const h = await axios.get(`${API}/routes/history/${loggedInUser.userId}`);
      setHistory(h.data);
    } catch (err) {
      setError('Calculation failed. Check the console.');
      console.error(err);
    } finally { setLoading(false); }
  };

  // ── Render: Login ──────────────────────────────────────────────────────────
  if (!loggedInUser && view === 'login') {
    return (
      <div style={pageWrap}>
        <div style={authWrap}>
          <h1 style={brand}>EcoTrac</h1>
          <p style={subtitle}>Route Optimizer</p>

          <form onSubmit={handleLogin} style={formCol}>
            <input
                type="email"
                placeholder="Email address"
                value={loginForm.email}
                onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))}
                style={input}
                required
            />

            <input
                type="password"
                placeholder="Password"
                value={loginForm.password}
                onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                style={input}
                required
            />

            {loginError && <p style={errStyle}>{loginError}</p>}

            <button type="submit" disabled={loginLoading || !loginForm.email} style={btn}>
              {loginLoading ? 'Logging in…' : 'Login'}
            </button>
          </form>

          <p style={footerText}>
            Don't have an account?{' '}
            <span style={link} onClick={() => switchView('signup')}>Sign up</span>
          </p>
        </div>
      </div>
    );
  }

  // ── Render: Signup ─────────────────────────────────────────────────────────
  if (!loggedInUser && view === 'signup') {
    return (
      <div style={pageWrap}>
        <div style={authWrap}>
          <h1 style={brand}>EcoTrac</h1>
          <p style={subtitle}>Create your account</p>

          <form onSubmit={handleSignup} style={formCol}>
            <input
                type="text"
                placeholder="Full name"
                value={signupForm.name}
                onChange={e => setSignupForm(f => ({ ...f, name: e.target.value }))}
                style={input}
                required
            />
            <input
                type="email"
                placeholder="Email address"
                value={signupForm.email}
                onChange={e => setSignupForm(f => ({ ...f, email: e.target.value }))}
                style={input}
                required
            />
            <input
                type="password"
                placeholder="Password"
                value={signupForm.password}
                onChange={e => setSignupForm(f => ({ ...f, password: e.target.value }))}
                style={input}
                required
            />
            <input
                type="password"
                placeholder="Confirm password"
                value={signupForm.confirm}
                onChange={e => setSignupForm(f => ({ ...f, confirm: e.target.value }))}
                style={input}
                required
            />

            {signupError && <p style={errStyle}>{signupError}</p>}

            <button type="submit" disabled={signupLoading} style={btn}>
              {signupLoading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p style={footerText}>
            Already have an account?{' '}
            <span style={link} onClick={() => switchView('login')}>Login</span>
          </p>
        </div>
      </div>
    );
  }

  // ── Render: Main app ───────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#f5f7f6', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: 700, margin: '0 auto', fontFamily: 'sans-serif', padding: '2rem 1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottom: '1px solid #e4e7e6' }}>
          <h1 style={{ color: '#1D9E75', margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: 'normal' }}>EcoTrac — Route Optimizer</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 14, color: '#555' }}>
              Logged in as <strong>{loggedInUser.name}</strong>
            </span>
            <button onClick={handleLogout} style={logoutBtn}>Logout</button>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24 }}>
          <input placeholder="Vehicle name (e.g. Honda Civic)"
                 value={form.vehicleName} onChange={e => setForm(f => ({ ...f, vehicleName: e.target.value }))}
                 style={input} required />

          <select
              value={form.fuelType}
              onChange={e => setForm(f => ({ ...f, fuelType: e.target.value }))}
              style={input}
              required
          >
            <option value="petrol" style={optionStyle}>Petrol</option>
            <option value="diesel" style={optionStyle}>Diesel</option>
            <option value="electric" style={optionStyle}>Electric</option>
          </select>

          <input placeholder="Origin (e.g. Dallas, TX)"
                 value={form.origin} onChange={e => setForm(f => ({ ...f, origin: e.target.value }))}
                 style={input} required />
          <input placeholder="Destination (e.g. Austin, TX)"
                 value={form.destination} onChange={e => setForm(f => ({ ...f, destination: e.target.value }))}
                 style={input} required />

          <button type="submit" disabled={loading} style={btn}>
            {loading ? 'Calculating…' : 'Find Eco-Route'}
          </button>
        </form>

        {error && <p style={errStyle}>{error}</p>}

        {result && (
            <div style={{ marginTop: 24, padding: 16, border: '1px solid #9FE1CB', borderRadius: 8, background: '#E1F5EE' }}>
              <h3 style={{ margin: '0 0 8px', color: '#085041' }}>Result</h3>
              <p><strong>Distance:</strong> {result.distanceKm.toFixed(1)} km</p>
              <p><strong>CO₂ emitted:</strong> {result.co2EmittedKg.toFixed(2)} kg</p>
              <p><strong>Fuel type:</strong> {result.fuelType}</p>
              <p style={{ marginTop: 10, fontStyle: 'italic', color: '#0F6E56' }}>{result.recommendation}</p>
            </div>
        )}

        {history.length > 0 && (
            <div style={{ marginTop: 32 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#333', marginBottom: 12 }}>Route history</h3>
              <div style={{ border: '1px solid #e4e7e6', borderRadius: 10, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, background: '#fff' }}>
                  <thead>
                  <tr style={{ background: '#f5f7f6' }}>
                    <th style={th}>Origin</th><th style={th}>Destination</th><th style={th}>CO₂ (kg)</th>
                  </tr>
                  </thead>
                  <tbody>
                  {history.map(r => (
                      <tr key={r.routeId}>
                        <td style={td}>{r.origin}</td>
                        <td style={td}>{r.destination}</td>
                        <td style={td}>{r.co2Emitted?.toFixed(2)}</td>
                      </tr>
                  ))}
                  </tbody>
                </table>
              </div>
            </div>
        )}
      </div>
    </div>
  );
}

// ── Shared styles ────────────────────────────────────────────────────────────
const pageWrap = {
  minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: '#f5f7f6', padding: '1rem', boxSizing: 'border-box',
};
const authWrap = {
  width: '100%', maxWidth: 380, background: '#fff', fontFamily: 'sans-serif',
  padding: '2.25rem 2rem', border: '1px solid #e4e7e6', borderRadius: 14,
  boxShadow: '0 8px 24px rgba(0,0,0,0.07)', boxSizing: 'border-box',
};
const brand    = { color: '#1D9E75', margin: 0, textAlign: 'center', fontSize: 28, fontWeight: 700, letterSpacing: 'normal' };
const subtitle = { color: '#7a8b87', margin: '6px 0 24px', textAlign: 'center', fontSize: 14 };
const formCol  = { display: 'flex', flexDirection: 'column', gap: 12 };
const input    = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #3a413f', fontSize: 14, color: '#fff', background: '#2b2f2e', boxSizing: 'border-box' };
const optionStyle = { color: '#fff', background: '#2b2f2e' };
const btn      = { background: '#1D9E75', color: '#fff', border: 'none', padding: '11px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 };
const errStyle = { color: '#c0392b', margin: 0, fontSize: 13 };
const link     = { color: '#1D9E75', cursor: 'pointer', fontWeight: 500, textDecoration: 'underline' };
const footerText = { marginTop: 20, textAlign: 'center', fontSize: 13, color: '#7a8b87' };
const logoutBtn = { background: 'none', border: '1px solid #d7dbda', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13, color: '#555' };
const th      = { padding: '9px 12px', textAlign: 'left', borderBottom: '2px solid #eee', fontWeight: 600, fontSize: 13, color: '#555' };
const td      = { padding: '8px 12px', borderBottom: '1px solid #eee' };
