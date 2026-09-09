import React from 'react';
import { input, optionStyle, btn } from '../styles';

export default function RouteForm({ form, setForm, loading, onSubmit }) {
  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24 }}>
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
  );
}