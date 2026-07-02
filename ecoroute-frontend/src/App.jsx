import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = 'http://localhost:8080/api';

export default function App() {
  // auth state
  const [view,         setView]         = useState('login'); // 'login' | 'signup'
  const [users,        setUsers]        = useState([]);
  const [loggedInUser, setLoggedInUser] = useState(null);

  // login form
  const [loginForm,    setLoginForm]    = useState({ userId: '', password: '' });
  const [loginError,   setLoginError]   = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // signup form
  const [signupForm,    setSignupForm]    = useState({ name: '', email: '', password: '', confirm: '' });
  const [signupError,   setSignupError]   = useState('');
  const [signupLoading, setSignupLoading] = useState(false);

  // main app state
  const [vehicles, setVehicles] = useState([]);
  const [form,     setForm]     = useState({ vehicleId: '', origin: '', destination: '' });
  const [result,   setResult]   = useState(null);
  const [history,  setHistory]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  useEffect(() => {
    axios.get(`${API}/users`).then(r => setUsers(r.data));
  }, []);

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
        userId:   parseInt(loginForm.userId),
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
      // refresh user list, then auto-login by finding the new user
      const usersRes = await axios.get(`${API}/users`);
      setUsers(usersRes.data);
      const newUser = usersRes.data.find(u => u.email === signupForm.email.trim());
      if (newUser) {
        const loginRes = await axios.post(`${API}/login`, {
          userId:   newUser.userId,
          password: signupForm.password,
        });
        await enterApp(loginRes.data);
      }
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
    const [vehiclesRes, historyRes] = await Promise.all([
      axios.get(`${API}/vehicles/user/${user.userId}`),
      axios.get(`${API}/routes/history/${user.userId}`),
    ]);
    setVehicles(vehiclesRes.data);
    setHistory(historyRes.data);
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    setLoginForm({ userId: '', password: '' });
    setSignupForm({ name: '', email: '', password: '', confirm: '' });
    setLoginError('');
    setSignupError('');
    setVehicles([]);
    setForm({ vehicleId: '', origin: '', destination: '' });
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
      const r = await axios.post(`${API}/routes/calculate`, {
        userId:      loggedInUser.userId,
        vehicleId:   parseInt(form.vehicleId),
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
        <div style={authWrap}>
          <h1 style={brand}>EcoTrac</h1>
          <p style={{ color: '#555', marginTop: -8, marginBottom: 24 }}>Route Optimizer</p>

          <form onSubmit={handleLogin} style={formCol}>
            <select
                value={loginForm.userId}
                onChange={e => setLoginForm(f => ({ ...f, userId: e.target.value, password: '' }))}
                style={input}
                required
            >
              <option value="">Select your account</option>
              {users.map(u => <option key={u.userId} value={u.userId}>{u.name}</option>)}
            </select>

            <input
                type="password"
                placeholder="Password"
                value={loginForm.password}
                onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                style={input}
                required
            />

            {loginError && <p style={errStyle}>{loginError}</p>}

            <button type="submit" disabled={loginLoading || !loginForm.userId} style={btn}>
              {loginLoading ? 'Logging in…' : 'Login'}
            </button>
          </form>

          <p style={{ marginTop: 16, fontSize: 14, color: '#555' }}>
            Don't have an account?{' '}
            <span style={link} onClick={() => switchView('signup')}>Sign up</span>
          </p>
        </div>
    );
  }

  // ── Render: Signup ─────────────────────────────────────────────────────────
  if (!loggedInUser && view === 'signup') {
    return (
        <div style={authWrap}>
          <h1 style={brand}>EcoTrac</h1>
          <p style={{ color: '#555', marginTop: -8, marginBottom: 24 }}>Create your account</p>

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

          <p style={{ marginTop: 16, fontSize: 14, color: '#555' }}>
            Already have an account?{' '}
            <span style={link} onClick={() => switchView('login')}>Login</span>
          </p>
        </div>
    );
  }

  // ── Render: Main app ───────────────────────────────────────────────────────
  return (
      <div style={{ maxWidth: 700, margin: '2rem auto', fontFamily: 'sans-serif', padding: '0 1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ color: '#1D9E75', margin: 0, fontSize: 20, letterSpacing: 'normal' }}>EcoTrac — Route Optimizer</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 14, color: '#555' }}>
              Logged in as <strong>{loggedInUser.name}</strong>
            </span>
            <button onClick={handleLogout} style={logoutBtn}>Logout</button>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24 }}>
          <select
              value={form.vehicleId}
              onChange={e => setForm(f => ({ ...f, vehicleId: e.target.value }))}
              style={input}
              required
          >
            <option value="">Select vehicle</option>
            {vehicles.map(v => (
                <option key={v.vehicleId} value={v.vehicleId}>
                  {v.modelType} ({v.fuelType})
                </option>
            ))}
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
              <h3>Route history</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                <tr style={{ background: '#f5f5f5' }}>
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
        )}
      </div>
  );
}

// ── Shared styles ────────────────────────────────────────────────────────────
const authWrap = {
  maxWidth: 380, margin: '4rem auto', fontFamily: 'sans-serif',
  padding: '2rem', border: '1px solid #ddd', borderRadius: 12,
  boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
};
const brand   = { color: '#1D9E75', margin: 0, textAlign: 'center', fontSize: 28, letterSpacing: 'normal' };
const formCol = { display: 'flex', flexDirection: 'column', gap: 12 };
const input   = { padding: '10px 12px', borderRadius: 6, border: '1px solid #ccc', fontSize: 14 };
const btn     = { background: '#1D9E75', color: '#fff', border: 'none', padding: '10px', borderRadius: 6, cursor: 'pointer', fontSize: 14 };
const errStyle = { color: 'red', margin: 0, fontSize: 13 };
const link    = { color: '#1D9E75', cursor: 'pointer', textDecoration: 'underline' };
const logoutBtn = { background: 'none', border: '1px solid #ccc', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 13 };
const th      = { padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #ddd' };
const td      = { padding: '8px 12px', borderBottom: '1px solid #eee' };
