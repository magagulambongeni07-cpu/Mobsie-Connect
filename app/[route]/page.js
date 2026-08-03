import AppShell from '@/components/AppShell';

// One static page per Control Centre route (required for `output: 'export'`).
export const ROUTES = [
  'dashboard',
  'schools', 'branches',
  'applications', 'interviews', 'waiting-list',
  'learners', 'parents', 'teachers',
  'daily-activity', 'attendance', 'homework', 'reports', 'calendar',
  'payments', 'invoices', 'statements', 'discounts',
  'messages', 'newsletters', 'push', 'sms', 'campaigns', 'feedback',
  'gallery', 'media',
  'products', 'orders', 'inventory',
  'analytics', 'documents', 'support',
  'users', 'roles',
  'audit', 'settings',
];

export function generateStaticParams() {
  return ROUTES.map((route) => ({ route }));
}

export const dynamicParams = false;

export default function RoutePage({ params }) {
  return <AppShell route={params.route} />;
}
