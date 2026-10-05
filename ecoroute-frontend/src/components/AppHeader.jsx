import React from 'react';
import { logoutBtn } from '../styles';

export default function AppHeader({ userName, onLogout }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottom: '1px solid #2a3230' }}>
      <h1 style={{ color: '#2bb88a', margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: 'normal' }}>EcoTrac — Route Optimizer</h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 14, color: '#9aa8a4' }}>
          Logged in as <strong>{userName}</strong>
        </span>
        <button onClick={onLogout} style={logoutBtn}>Logout</button>
      </div>
    </div>
  );
}