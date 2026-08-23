export type RiskStatus = 'Safe' | 'Review' | 'High Risk'

export type Transaction = {
  id: string
  customer: string
  amount: number
  channel: string
  score: number
  status: RiskStatus
  time: string
  signal: string
}

export const transactions: Transaction[] = [
  {
    id: 'RS-18422',
    customer: 'A. Patel',
    amount: 89,
    channel: 'Web',
    score: 12,
    status: 'Safe',
    time: '2 min ago',
    signal: 'Known device',
  },
  {
    id: 'RS-18421',
    customer: 'M. Chen',
    amount: 412,
    channel: 'App',
    score: 61,
    status: 'Review',
    time: '6 min ago',
    signal: 'New device · rush ship',
  },
  {
    id: 'RS-18418',
    customer: 'L. Gomez',
    amount: 1240,
    channel: 'Web',
    score: 91,
    status: 'High Risk',
    time: '11 min ago',
    signal: 'Card testing pattern',
  },
  {
    id: 'RS-18414',
    customer: 'S. Okonkwo',
    amount: 56,
    channel: 'POS',
    score: 8,
    status: 'Safe',
    time: '18 min ago',
    signal: 'Repeat customer',
  },
  {
    id: 'RS-18409',
    customer: 'R. Singh',
    amount: 278,
    channel: 'Web',
    score: 54,
    status: 'Review',
    time: '27 min ago',
    signal: 'Mismatched AVS',
  },
  {
    id: 'RS-18403',
    customer: 'J. Hale',
    amount: 1890,
    channel: 'App',
    score: 87,
    status: 'High Risk',
    time: '41 min ago',
    signal: 'High-ticket first order',
  },
  {
    id: 'RS-18397',
    customer: 'E. Rossi',
    amount: 134,
    channel: 'Web',
    score: 19,
    status: 'Safe',
    time: '1 hr ago',
    signal: 'Delivery match',
  },
  {
    id: 'RS-18391',
    customer: 'K. Berg',
    amount: 320,
    channel: 'Returns',
    score: 72,
    status: 'Review',
    time: '1 hr ago',
    signal: 'Serial refunder',
  },
]

export const trendDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export const trendSeries = {
  safe: [820, 860, 790, 910, 940, 705, 1102],
  review: [90, 110, 128, 102, 96, 84, 128],
  high: [42, 38, 55, 47, 40, 33, 54],
}
