import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'CRI Global Research Institute';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(to bottom right, #ffffff, #f3f4f6)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#ffffff',
            backgroundImage: 'radial-gradient(circle at 25px 25px, #e5e7eb 2%, transparent 0%), radial-gradient(circle at 75px 75px, #e5e7eb 2%, transparent 0%)',
            backgroundSize: '100px 100px',
            opacity: 0.8,
          }}
        />
        <h1
          style={{
            fontSize: 180,
            fontWeight: 900,
            letterSpacing: '-0.05em',
            margin: 0,
            color: '#111827',
            lineHeight: 1,
            display: 'flex',
          }}
        >
          CRI.
        </h1>
        <p
          style={{
            fontSize: 48,
            fontWeight: 600,
            color: '#4B5563',
            marginTop: 40,
            letterSpacing: '-0.02em',
          }}
        >
          Premium Research Programs for Students
        </p>
      </div>
    ),
    {
      ...size,
    }
  );
}
