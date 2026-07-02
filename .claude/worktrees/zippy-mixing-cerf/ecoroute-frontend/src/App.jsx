import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = 'http://localhost:8080/api';

export default function App() {
  const [view,         setView]         = useState('login');
  const [users,        setUsers]        = useState([]);
  const [loggedInUser, setLoggedInUser] = useState(null);

  const [loginForm,    setLoginForm]    = useState({ userId: '', password: '' });
  const [loginError,   setLoginError]   = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [signupForm,    setSignupForm]    = useState({ name: '', email: '', password: '', confirm: '' });
  const [signupError,   setSignupError]   = useState('');
  const [signupLoading, setSignupLoading] = useState(false);

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

  const handleSignup = async (e) => {
    e.preventDefault();
    if (signupForm.password !== signupForm.confirm) {
      setSignupError('Passwords do not match.');
      return;
    }
    setSignupLoading(true);
    setSignupError('');
    try {
      await axios.post(`${API}/signup`, {
        name:     signupForm.name.trim(),
        email:    signupForm.email.trim(),
        password: signupForm.password,
      });
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
      setSignupError(
        err.response?.status === 409
          ? 'An account with that email already exists.'
          : 'Sign up failed. Please try again.'
      );
    } finally {
      setSignupLoading(false);
    }
  };

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

  // ── Login ──────────────────────────────────────────────────────────────────
  if (!loggedInUser && view === 'login') {
    return (
      <div style={pageWrap}>
        <div style={card}>

          <div style={cardHeader}>
            <div style={logo}>🌿</div>
            <h1 style={title}>EcoTrac</h1>
            <p style={subtitle}>Sign in to your account</p>
          </div>

          <form onSubmit={handleLogin} style={formCol}>
            <div style={fieldGroup}>
              <label style={label}>Account</label>
              <select
                value={loginForm.userId}
                onChange={e => setLoginForm(f => ({ ...f, userId: e.target.value, password: '' }))}
                style={input}
                required
              >
                <option value="">Select your name</option>
                {users.map(u => <option key={u.userId} value={u.userId}>{u.name}</option>)}
              </select>
            </div>

            <div style={fieldGroup}>
              <label style={label}>Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={loginForm.password}
                onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                style={input}
                required
              />
            </div>

            {loginError && <div style={errorBox}>{loginError}</div>}

            <button
              type="submit"
              disabled={loginLoading || !loginForm.userId}
              style={{ ...btn, opacity: (loginLoading || !loginForm.userId) ? 0.6 : 1 }}
            >
              {loginLoading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p style={footerText}>
            Don't have an account?{' '}
            <span style={linkStyle} onClick={() => switchView('signup')}>Create one</span>
          </p>
        </div>
      </div>
    );
  }

  // ── Signup ─────────────────────────────────────────────────────────────────
  if (!loggedInUser && view === 'signup') {
    return (
      <div style={pageWrap}>
        <div style={card}>

          <div style={cardHeader}>
            <div style={logo}>🌿</div>
            <h1 style={title}>EcoTrac</h1>
            <p style={subtitle}>Create your account</p>
          </div>

          <form onSubmit={handleSignup} style={formCol}>
            <div style={fieldGroup}>
              <label style={label}>Full name</label>
              <input
                type="text"
                placeholder="Your name"
                value={signupForm.name}
                onChange={e => setSignupForm(f => ({ ...f, name: e.target.value }))}
                style={input}
                required
              />
            </div>

            <div style={fieldGroup}>
              <label style={label}>Email address</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={signupForm.email}
                onChange={e => setSignupForm(f => ({ ...f, email: e.target.value }))}
                style={input}
                required
              />
            </div>

            <div style={fieldGroup}>
              <label style={label}>Password</label>
              <input
                type="password"
                placeholder="Choose a password"
                value={signupForm.password}
                onChange={e => setSignupForm(f => ({ ...f, password: e.target.value }))}
                style={input}
                required
              />
            </div>

            <div style={fieldGroup}>
              <label style={label}>Confirm password</label>
              <input
                type="password"
                placeholder="Repeat your password"
                value={signupForm.confirm}
                onChange={e => setSignupForm(f => ({ ...f, confirm: e.target.value }))}
                style={input}
                required
              />
            </div>

            {signupError && <div style={errorBox}>{signupError}</div>}

            <button
              type="submit"
              disabled={signupLoading}
              style={{ ...btn, opacity: signupLoading ? 0.6 : 1 }}
            >
              {signupLoading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p style={footerText}>
            Already have an account?{' '}
            <span style={linkStyle} onClick={() => switchView('login')}>Sign in</span>
          </p>
        </div>
      </div>
    );
  }

  // ── Main app ───────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 720, margin: '2rem auto', padding: '0 1.25rem', fontFamily: 'system-ui, sans-serif' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1D9E75', marginBottom: 2 }}>🌿 EcoTrac</h1>
          <p style={{ fontSize: 13, color: '#888' }}>Route Optimizer</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, color: '#555' }}>
            Logged in as <strong style={{ color: '#222' }}>{loggedInUser.name}</strong>
          </span>
          <button onClick={handleLogout} style={logoutBtn}>Logout</button>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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

        <input
          placeholder="Origin (e.g. Dallas, TX)"
          value={form.origin}
          onChange={e => setForm(f => ({ ...f, origin: e.target.value }))}
          style={input}
          required
        />
        <input
          placeholder="Destination (e.g. Austin, TX)"
          value={form.destination}
          onChange={e => setForm(f => ({ ...f, destination: e.target.value }))}
          style={input}
          required
        />

        <button type="submit" disabled={loading} style={{ ...btn, opacity: loading ? 0.6 : 1 }}>
          {loading ? 'Calculating…' : 'Find Eco-Route'}
        </button>
      </form>

      {error && <div style={{ ...errorBox, marginTop: 12 }}>{error}</div>}

      {result && (
        <div style={{ marginTop: 24, padding: '1.25rem', border: '1px solid #9FE1CB', borderRadius: 10, background: '#E9F9F3' }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#085041', marginBottom: 10 }}>Result</h3>
          <p style={{ marginBottom: 6 }}><strong>Distance:</strong> {result.distanceKm.toFixed(1)} km</p>
          <p style={{ marginBottom: 6 }}><strong>CO₂ emitted:</strong> {result.co2EmittedKg.toFixed(2)} kg</p>
          <p style={{ marginBottom: 10 }}><strong>Fuel type:</strong> {result.fuelType}</p>
          <p style={{ fontStyle: 'italic', color: '#0F6E56', fontSize: 14 }}>{result.recommendation}</p>
        </div>
      )}

      {history.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Route history</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={th}>Origin</th>
                <th style={th}>Destination</th>
                <th style={th}>CO₂ (kg)</th>
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

// ── Styles ───────────────────────────────────────────────────────────────────
const pageWrap = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '1rem',
  background: '#f4f6f8',
};

const card = {
  width: '100%',
  maxWidth: 420,
  background: '#fff',
  borderRadius: 14,
  boxShadow: '0 4px 24px rgba(0,0,0,0.09)',
  padding: '2rem 2.25rem',
};

const cardHeader = {
  textAlign: 'center',
  marginBottom: 28,
};

const logo = {
  fontSize: 36,
  marginBottom: 8,
};

const title = {
  fontSize: 26,
  fontWeight: 700,
  color: '#1D9E75',
  marginBottom: 6,
};

const subtitle = {
  fontSize: 14,
  color: '#888',
};

const formCol = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
};

const fieldGroup = {
  display: 'flex',
  flexDirection: 'column',
  gap: 5,
};

const label = {
  fontSize: 13,
  fontWeight: 500,
  color: '#444',
};

const input = {
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #d0d5dd',
  fontSize: 14,
  color: '#222',
  outline: 'none',
  width: '100%',
};

const btn = {
  marginTop: 4,
  padding: '11px',
  background: '#1D9E75',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  fontSize: 15,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'background 0.2s',
};

const errorBox = {
  padding: '10px 14px',
  background: '#fff5f5',
  border: '1px solid #fcc',
  borderRadius: 8,
  color: '#c0392b',
  fontSize: 13,
};

const footerText = {
  marginTop: 22,
  textAlign: 'center',
  fontSize: 13,
  color: '#777',
};

const linkStyle = {
  color: '#1D9E75',
  cursor: 'pointer',
  fontWeight: 500,
  textDecoration: 'underline',
};

const logoutBtn = {
  background: 'none',
  border: '1px solid #ddd',
  padding: '6px 14px',
  borderRadius: 8,
  cursor: 'pointer',
  fontSize: 13,
  color: '#555',
};

const th = { padding: '9px 12px', textAlign: 'left', borderBottom: '2px solid #eee', fontWeight: 600, fontSize: 13 };
const td = { padding: '9px 12px', borderBottom: '1px solid #f0f0f0', fontSize: 14 };
