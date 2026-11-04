export const UNIVERSITIES = [
  {
    id: 'covenant',
    name: 'Covenant University',
    domain: '@covenantuniversity.edu.ng',
    active: true,
    badge: '3 Departments Active',
  },
  {
    id: 'achievers',
    name: 'Achievers University',
    domain: '@achievers.edu.ng',
    active: false,
  },
  {
    id: 'abuad',
    name: 'Afe Babalola University',
    domain: '@abuad.edu.ng',
    active: false,
  },
  {
    id: 'abu',
    name: 'Ahmadu Bello University',
    domain: '@abu.edu.ng',
    active: false,
  },
  {
    id: 'babcock',
    name: 'Babcock University',
    domain: '@babcock.edu.ng',
    active: false,
  },
  {
    id: 'bowen',
    name: 'Bowen University',
    domain: '@bowen.edu.ng',
    active: false,
  },
  {
    id: 'landmark',
    name: 'Landmark University',
    domain: '@lmu.edu.ng',
    active: false,
  },
  {
    id: 'pau',
    name: 'Pan-Atlantic University',
    domain: '@pau.edu.ng',
    active: false,
  },
  {
    id: 'redeemers',
    name: "Redeemer's University",
    domain: '@run.edu.ng',
    active: false,
  },
  {
    id: 'unilag',
    name: 'University of Lagos',
    domain: '@unilag.edu.ng',
    active: false,
  },
];

export const COVENANT_DEPARTMENTS = [
  {
    id: 'nesa',
    name: 'Economics (NESA)',
    shortCode: 'NESA',
    associationName: 'Nigerian Economic Students Association',
    hubName: 'STUVIA Eco Hub',
    description: 'Pay NESA dues, download verified receipts, donate to Love Foundation & share feedback.',
    color: 'emerald',
    logoUrl: 'https://media.base44.com/images/public/6998637834968a098c6b2721/84f11a8f1_ChatGPTImageSep17202612_24_39PM.png',
    isReady: true,
  },
  {
    id: 'nuasa',
    name: 'Accounting (NUASA)',
    shortCode: 'NUASA',
    associationName: 'Nigerian Universities Accounting Students Association',
    hubName: 'NUASA Portal',
    description: 'Departmental dues collection, automated receipts, and executive portal for Accounting students.',
    color: 'blue',
    logoUrl: null,
    isReady: false,
  },
  {
    id: 'cupsa',
    name: 'Psychology (CUPSA)',
    shortCode: 'CUPSA',
    associationName: 'Covenant University Psychology Students Association',
    hubName: 'CUPSA Portal',
    description: 'Departmental dues collection, automated receipts, and welfare hub for Psychology students.',
    color: 'purple',
    logoUrl: null,
    isReady: false,
  },
];

export const STORAGE_KEYS = {
  USER: 'stuvia_gateway_user',
  UNIVERSITY: 'stuvia_selected_university',
  DEPARTMENT: 'stuvia_selected_department',
  ACCOUNTS: 'stuvia_registered_accounts',
};