import React from 'react';
import { pageWrap, authWrap, brand, subtitle, formCol, input, errStyle, btn, link, footerText } from '../styles';

export default function LoginForm({ loginForm, setLoginForm, loginError, loginLoading, onSubmit, onSwitchView }) {
  return (
    <div style={pageWrap}>
      <div style={authWrap}>
        <h1 style={brand}>EcoTrac</h1>
        <p style={subtitle}>Route Optimizer</p>

        <form onSubmit={onSubmit} style={formCol}>
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
          <span style={link} onClick={() => onSwitchView('signup')}>Sign up</span>
        </p>
      </div>
    </div>
  );
}