/** Small inline SVG icon set. Icons are decorative; callers supply accessible labels. */
const paths = {
  speaker:
    'M11 5 6 9H3v6h3l5 4V5Zm4.5 3.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12',
  speakerOff: 'M11 5 6 9H3v6h3l5 4V5Zm5 4 5 6m0-6-5 6',
  stop: 'M7 7h10v10H7z',
  check: 'm5 12.5 4.5 4.5L19 7.5',
  cross: 'M6 6l12 12M18 6 6 18',
  arrowLeft: 'M19 12H5m6-6-6 6 6 6',
  arrowRight: 'M5 12h14m-6-6 6 6-6 6',
  star: 'm12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9L12 3.5Z',
  printer: 'M7 9V4h10v5M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2M7 14h10v6H7z',
  menu: 'M4 7h16M4 12h16M4 17h16',
  book: 'M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15ZM4 20.5A2.5 2.5 0 0 1 6.5 18H20v3H6.5A2.5 2.5 0 0 1 4 20.5Z',
  turtle: 'M4 15c0-4 3.6-7 8-7s8 3 8 7H4Zm16 0 2-1M6 15l-1 3m14-3 1 3M9 15l-.5 3m6.5-3 .5 3',
  info: 'M12 8h.01M11 12h1v5h1M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z',
  lock: 'M7 11V8a5 5 0 0 1 10 0v3M5 11h14v10H5z',
} as const;

export type IconName = keyof typeof paths;

export function Icon({ name, size = 20, filled = false }: { name: IconName; size?: number; filled?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className="icon"
    >
      <path d={paths[name]} />
    </svg>
  );
}
