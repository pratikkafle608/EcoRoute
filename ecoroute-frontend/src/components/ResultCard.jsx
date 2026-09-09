import React from 'react';

export default function ResultCard({ result }) {
  if (!result) return null;

  return (
    <div style={{ marginTop: 24, padding: 16, border: '1px solid #9FE1CB', borderRadius: 8, background: '#E1F5EE' }}>
      <h3 style={{ margin: '0 0 8px', color: '#085041' }}>Result</h3>
      <p><strong>Distance:</strong> {result.distanceKm.toFixed(1)} km</p>
      <p><strong>CO₂ emitted:</strong> {result.co2EmittedKg.toFixed(2)} kg</p>
      <p><strong>Fuel type:</strong> {result.fuelType}</p>
      <p style={{ marginTop: 10, fontStyle: 'italic', color: '#0F6E56' }}>{result.recommendation}</p>
    </div>
  );
}