export type VisualSmokeRoute = {
  file: string;
  name: string;
  route: string;
};

export const visualSmokeRoutes = [
  { name: 'index', route: '/', file: 'index.png' },
  { name: 'onboarding', route: '/onboarding', file: 'onboarding.png' },
  { name: 'home', route: '/home', file: 'home.png' },
  { name: 'learn', route: '/learn', file: 'learn.png' },
  { name: 'practice', route: '/practice', file: 'practice.png' },
  { name: 'exam', route: '/exam', file: 'exam.png' },
  { name: 'mistakes', route: '/mistakes', file: 'mistakes.png' },
  { name: 'profile', route: '/profile', file: 'profile.png' },
  { name: 'settings', route: '/settings', file: 'settings.png' },
  { name: 'chapter-ch01', route: '/chapter/ch01', file: 'chapter-ch01.png' },
  { name: 'disclaimer', route: '/disclaimer', file: 'disclaimer.png' },
  { name: 'privacy', route: '/privacy', file: 'privacy.png' },
  { name: 'terms', route: '/terms', file: 'terms.png' },
  { name: 'sources', route: '/sources', file: 'sources.png' },
  { name: 'support', route: '/support', file: 'support.png' },
] as const satisfies readonly VisualSmokeRoute[];
