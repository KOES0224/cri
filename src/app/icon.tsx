import { ImageResponse } from 'next/og'

// Image metadata
export const size = {
  width: 256,
  height: 256,
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
          borderRadius: '56px',
        }}
      >
        <span
          style={{
            color: 'white',
            fontSize: 140,
            fontWeight: 900,
            letterSpacing: '-0.14em',
            marginTop: '10px', // Optical vertical alignment
            marginLeft: '-8px', // Optical horizontal alignment for tight letter-spacing
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
