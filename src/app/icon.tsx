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
          background: '#030712', // Match footer bg-gray-950
          borderRadius: '56px',
        }}
      >
        <span
          style={{
            color: '#FFFFFF', // Match white text
            fontSize: 110,
            fontWeight: 900,
            letterSpacing: '-0.1em',
            marginTop: '8px', 
            marginLeft: '-6px', 
          }}
        >
          CRI.
        </span>
      </div>
    ),
    {
      ...size,
    }
  )
}
