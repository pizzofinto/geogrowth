import { ImageResponse } from 'next/og'

// Route segment config
export const runtime = 'edge'

// Image metadata
export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      // Immagine modificata per avere uno sfondo e un testo a contrasto.
      <div
        style={{
          fontSize: 24,
          background: '#0a0a0a', // Sfondo scuro
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ededed', // Testo chiaro
          borderRadius: '6px',
        }}
      >
        G
      </div>
    ),
    // Opzioni dell'immagine
    {
      // Per convenienza, stiamo usando le dimensioni definite sopra.
      ...size,
    }
  )
}
