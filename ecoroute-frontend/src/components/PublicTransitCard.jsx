import React from 'react';

export default function PublicTransitCard({ transit, drivingCo2 }) {
    if (!transit) return null;

    const {
        bestOption = 'Regional Transit',
        transitCo2Kg = 0,
        savedCo2Kg = 0,
        savingsPercent = 0,
        estimatedTime = 'N/A',
        transfers = 0,
    } = transit;

    return (
        <div style={transitCardStyle}>
            <div style={headerStyle}>
                <h3 style={titleStyle}>🌱 Recommended Public Transit Route</h3>
                <span style={badgeStyle}>
          {savingsPercent > 0 ? `${savingsPercent}% Less CO₂` : 'Low Emission'}
        </span>
            </div>

            <div style={gridStyle}>
                <div><strong>Option:</strong> {bestOption}</div>
                <div><strong>Est. Time:</strong> {estimatedTime}</div>
                <div><strong>Transit CO₂:</strong> {transitCo2Kg?.toFixed(2)} kg</div>
                <div><strong>Transfers:</strong> {transfers}</div>
            </div>

            {savedCo2Kg > 0 && (
                <div style={savingsBannerStyle}>
                    💡 Taking public transit saves <strong>{savedCo2Kg.toFixed(2)} kg of CO₂</strong> compared to driving ({drivingCo2?.toFixed(2)} kg).
                </div>
            )}
        </div>
    );
}

// ── Shared Styles ─────────────────────────────────────────────────────────────
const transitCardStyle = {
    marginTop: '16px',
    padding: '16px',
    border: '1px solid #1f5e4c',
    borderRadius: '8px',
    background: '#12302a',
    fontFamily: 'sans-serif',
};

const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
};

const titleStyle = {
    margin: 0,
    color: '#7fe0bf',
    fontSize: '16px',
};

const badgeStyle = {
    background: '#1D9E75',
    color: '#fff',
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 600,
};

const gridStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
    fontSize: '14px',
    color: '#d6efe6',
};

const savingsBannerStyle = {
    marginTop: '12px',
    padding: '10px',
    background: '#0d241f',
    borderRadius: '6px',
    fontSize: '13px',
    color: '#a8ecd4',
};