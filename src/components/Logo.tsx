type LogoProps = {
  size?: number
  variant?: 'landing' | 'dash'
}

export default function Logo({ size = 28, variant = 'landing' }: LogoProps) {
  const fill = variant === 'dash' ? '#1D4ED8' : '#0E2A24'
  const stroke = variant === 'dash' ? '#93C5FD' : '#2EE6A8'

  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill={fill} />
      <path
        d="M16 5.5L25 9.2v7.1c0 5.4-3.7 10.2-9 11.5-5.3-1.3-9-6.1-9-11.5V9.2L16 5.5z"
        stroke={stroke}
        strokeWidth="1.4"
      />
      <path
        d="M12.2 16.1l2.4 2.4 5.2-5.4"
        stroke={stroke}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
