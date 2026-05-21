export const visualSmokeRoutes = [
  { name: 'index', route: '/' },
  { name: 'onboarding', route: '/onboarding' },
  { name: 'home', route: '/home' },
  { name: 'learn', route: '/learn' },
  { name: 'practice', route: '/practice' },
  { name: 'exam', route: '/exam' },
  { name: 'mistakes', route: '/mistakes' },
  { name: 'profile', route: '/profile' },
  { name: 'settings', route: '/settings' },
  { name: 'chapter-ch01', route: '/chapter/ch01' },
  { name: 'disclaimer', route: '/disclaimer' },
  { name: 'privacy', route: '/privacy' },
  { name: 'terms', route: '/terms' },
  { name: 'sources', route: '/sources' },
  { name: 'support', route: '/support' },
] as const;

export const visualSmokeDuplicateScreenshotExplanations = [
  {
    names: ['home', 'index'],
    reason: 'The root route is a redirect to /home, so it may match the Home screenshot exactly.',
  },
] as const;
