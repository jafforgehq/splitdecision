import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'SplitDecision — AI-powered debate tool';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'radial-gradient(ellipse at center, #1a1a2e 0%, #0a0a0f 70%)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Top accent line */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, transparent, #f59e0b, transparent)',
          }}
        />

        {/* VS matchup row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '40px',
            marginBottom: '40px',
          }}
        >
          <div
            style={{
              fontSize: '64px',
              fontWeight: 900,
              color: '#ffffff',
              textAlign: 'right',
              maxWidth: '360px',
            }}
          >
            Option A
          </div>

          <div
            style={{
              fontSize: '96px',
              fontWeight: 900,
              color: '#f59e0b',
              textShadow: '0 0 40px rgba(245,158,11,0.6), 0 0 80px rgba(245,158,11,0.3)',
            }}
          >
            VS
          </div>

          <div
            style={{
              fontSize: '64px',
              fontWeight: 900,
              color: '#ffffff',
              textAlign: 'left',
              maxWidth: '360px',
            }}
          >
            Option B
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: '48px',
            fontWeight: 900,
            color: '#ffffff',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <span>SplitDecision</span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: '24px',
            color: '#a1a1aa',
            marginBottom: '32px',
          }}
        >
          AI agents debate so you don't have to
        </div>

        {/* Agent pills row */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
          }}
        >
          {[
            { name: 'The Analyst', color: '#3b82f6' },
            { name: 'The Contrarian', color: '#ef4444' },
            { name: 'The Pragmatist', color: '#22c55e' },
            { name: 'The Wildcard', color: '#a855f7' },
          ].map((agent) => (
            <div
              key={agent.name}
              style={{
                display: 'flex',
                padding: '8px 20px',
                borderRadius: '999px',
                fontSize: '18px',
                fontWeight: 600,
                color: agent.color,
                border: `2px solid ${agent.color}33`,
                background: `${agent.color}15`,
              }}
            >
              {agent.name}
            </div>
          ))}
        </div>

        {/* Bottom accent line */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, transparent, #f59e0b, transparent)',
          }}
        />
      </div>
    ),
    { ...size },
  );
}
