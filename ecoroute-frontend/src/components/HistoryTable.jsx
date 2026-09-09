import React from 'react';
import { th, td } from '../styles';

export default function HistoryTable({ history }) {
  if (history.length === 0) return null;

  return (
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
  );
}