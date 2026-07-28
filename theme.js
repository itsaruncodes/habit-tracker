// Shared design tokens — change values here to re-theme the whole app.
export const colors = {
  bg: '#F7F8FC',
  surface: '#FFFFFF',
  border: '#E7E9F3',
  primary: '#4F46E5',
  primaryDark: '#3730A3',
  primarySoft: '#EEEDFC',
  text: '#14161F',
  textMuted: '#6B7280',
  textFaint: '#9CA3AF',
  streak: '#F59E0B',
  streakSoft: '#FEF3E2',
  danger: '#E5484D',
  dangerSoft: '#FCE9E9',
  success: '#12B76A',
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const radius = { sm: 8, md: 12, lg: 18, pill: 999 };

export const type = {
  h1: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  h2: { fontSize: 20, fontWeight: '700', letterSpacing: -0.3 },
  body: { fontSize: 15, fontWeight: '500' },
  label: { fontSize: 13, fontWeight: '600' },
  caption: { fontSize: 12, fontWeight: '500' },
};

export const shadow = {
  card: {
    shadowColor: '#1A1B41',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
};
