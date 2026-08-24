/**
 * Design Tokens & Constants
 * Grounded in awesome-design-md principles: spacing scales, type scales, color systems
 * Locked design direction: Modern SaaS fintech with precision, red-green risk signals
 */

// ============================================================================
// SPACING SCALE (4px baseline grid)
// ============================================================================
export const SPACING = {
  xs: '0.25rem',  // 4px
  sm: '0.5rem',   // 8px
  md: '0.75rem',  // 12px
  lg: '1rem',     // 16px
  xl: '1.5rem',   // 24px
  '2xl': '2rem',  // 32px
  '3xl': '2.5rem', // 40px
  '4xl': '3rem',  // 48px
} as const;

// Section & component padding
export const PADDING = {
  section: 'py-8 px-6',      // Card-like sections
  sectionLarge: 'py-16 px-8', // Between major sections
  compact: 'py-4 px-3',      // Dense data areas
} as const;

// Component gaps
export const GAP = {
  tight: 'gap-1.5',   // 6px - list items
  normal: 'gap-2',    // 8px - form groups
  comfortable: 'gap-4', // 16px - standard grids
  spacious: 'gap-6',  // 24px - section breaks
} as const;

// ============================================================================
// TYPOGRAPHY SCALE (per locked design)
// ============================================================================
export const TYPOGRAPHY = {
  pageTitle: 'text-3xl font-semibold',      // 36px, hero page titles
  sectionHeader: 'text-xl font-semibold',   // 20px, major section headers
  cardTitle: 'text-base font-medium',       // 16px, card/modal titles
  body: 'text-base text-zinc-600 dark:text-zinc-300', // 16px body copy
  small: 'text-sm text-zinc-500 dark:text-zinc-400',  // 14px secondary
  xs: 'text-xs text-zinc-500 dark:text-zinc-500',     // 12px meta/captions
  mono: 'font-mono',                        // Monospace for numbers, codes
  monoBold: 'font-mono font-semibold',      // Bold mono for emphasis
} as const;

// ============================================================================
// COLOR PALETTE (locked design direction)
// ============================================================================
export const COLORS = {
  // Neutrals: Zinc family throughout
  neutral: {
    bg: {
      light: '#fafafa',     // Light mode: minimal background
      dark: '#09090b',      // Dark mode: deepest background
      surface: {
        light: '#ffffff',
        dark: '#18181b',
      },
      hover: {
        light: '#f4f4f5',
        dark: '#27272a',
      },
    },
    text: {
      primary: {
        light: '#18181b',    // WCAG AAA contrast
        dark: '#fafafa',
      },
      secondary: {
        light: '#52525b',
        dark: '#d4d4d8',
      },
      tertiary: {
        light: '#71717a',
        dark: '#a1a1a6',
      },
    },
    border: {
      light: '#e4e4e7',
      dark: '#3f3f46',
    },
  },

  // Risk signals: Red-green binary
  risk: {
    fraud: '#ef4444',      // Red-500: high-risk fraud
    clear: '#22c55e',      // Green-500: low-risk legitimate
    pending: '#f59e0b',    // Amber-500: pending review
  },

  // Accents
  accent: {
    slate: '#64748b',      // Slate-600: secondary actions
  },
} as const;

// ============================================================================
// COMPONENT STYLES (semantic reusable patterns)
// ============================================================================
export const COMPONENTS = {
  button: {
    primary: 'inline-flex items-center justify-center px-4 py-2 rounded-lg bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-950 font-medium hover:opacity-90 active:scale-98 transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed',
    secondary: 'inline-flex items-center justify-center px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500',
    ghost: 'inline-flex items-center justify-center px-3 py-2 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500',
  },

  badge: {
    fraud: 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800',
    clear: 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800',
    pending: 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800',
  },

  card: 'rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md transition-shadow',

  input: 'w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 dark:placeholder-zinc-500 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 focus-visible:border-transparent disabled:bg-zinc-50 dark:disabled:bg-zinc-950 disabled:opacity-50',

  table: {
    headerCell: 'px-4 py-3 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-50 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-700',
    cell: 'px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300 border-b border-zinc-100 dark:border-zinc-800',
    row: 'hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors cursor-pointer',
  },
} as const;

// ============================================================================
// LAYOUT DIMENSIONS (per locked design)
// ============================================================================
export const LAYOUT = {
  navHeight: '72px',       // Top nav height (locked at 72px)
  navHeightMobile: '64px', // Mobile nav (slightly smaller)
  sidebarWidth: '280px',   // Optional left sidebar
  maxContentWidth: '1400px', // Max width for content (max-w-7xl equivalent)
  mobileBreakpoint: 640,   // sm breakpoint
  tabletBreakpoint: 768,   // md breakpoint
  desktopBreakpoint: 1024, // lg breakpoint
} as const;

// ============================================================================
// MOTION & ANIMATION (per MOTION_INTENSITY: 4)
// ============================================================================
// Subtle CSS transitions, state changes only, no parallax/scroll hijacks
export const MOTION = {
  duration: {
    instant: '0.05s',
    fast: '0.15s',
    normal: '0.2s',
    slow: '0.3s',
  },
  easing: {
    default: 'cubic-bezier(0.16, 1, 0.3, 1)',  // Smooth easing
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // Slight spring for affordance
  },
  // Specific transitions
  transitions: {
    stateChange: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)', // Background, colors, opacity
    hover: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',      // Button hover, row hover
    expand: 'max-height 0.3s ease-out',                    // Row expand/collapse
  },
} as const;

// ============================================================================
// ACCESSIBILITY (web-design-guidelines compliance)
// ============================================================================
export const A11Y = {
  // Focus ring for keyboard nav
  focusRing: 'focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500',

  // Focus visible (prefer over :focus to avoid focus on mouse click)
  focusVisible: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',

  // Skip to main content (always provide)
  skipLink: 'sr-only focus-visible:not-sr-only',

  // Reduced motion: disable animations for users with prefers-reduced-motion
  reduceMotion: '@media (prefers-reduced-motion: reduce)',

  // Touch targets: minimum 44x44px (WCAG 2.5.5)
  minTouchTarget: '44px',

  // Table tabular nums: align decimal points in number columns
  tabularnums: 'font-variant-numeric: tabular-nums',
} as const;

// ============================================================================
// RESPONSIVE PATTERNS (web-design-guidelines)
// ============================================================================
export const RESPONSIVE = {
  // Desktop table: wide columns visible
  desktopTable: 'hidden lg:table',

  // Mobile card: single-column, card-row layout
  mobileCard: 'lg:hidden',

  // Safe area insets (notch-aware)
  safeArea: 'env(safe-area-inset-left) env(safe-area-inset-right)',

  // Breakpoints (Tailwind standard)
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
} as const;

// ============================================================================
// API & DATA CONSTANTS
// ============================================================================
export const API = {
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  endpoints: {
    auth: '/api/auth',
    analyst: '/api/analyst',
    admin: '/api/admin',
  },
  timeouts: {
    short: 5000,
    normal: 10000,
    long: 30000,
  },
} as const;

// ============================================================================
// FRAUD DETECTION CONSTANTS
// ============================================================================
export const FRAUD = {
  // Score thresholds for visual indication
  thresholds: {
    clear: 0.3,      // < 0.3 = definitely clear
    caution: 0.7,    // 0.3-0.7 = review needed
    fraud: 0.7,      // >= 0.7 = likely fraud
  },

  // Status labels (matching API)
  statuses: {
    pending: 'pending',
    approved: 'approved',
    rejected: 'rejected',
    quantumPending: 'quantum_pending',
  },

  // Role-based access (analyst vs admin)
  roles: {
    analyst: 'analyst',
    admin: 'admin',
  },
} as const;

export default {
  SPACING,
  PADDING,
  GAP,
  TYPOGRAPHY,
  COLORS,
  COMPONENTS,
  LAYOUT,
  MOTION,
  A11Y,
  RESPONSIVE,
  API,
  FRAUD,
};
