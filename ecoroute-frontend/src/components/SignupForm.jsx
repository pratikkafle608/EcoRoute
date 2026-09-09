import React from 'react';
import { pageWrap, authWrap, brand, subtitle, formCol, input, errStyle, btn, link, footerText } from '../styles';

export default function SignupForm({ signupForm, setSignupForm, signupError, signupLoading, onSubmit, onSwitchView }) {
  return (
    <div style={pageWrap}>
      <div style={authWrap}>
        <h1 style={brand}>EcoTrac</h1>
        <p style={subtitle}>Create your account</p>

        <form onSubmit={onSubmit} style={formCol}>
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
          <span style={link} onClick={() => onSwitchView('login')}>Login</span>
        </p>
      </div>
    </div>
  );
}