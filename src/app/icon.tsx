import { ImageResponse } from 'next/og'

// Image metadata
export const size = {
  width: 64,
  height: 64,
}
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(to bottom right, #2563EB, #4F46E5)',
          borderRadius: '16px',
        }}
      >
        <span
          style={{
            color: 'white',
            fontSize: 26,
            fontWeight: 900,
            letterSpacing: '-0.08em',
            marginTop: '2px', // Subtle vertical optical alignment
          }}
        >
          CRI
        </span>
      </div>
    ),
    {
      ...size,
    }
  )
}
