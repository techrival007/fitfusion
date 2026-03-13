// Geometric SVG decorative patterns for the blueprint aesthetic
export function GridPattern({ size = 10 }) {
  return (
    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id={`grid-${size}`} width={size} height={size} patternUnits="userSpaceOnUse">
          <path d={`M ${size} 0 L 0 0 0 ${size}`} fill="none" stroke="#111827" strokeWidth="0.3" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#grid-${size})`} />
    </svg>
  )
}

export function ConcentricCircles() {
  return (
    <svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      {[20, 40, 60, 80, 100].map(r => (
        <circle key={r} cx="100" cy="100" r={r} fill="none" stroke="#111827" strokeWidth="0.4" />
      ))}
      <line x1="100" y1="0" x2="100" y2="200" stroke="#111827" strokeWidth="0.3" />
      <line x1="0" y1="100" x2="200" y2="100" stroke="#111827" strokeWidth="0.3" />
    </svg>
  )
}

export function IsometricTriangles() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <polygon points="100,20 180,160 20,160" fill="none" stroke="#111827" strokeWidth="0.4" />
      <polygon points="100,50 160,150 40,150" fill="none" stroke="#111827" strokeWidth="0.3" />
      <polygon points="100,80 140,140 60,140" fill="none" stroke="#111827" strokeWidth="0.2" />
      <line x1="100" y1="20" x2="100" y2="160" stroke="#111827" strokeWidth="0.3" />
    </svg>
  )
}

export function CrossMatrix() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      {Array.from({ length: 5 }, (_, row) =>
        Array.from({ length: 5 }, (_, col) => {
          const x = 20 + col * 40
          const y = 20 + row * 40
          return (
            <g key={`${row}-${col}`}>
              <line x1={x - 8} y1={y} x2={x + 8} y2={y} stroke="#111827" strokeWidth="0.4" />
              <line x1={x} y1={y - 8} x2={x} y2={y + 8} stroke="#111827" strokeWidth="0.4" />
            </g>
          )
        })
      )}
    </svg>
  )
}

export function RadialMesh() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      {Array.from({ length: 12 }, (_, i) => {
        const angle = (i / 12) * Math.PI * 2
        const x2 = 100 + 90 * Math.cos(angle)
        const y2 = 100 + 90 * Math.sin(angle)
        return <line key={i} x1="100" y1="100" x2={x2} y2={y2} stroke="#111827" strokeWidth="0.3" />
      })}
      {[30, 60, 90].map(r => (
        <circle key={r} cx="100" cy="100" r={r} fill="none" stroke="#111827" strokeWidth="0.3" />
      ))}
    </svg>
  )
}
