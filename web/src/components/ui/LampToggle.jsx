import { useTheme } from '../../context/ThemeContext';

export default function LampToggle() {
  const { dark, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      className="relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 hover:bg-surface-100 dark:hover:bg-[#313244]"
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Light mode' : 'Dark mode'}
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          filter: dark
            ? 'drop-shadow(0 0 6px rgba(250,204,21,0.5))'
            : 'drop-shadow(0 0 3px rgba(148,163,184,0.3))',
          transition: 'filter 0.3s ease',
        }}
      >
        {/* Lamp post */}
        <rect x="11" y="16" width="2" height="5" rx="1" fill="#64748b" />

        {/* Lamp base */}
        <rect x="8" y="20" width="8" height="2" rx="1" fill="#64748b" />

        {/* Lamp shade */}
        <path
          d="M7 10 C7 7 9 5 12 5 C15 5 17 7 17 10 L18 16 L6 16 Z"
          fill={dark ? '#facc15' : '#94a3b8'}
          style={{
            transition: 'fill 0.4s ease',
          }}
        />

        {/* Bulb glow (only visible in dark mode) */}
        {dark && (
          <circle
            cx="12"
            cy="11"
            r="3"
            fill="#fef08a"
            opacity="0.6"
            style={{
              animation: 'twinkle 2s ease-in-out infinite',
            }}
          />
        )}

        {/* Light rays (only in dark mode) */}
        {dark && (
          <>
            <line x1="12" y1="2" x2="12" y2="4" stroke="#facc15" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
            <line x1="4" y1="10" x2="6" y2="10" stroke="#facc15" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
            <line x1="18" y1="10" x2="20" y2="10" stroke="#facc15" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
            <line x1="6" y1="4" x2="7.5" y2="5.5" stroke="#facc15" strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
            <line x1="18" y1="4" x2="16.5" y2="5.5" stroke="#facc15" strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
          </>
        )}
      </svg>
    </button>
  );
}
