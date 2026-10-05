import React from 'react';
import { th, td } from '../styles';

export default function HistoryTable({ history }) {
  if (history.length === 0) return null;

  return (
    <div style={{ marginTop: 32 }}>
      <h3 style={{ fontSize: 15, fontWeight: 600, color: '#e6ebea', marginBottom: 12 }}>Route history</h3>
      <div style={{ border: '1px solid #2a3230', borderRadius: 10, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, background: '#171d1c' }}>
          <thead>
          <tr style={{ background: '#1c2322' }}>
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