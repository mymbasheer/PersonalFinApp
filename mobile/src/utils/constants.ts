// mobile/src/utils/constants.ts
export const COLORS = {
  bg:      '#060D1A',
  card:    '#0D1929',
  el:      '#111F33',
  border:  '#1A2D47',
  gold:    '#D4A843',
  teal:    '#1DB8A8',
  red:     '#E05252',
  green:   '#27AE60',
  blue:    '#3A8DDE',
  purple:  '#8B5CF6',
  orange:  '#F59E0B',
  pink:    '#EC4899',
  text:    '#E8F0FD',
  soft:    '#7A9CC4',
  muted:   '#3D5A7A',
  white:   '#FFFFFF',
};

export const FONTS = {
  regular:   'DMSans-Regular',
  medium:    'DMSans-Medium',
  semiBold:  'DMSans-SemiBold',
  bold:      'DMSans-Bold',
  mono:      'JetBrainsMono-Regular',
  monoBold:  'JetBrainsMono-SemiBold',
  display:   'CormorantGaramond-Bold',
};

export const SPACING = { xs:4, sm:8, md:12, lg:16, xl:20, xxl:28 };
export const RADIUS  = { sm:8, md:12, lg:16, xl:20 };

export const API_BASE = 'http://10.0.2.2:3000'; // Android emulator → localhost
// For real device: 'http://YOUR_PC_IP:3000'

export const EXPENSE_CATEGORIES = [
  { id: 'housing',   label: 'Housing / Rent',   icon: '🏠', color: '#3A8DDE' },
  { id: 'food',      label: 'Food & Groceries',  icon: '🍛', color: '#F59E0B' },
  { id: 'transport', label: 'Transport',          icon: '🚗', color: '#1DB8A8' },
  { id: 'utilities', label: 'Utilities',          icon: '⚡', color: '#8B5CF6' },
  { id: 'education', label: 'Education',          icon: '📚', color: '#D4A843' },
  { id: 'health',    label: 'Healthcare',         icon: '🏥', color: '#27AE60' },
  { id: 'shopping',  label: 'Shopping',           icon: '🛍', color: '#E05252' },
  { id: 'telecom',   label: 'Telecom',            icon: '📱', color: '#06B6D4' },
  { id: 'insurance', label: 'Insurance',          icon: '🛡', color: '#8B5CF6' },
  { id: 'dining',    label: 'Dining Out',         icon: '🍽', color: '#F97316' },
  { id: 'dana',      label: 'Dana / Donations',   icon: '🙏', color: '#84CC16' },
  { id: 'other',     label: 'Other',              icon: '📦', color: '#3D5A7A' },
];

export const TAX_SLABS_2025 = [
  { from: 0,         to: 1_800_000,  rate: 0  },
  { from: 1_800_000, to: 2_800_000,  rate: 6  },
  { from: 2_800_000, to: 3_800_000,  rate: 12 },
  { from: 3_800_000, to: 5_800_000,  rate: 18 },
  { from: 5_800_000, to: 7_800_000,  rate: 24 },
  { from: 7_800_000, to: Infinity,   rate: 30 },
];

export const DISTRICTS = ['Colombo','Gampaha','Kalutara','Kandy','Matale','Nuwara Eliya','Galle','Matara','Hambantota','Jaffna','Kilinochchi','Mannar','Vavuniya','Mullaitivu','Batticaloa','Ampara','Trincomalee','Kurunegala','Puttalam','Anuradhapura','Polonnaruwa','Badulla','Monaragala','Ratnapura','Kegalle'];
export const OCCUPATIONS = ['Salaried – Private Sector','Salaried – Government','Self-Employed / Freelancer','Business Owner','Professional (Doctor/Lawyer/Engineer)','Retired','Student','Other'];
export const PAYMENT_METHODS = ['Cash','HNB','Sampath','BOC','Commercial','NSB',"People's",'Seylan','NDB','eZ Cash','mCash','Genie','FriMi','LankaPay','Visa/MC','Amex'];
export const CEB_SLABS_SINGLE = [
  { max: 30,  rate: 4.00,  fixed: 300  },
  { max: 60,  rate: 7.85,  fixed: 600  },
  { max: 90,  rate: 10.50, fixed: 900  },
  { max: 120, rate: 17.50, fixed: 1200 },
  { max: 180, rate: 22.00, fixed: 1500 },
  { max: 999, rate: 26.00, fixed: 1800 },
];
export const GOLD_KARAT = { '24K':1, '22K':0.9167, '21K':0.875, '18K':0.75, '14K':0.585, '9K':0.375 };
