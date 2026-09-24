import { duolingo2024, netflix, youtubeKids, spotify, appleMusic, meta, microsoft,openaiChatgpt,figma,firebase,github,framer,google,discord,aliexpress,affinity,antigravityGoogle,aircall,acrobatReader,slack,notion } from '@/assets/images/svg';

export interface Subscription {
  id: string;
  name: string;
  price: number;
  billingDay: number;
  src: any;
  period: 'monthly' | 'yearly';
  plan: string;
  paymentCard: string;
  remindDays: number;
}

export const MOCK_SUBSCRIPTIONS: Subscription[] = [
  {
    id: '1',
    name: 'spotify',
    src: spotify,
    price: 20.00,
    billingDay: 3,
    period: 'monthly',
    plan: 'Plus',
    paymentCard: '4242',
    remindDays: 1,
  },
  {
    id: '2',
    src: duolingo2024,
    name: 'duolingo2024',
    price: 9.00,
    billingDay: 12,
    period: 'yearly',
    plan: 'Pro',
    paymentCard: '5604',
    remindDays: 1,
  },
  {
    id: '3',
    src: netflix,
    name: 'netflix',
    price: 15.49,
    billingDay: 15,
    period: 'monthly',
    plan: 'Standard with Ads',
    paymentCard: '5604',
    remindDays: 1,
  },
  {
    id: '4',
    src: microsoft,
    name: 'microsoft',
    price: 3.49,
    billingDay: 16,
    period: 'monthly',
    plan: 'Pro',
    paymentCard: '4242',
    remindDays: 2,
  },
  {
    id: '5',
    src: appleMusic,
    name: 'appleMusic',
    price: 8.99,
    billingDay: 20,
    period: 'yearly',
    plan: 'Individual',
    paymentCard: '5604',
    remindDays: 1,
  },
  {
    id: '6',
    src: spotify,
    name: 'spotify',
    price: 6.49,
    billingDay: 25,
    period: 'monthly',
    plan: 'Premium Duo',
    paymentCard: '5604',
    remindDays: 1,
  },
  {
    id: '7',
    src: duolingo2024,
    name: 'duolingo2024',
    price: 8.99,
    billingDay: 25,
    period: 'monthly',
    plan: 'Super',
    paymentCard: '4242',
    remindDays: 1,
  },
  {
    id: '8',
    src: youtubeKids,
    name: 'youtubeKids',
    price: 7.99,
    billingDay: 25,
    period: 'monthly',
    plan: 'Premium',
    paymentCard: '5604',
    remindDays: 1,
  },
  {
    id: '9',
    src: meta,
    name: 'meta',
    price: 20.00,
    billingDay: 28,
    period: 'yearly',
    plan: 'Pro',
    paymentCard: '4242',
    remindDays: 1,
  },
  // --- Newly added subscriptions for unused icons ---
  {
    id: '10',
    src: openaiChatgpt,
    name: 'openaiChatgpt',
    price: 20.00,
    billingDay: 1,
    period: 'monthly',
    plan: 'Plus',
    paymentCard: '4242',
    remindDays: 1,
  },
  {
    id: '11',
    src: figma,
    name: 'figma',
    price: 15.00,
    billingDay: 4,
    period: 'monthly',
    plan: 'Professional',
    paymentCard: '5604',
    remindDays: 2,
  },
  {
    id: '12',
    src: firebase,
    name: 'firebase',
    price: 25.00,
    billingDay: 1,
    period: 'monthly',
    plan: 'Blaze Plan',
    paymentCard: '4242',
    remindDays: 3,
  },
  {
    id: '13',
    src: github,
    name: 'github' ,
    price: 4.00,
    billingDay: 7,
    period: 'monthly',
    plan: 'Team',
    paymentCard: '5604',
    remindDays: 1,
  },
  {
    id: '14',
    src: framer,
    name: 'framer',
    price: 19.00,
    billingDay: 8,
    period: 'monthly',
    plan: 'Pro',
    paymentCard: '4242',
    remindDays: 1,
  },
  {
    id: '15',
    src: google,
    name: 'google',
    price: 1.99,
    billingDay: 10,
    period: 'monthly',
    plan: 'Google One 100GB',
    paymentCard: '5604',
    remindDays: 1,
  },
  {
    id: '16',
    src: discord,
    name: 'discord',
    price: 9.99,
    billingDay: 11,
    period: 'monthly',
    plan: 'Nitro',
    paymentCard: '4242',
    remindDays: 1,
  },
  {
    id: '17',
    src: aliexpress,
    name: 'aliexpress',
    price: 5.00,
    billingDay: 14,
    period: 'monthly',
    plan: 'VIP Club',
    paymentCard: '5604',
    remindDays: 1,
  },
  {
    id: '18',
    src: affinity,
    name: 'affinity',
    price: 169.99,
    billingDay: 20,
    period: 'yearly',
    plan: 'Universal License',
    paymentCard: '4242',
    remindDays: 7,
  },
];

export function getMonthlyTotal(subs: Subscription[]): number {
  return subs.reduce((total, sub) => {
    return total + (sub.period === 'monthly' ? sub.price : sub.price / 12);
  }, 0);
}

export function getDayLabel(day: number): string {
  const date = new Date(2024, 9, day);
  const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const monthShort = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  return `${dayNames[date.getDay()]}, ${monthShort[date.getMonth()]} ${day}`;
}

export const MONTH_OFFSET = 1;
export const DAYS_IN_MONTH = 31;
export const MONTH_LABEL = 'October, 2024';