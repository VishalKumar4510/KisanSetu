import {
  User,
  UserRole,
  Farmer,
  Centre,
  CongestionLevel,
  Slot,
  Token,
  Produce,
  ProduceType,
  Procurement,
  ProcurementStatus,
  Payment,
  PaymentStatus,
  Notification,
  NotificationType,
  Weighing,
  QualityCheck,
  AuditLog,
  AnalyticsDataPoint,
  MSP_RATES,
} from '../../../shared/types';

// ==================== HELPERS ====================

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function hoursFromNow(h: number): string {
  const d = new Date();
  d.setHours(d.getHours() + h);
  return d.toISOString();
}

// ==================== DEMO / ADMIN / OFFICER USERS ====================

export const seedUsers: User[] = [
  {
    id: 'user-admin-001',
    name: 'Admin Sharma',
    phone: 'admin1',
    password: 'admin1',
    role: UserRole.ADMIN,
    language: 'en',
    createdAt: daysAgo(180),
  },
  {
    id: 'user-officer-001',
    name: 'Officer Verma',
    phone: 'officer1',
    password: 'officer1',
    role: UserRole.OFFICER,
    language: 'en',
    createdAt: daysAgo(120),
  },
  {
    id: 'user-officer-002',
    name: 'Officer Mishra',
    phone: 'officer2',
    password: 'officer2',
    role: UserRole.OFFICER,
    language: 'hi',
    createdAt: daysAgo(90),
  },
];

// ==================== FARMERS (100+) ====================

const farmerDataList: Array<{
  name: string;
  village: string;
  district: string;
  state: string;
  landArea: number;
  crops: ProduceType[];
  lang: 'en' | 'hi';
}> = [
  { name: 'Rajesh Kumar', village: 'Rampur', district: 'Lucknow', state: 'Uttar Pradesh', landArea: 4.5, crops: [ProduceType.WHEAT, ProduceType.PADDY], lang: 'hi' },
  { name: 'Sita Devi', village: 'Hasanpur', district: 'Lucknow', state: 'Uttar Pradesh', landArea: 2.0, crops: [ProduceType.WHEAT], lang: 'hi' },
  { name: 'Mohan Lal', village: 'Daryabad', district: 'Barabanki', state: 'Uttar Pradesh', landArea: 6.0, crops: [ProduceType.PADDY, ProduceType.MAIZE], lang: 'hi' },
  { name: 'Priya Sharma', village: 'Chinhat', district: 'Lucknow', state: 'Uttar Pradesh', landArea: 3.5, crops: [ProduceType.WHEAT, ProduceType.PULSES], lang: 'hi' },
  { name: 'Ramesh Yadav', village: 'Bakshi Ka Talab', district: 'Lucknow', state: 'Uttar Pradesh', landArea: 5.0, crops: [ProduceType.WHEAT, ProduceType.PADDY], lang: 'hi' },
  { name: 'Geeta Singh', village: 'Malihabad', district: 'Lucknow', state: 'Uttar Pradesh', landArea: 2.5, crops: [ProduceType.PADDY], lang: 'hi' },
  { name: 'Suresh Patel', village: 'Berasia', district: 'Bhopal', state: 'Madhya Pradesh', landArea: 8.0, crops: [ProduceType.WHEAT, ProduceType.PULSES], lang: 'hi' },
  { name: 'Kamla Devi', village: 'Raisen Road', district: 'Bhopal', state: 'Madhya Pradesh', landArea: 3.0, crops: [ProduceType.WHEAT], lang: 'hi' },
  { name: 'Vijay Kumar', village: 'Mandideep', district: 'Raisen', state: 'Madhya Pradesh', landArea: 5.5, crops: [ProduceType.MAIZE, ProduceType.PULSES], lang: 'hi' },
  { name: 'Anita Rai', village: 'Sehore Road', district: 'Bhopal', state: 'Madhya Pradesh', landArea: 4.0, crops: [ProduceType.WHEAT, ProduceType.PADDY], lang: 'hi' },
  { name: 'Ramchandra Tiwari', village: 'Obaidullahganj', district: 'Raisen', state: 'Madhya Pradesh', landArea: 7.0, crops: [ProduceType.WHEAT, ProduceType.MAIZE], lang: 'hi' },
  { name: 'Sunita Verma', village: 'Singrauli', district: 'Singrauli', state: 'Madhya Pradesh', landArea: 2.5, crops: [ProduceType.PADDY], lang: 'hi' },
  { name: 'Ganesh Patil', village: 'Dindori', district: 'Nashik', state: 'Maharashtra', landArea: 3.5, crops: [ProduceType.ONION, ProduceType.WHEAT], lang: 'hi' },
  { name: 'Lata Deshmukh', village: 'Igatpuri', district: 'Nashik', state: 'Maharashtra', landArea: 4.0, crops: [ProduceType.ONION], lang: 'hi' },
  { name: 'Balaji Shinde', village: 'Niphad', district: 'Nashik', state: 'Maharashtra', landArea: 6.0, crops: [ProduceType.ONION, ProduceType.MAIZE], lang: 'hi' },
  { name: 'Meena Jadhav', village: 'Pimpalgaon', district: 'Nashik', state: 'Maharashtra', landArea: 3.0, crops: [ProduceType.ONION, ProduceType.PULSES], lang: 'hi' },
  { name: 'Prakash More', village: 'Satana', district: 'Nashik', state: 'Maharashtra', landArea: 5.0, crops: [ProduceType.ONION, ProduceType.WHEAT], lang: 'hi' },
  { name: 'Bharti Gaikwad', village: 'Sinnar', district: 'Nashik', state: 'Maharashtra', landArea: 2.0, crops: [ProduceType.ONION], lang: 'hi' },
  { name: 'Kishan Meena', village: 'Chomu', district: 'Jaipur', state: 'Rajasthan', landArea: 10.0, crops: [ProduceType.WHEAT, ProduceType.PULSES], lang: 'hi' },
  { name: 'Durga Devi', village: 'Shahpura', district: 'Jaipur', state: 'Rajasthan', landArea: 4.5, crops: [ProduceType.WHEAT], lang: 'hi' },
  { name: 'Hari Singh', village: 'Phagi', district: 'Jaipur', state: 'Rajasthan', landArea: 7.5, crops: [ProduceType.WHEAT, ProduceType.MAIZE], lang: 'hi' },
  { name: 'Parvati Gurjar', village: 'Bassi', district: 'Jaipur', state: 'Rajasthan', landArea: 3.0, crops: [ProduceType.PULSES], lang: 'hi' },
  { name: 'Lakhvir Singh', village: 'Ajnala', district: 'Amritsar', state: 'Punjab', landArea: 12.0, crops: [ProduceType.WHEAT, ProduceType.PADDY], lang: 'hi' },
  { name: 'Gurpreet Kaur', village: 'Ramdas', district: 'Amritsar', state: 'Punjab', landArea: 6.0, crops: [ProduceType.WHEAT, ProduceType.PADDY], lang: 'hi' },
  { name: 'Harjinder Singh', village: 'Tarn Taran', district: 'Tarn Taran', state: 'Punjab', landArea: 9.0, crops: [ProduceType.PADDY, ProduceType.WHEAT], lang: 'hi' },
  { name: 'Jasbir Kaur', village: 'Patti', district: 'Tarn Taran', state: 'Punjab', landArea: 5.0, crops: [ProduceType.WHEAT], lang: 'hi' },
  { name: 'Amarjeet Singh', village: 'Baba Bakala', district: 'Amritsar', state: 'Punjab', landArea: 8.0, crops: [ProduceType.WHEAT, ProduceType.PADDY], lang: 'hi' },
  { name: 'Devendra Mishra', village: 'Mohanlalganj', district: 'Lucknow', state: 'Uttar Pradesh', landArea: 3.5, crops: [ProduceType.WHEAT, ProduceType.PULSES], lang: 'hi' },
  { name: 'Savitri Devi', village: 'Kakori', district: 'Lucknow', state: 'Uttar Pradesh', landArea: 2.0, crops: [ProduceType.PADDY], lang: 'hi' },
  { name: 'Manoj Pandey', village: 'Itaunja', district: 'Lucknow', state: 'Uttar Pradesh', landArea: 6.5, crops: [ProduceType.WHEAT, ProduceType.PADDY, ProduceType.MAIZE], lang: 'hi' },
  { name: 'Renu Singh', village: 'Gosainganj', district: 'Lucknow', state: 'Uttar Pradesh', landArea: 4.0, crops: [ProduceType.WHEAT], lang: 'hi' },
  { name: 'Ashok Chauhan', village: 'Amaniganj', district: 'Faizabad', state: 'Uttar Pradesh', landArea: 5.0, crops: [ProduceType.PADDY, ProduceType.WHEAT], lang: 'hi' },
  { name: 'Rekha Tiwari', village: 'Rudauli', district: 'Faizabad', state: 'Uttar Pradesh', landArea: 3.0, crops: [ProduceType.WHEAT], lang: 'hi' },
  { name: 'Balram Singh', village: 'Salon', district: 'Raebareli', state: 'Uttar Pradesh', landArea: 7.0, crops: [ProduceType.PADDY, ProduceType.MAIZE], lang: 'hi' },
  { name: 'Kusum Devi', village: 'Lalganj', district: 'Raebareli', state: 'Uttar Pradesh', landArea: 2.5, crops: [ProduceType.WHEAT], lang: 'hi' },
  { name: 'Shivraj Patidar', village: 'Hoshangabad Rd', district: 'Bhopal', state: 'Madhya Pradesh', landArea: 9.0, crops: [ProduceType.WHEAT, ProduceType.PULSES, ProduceType.MAIZE], lang: 'hi' },
  { name: 'Nirmala Joshi', village: 'Vidisha Rd', district: 'Bhopal', state: 'Madhya Pradesh', landArea: 4.5, crops: [ProduceType.WHEAT], lang: 'hi' },
  { name: 'Bhupendra Yadav', village: 'Ashta', district: 'Sehore', state: 'Madhya Pradesh', landArea: 6.0, crops: [ProduceType.WHEAT, ProduceType.PULSES], lang: 'hi' },
  { name: 'Chandrakala Bai', village: 'Rehti', district: 'Sehore', state: 'Madhya Pradesh', landArea: 3.0, crops: [ProduceType.PADDY], lang: 'hi' },
  { name: 'Narayan Mhatre', village: 'Ozar', district: 'Nashik', state: 'Maharashtra', landArea: 4.0, crops: [ProduceType.ONION, ProduceType.MAIZE], lang: 'hi' },
  { name: 'Vaishali Pawar', village: 'Yeola', district: 'Nashik', state: 'Maharashtra', landArea: 5.5, crops: [ProduceType.ONION, ProduceType.PULSES], lang: 'hi' },
  { name: 'Sanjay Nikam', village: 'Manmad', district: 'Nashik', state: 'Maharashtra', landArea: 3.0, crops: [ProduceType.ONION], lang: 'hi' },
  { name: 'Kiran Wagh', village: 'Lasalgaon', district: 'Nashik', state: 'Maharashtra', landArea: 7.0, crops: [ProduceType.ONION, ProduceType.WHEAT], lang: 'hi' },
  { name: 'Dashrath Rathore', village: 'Sanganer', district: 'Jaipur', state: 'Rajasthan', landArea: 8.0, crops: [ProduceType.WHEAT, ProduceType.MAIZE], lang: 'hi' },
  { name: 'Shanti Devi', village: 'Amer', district: 'Jaipur', state: 'Rajasthan', landArea: 3.5, crops: [ProduceType.WHEAT, ProduceType.PULSES], lang: 'hi' },
  { name: 'Bhawani Singh', village: 'Chaksu', district: 'Jaipur', state: 'Rajasthan', landArea: 6.0, crops: [ProduceType.WHEAT], lang: 'hi' },
  { name: 'Manjeet Kaur', village: 'Majitha', district: 'Amritsar', state: 'Punjab', landArea: 10.0, crops: [ProduceType.WHEAT, ProduceType.PADDY], lang: 'hi' },
  { name: 'Balwinder Singh', village: 'Lopoke', district: 'Amritsar', state: 'Punjab', landArea: 7.0, crops: [ProduceType.PADDY], lang: 'hi' },
  { name: 'Kulwant Singh', village: 'Verka', district: 'Amritsar', state: 'Punjab', landArea: 8.5, crops: [ProduceType.WHEAT, ProduceType.PADDY], lang: 'hi' },
  { name: 'Paramjit Kaur', village: 'Jandiala', district: 'Amritsar', state: 'Punjab', landArea: 4.0, crops: [ProduceType.WHEAT], lang: 'hi' },
  // More UP farmers
  { name: 'Dinesh Gupta', village: 'Sarojini Nagar', district: 'Lucknow', state: 'Uttar Pradesh', landArea: 3.0, crops: [ProduceType.WHEAT, ProduceType.PADDY], lang: 'hi' },
  { name: 'Sushila Patel', village: 'Aliganj', district: 'Lucknow', state: 'Uttar Pradesh', landArea: 2.0, crops: [ProduceType.WHEAT], lang: 'hi' },
  { name: 'Bhola Nath', village: 'Hardoi Rd', district: 'Lucknow', state: 'Uttar Pradesh', landArea: 5.0, crops: [ProduceType.PADDY, ProduceType.MAIZE], lang: 'hi' },
  { name: 'Rani Devi', village: 'Unnao Rd', district: 'Unnao', state: 'Uttar Pradesh', landArea: 4.0, crops: [ProduceType.WHEAT, ProduceType.PULSES], lang: 'hi' },
  { name: 'Jagdish Prasad', village: 'Sitapur Rd', district: 'Sitapur', state: 'Uttar Pradesh', landArea: 6.0, crops: [ProduceType.PADDY, ProduceType.WHEAT], lang: 'hi' },
  { name: 'Phool Kumari', village: 'Sultanpur Rd', district: 'Sultanpur', state: 'Uttar Pradesh', landArea: 3.5, crops: [ProduceType.WHEAT], lang: 'hi' },
  { name: 'Ram Saran', village: 'Banthra', district: 'Lucknow', state: 'Uttar Pradesh', landArea: 7.0, crops: [ProduceType.WHEAT, ProduceType.PADDY], lang: 'hi' },
  { name: 'Tulsi Devi', village: 'Nagram', district: 'Lucknow', state: 'Uttar Pradesh', landArea: 2.5, crops: [ProduceType.PADDY], lang: 'hi' },
  // More MP farmers
  { name: 'Rajendra Thakur', village: 'Kolar', district: 'Bhopal', state: 'Madhya Pradesh', landArea: 5.0, crops: [ProduceType.WHEAT, ProduceType.PULSES], lang: 'hi' },
  { name: 'Manju Bai', village: 'Fanda', district: 'Bhopal', state: 'Madhya Pradesh', landArea: 3.0, crops: [ProduceType.WHEAT], lang: 'hi' },
  { name: 'Ghanshyam Das', village: 'Bairagarh', district: 'Bhopal', state: 'Madhya Pradesh', landArea: 4.5, crops: [ProduceType.MAIZE, ProduceType.WHEAT], lang: 'hi' },
  { name: 'Leela Bai', village: 'Misrod', district: 'Bhopal', state: 'Madhya Pradesh', landArea: 2.0, crops: [ProduceType.PADDY], lang: 'hi' },
  { name: 'Kailash Prajapati', village: 'Govindpura', district: 'Bhopal', state: 'Madhya Pradesh', landArea: 6.0, crops: [ProduceType.WHEAT, ProduceType.PULSES, ProduceType.MAIZE], lang: 'hi' },
  // More MH farmers
  { name: 'Arun Bhosale', village: 'Malegaon', district: 'Nashik', state: 'Maharashtra', landArea: 4.0, crops: [ProduceType.ONION, ProduceType.WHEAT], lang: 'hi' },
  { name: 'Sunanda Kulkarni', village: 'Kalwan', district: 'Nashik', state: 'Maharashtra', landArea: 3.0, crops: [ProduceType.ONION], lang: 'hi' },
  { name: 'Dattatray Sonawane', village: 'Trimbakeshwar', district: 'Nashik', state: 'Maharashtra', landArea: 5.5, crops: [ProduceType.ONION, ProduceType.MAIZE], lang: 'hi' },
  { name: 'Rekha Ghodke', village: 'Chandwad', district: 'Nashik', state: 'Maharashtra', landArea: 2.5, crops: [ProduceType.ONION], lang: 'hi' },
  // More Rajasthan
  { name: 'Gopal Sharma', village: 'Dudu', district: 'Jaipur', state: 'Rajasthan', landArea: 9.0, crops: [ProduceType.WHEAT, ProduceType.PULSES], lang: 'hi' },
  { name: 'Champa Devi', village: 'Kishangarh', district: 'Ajmer', state: 'Rajasthan', landArea: 5.0, crops: [ProduceType.WHEAT, ProduceType.MAIZE], lang: 'hi' },
  { name: 'Madan Lal Jat', village: 'Kekri', district: 'Ajmer', state: 'Rajasthan', landArea: 7.0, crops: [ProduceType.WHEAT], lang: 'hi' },
  { name: 'Bhanwari Devi', village: 'Pushkar', district: 'Ajmer', state: 'Rajasthan', landArea: 3.0, crops: [ProduceType.PULSES, ProduceType.MAIZE], lang: 'hi' },
  // More Punjab
  { name: 'Sukhdev Singh', village: 'Khadur Sahib', district: 'Tarn Taran', state: 'Punjab', landArea: 11.0, crops: [ProduceType.WHEAT, ProduceType.PADDY], lang: 'hi' },
  { name: 'Ravinder Kaur', village: 'Chabhal', district: 'Amritsar', state: 'Punjab', landArea: 5.0, crops: [ProduceType.PADDY], lang: 'hi' },
  { name: 'Joginder Singh', village: 'Fatehgarh Churian', district: 'Gurdaspur', state: 'Punjab', landArea: 8.0, crops: [ProduceType.WHEAT, ProduceType.PADDY], lang: 'hi' },
  { name: 'Gurmeet Kaur', village: 'Batala', district: 'Gurdaspur', state: 'Punjab', landArea: 4.5, crops: [ProduceType.WHEAT], lang: 'hi' },
  // Additional diverse farmers
  { name: 'Satpal Singh', village: 'Dera Baba Nanak', district: 'Gurdaspur', state: 'Punjab', landArea: 6.0, crops: [ProduceType.WHEAT, ProduceType.PADDY], lang: 'hi' },
  { name: 'Trilok Chand', village: 'Madhogarh', district: 'Jalaun', state: 'Uttar Pradesh', landArea: 5.0, crops: [ProduceType.WHEAT, ProduceType.PULSES], lang: 'hi' },
  { name: 'Kalawati Devi', village: 'Orai', district: 'Jalaun', state: 'Uttar Pradesh', landArea: 3.0, crops: [ProduceType.WHEAT], lang: 'hi' },
  { name: 'Manohar Lal', village: 'Konch', district: 'Jalaun', state: 'Uttar Pradesh', landArea: 4.5, crops: [ProduceType.PADDY, ProduceType.MAIZE], lang: 'hi' },
  { name: 'Guddi Devi', village: 'Rath', district: 'Hamirpur', state: 'Uttar Pradesh', landArea: 2.5, crops: [ProduceType.WHEAT], lang: 'hi' },
  { name: 'Rampal Yadav', village: 'Mahoba', district: 'Mahoba', state: 'Uttar Pradesh', landArea: 6.5, crops: [ProduceType.WHEAT, ProduceType.PULSES], lang: 'hi' },
  { name: 'Rajkumar Ahirwar', village: 'Sagar', district: 'Sagar', state: 'Madhya Pradesh', landArea: 5.5, crops: [ProduceType.WHEAT, ProduceType.MAIZE], lang: 'hi' },
  { name: 'Saroj Bai', village: 'Damoh', district: 'Damoh', state: 'Madhya Pradesh', landArea: 3.0, crops: [ProduceType.PULSES], lang: 'hi' },
  { name: 'Dashrath Mahale', village: 'Deolali', district: 'Nashik', state: 'Maharashtra', landArea: 4.0, crops: [ProduceType.ONION, ProduceType.WHEAT], lang: 'hi' },
  { name: 'Shobha Kale', village: 'Baglan', district: 'Nashik', state: 'Maharashtra', landArea: 3.5, crops: [ProduceType.ONION], lang: 'hi' },
  { name: 'Prem Singh', village: 'Dausa', district: 'Dausa', state: 'Rajasthan', landArea: 8.0, crops: [ProduceType.WHEAT, ProduceType.MAIZE], lang: 'hi' },
  { name: 'Santosh Devi', village: 'Karauli', district: 'Karauli', state: 'Rajasthan', landArea: 4.0, crops: [ProduceType.WHEAT, ProduceType.PULSES], lang: 'hi' },
  { name: 'Baljit Singh', village: 'Harike', district: 'Ferozepur', state: 'Punjab', landArea: 10.0, crops: [ProduceType.WHEAT, ProduceType.PADDY], lang: 'hi' },
  { name: 'Harpreet Kaur', village: 'Makhu', district: 'Ferozepur', state: 'Punjab', landArea: 5.5, crops: [ProduceType.PADDY], lang: 'hi' },
  { name: 'Omkar Nath', village: 'Baghpat', district: 'Baghpat', state: 'Uttar Pradesh', landArea: 4.0, crops: [ProduceType.WHEAT, ProduceType.PADDY], lang: 'hi' },
  { name: 'Pushpa Devi', village: 'Baraut', district: 'Baghpat', state: 'Uttar Pradesh', landArea: 2.5, crops: [ProduceType.WHEAT], lang: 'hi' },
  { name: 'Naresh Kumar', village: 'Muzaffarnagar', district: 'Muzaffarnagar', state: 'Uttar Pradesh', landArea: 5.0, crops: [ProduceType.PADDY, ProduceType.MAIZE], lang: 'hi' },
  { name: 'Seema Devi', village: 'Shamli', district: 'Shamli', state: 'Uttar Pradesh', landArea: 3.0, crops: [ProduceType.WHEAT], lang: 'hi' },
  { name: 'Govind Singh', village: 'Saharanpur', district: 'Saharanpur', state: 'Uttar Pradesh', landArea: 7.0, crops: [ProduceType.WHEAT, ProduceType.PADDY], lang: 'hi' },
  { name: 'Basanti Devi', village: 'Deoband', district: 'Saharanpur', state: 'Uttar Pradesh', landArea: 2.0, crops: [ProduceType.PADDY], lang: 'hi' },
  { name: 'Vikram Jatav', village: 'Tikamgarh', district: 'Tikamgarh', state: 'Madhya Pradesh', landArea: 4.5, crops: [ProduceType.WHEAT, ProduceType.PULSES], lang: 'hi' },
  { name: 'Maya Devi', village: 'Chhatarpur', district: 'Chhatarpur', state: 'Madhya Pradesh', landArea: 3.5, crops: [ProduceType.WHEAT], lang: 'hi' },
  { name: 'Ramswaroop', village: 'Panna', district: 'Panna', state: 'Madhya Pradesh', landArea: 6.0, crops: [ProduceType.WHEAT, ProduceType.MAIZE], lang: 'hi' },
  { name: 'Suraj Bhagat', village: 'Surgana', district: 'Nashik', state: 'Maharashtra', landArea: 2.5, crops: [ProduceType.ONION], lang: 'hi' },
  { name: 'Vandana More', village: 'Peint', district: 'Nashik', state: 'Maharashtra', landArea: 4.0, crops: [ProduceType.ONION, ProduceType.PULSES], lang: 'hi' },
  { name: 'Lakhan Singh', village: 'Tonk', district: 'Tonk', state: 'Rajasthan', landArea: 7.5, crops: [ProduceType.WHEAT, ProduceType.PULSES], lang: 'hi' },
  { name: 'Hema Devi', village: 'Sawai Madhopur', district: 'Sawai Madhopur', state: 'Rajasthan', landArea: 3.0, crops: [ProduceType.WHEAT], lang: 'hi' },
  { name: 'Dalbir Singh', village: 'Zira', district: 'Ferozepur', state: 'Punjab', landArea: 9.0, crops: [ProduceType.WHEAT, ProduceType.PADDY], lang: 'hi' },
  { name: 'Amarjit Kaur', village: 'Moga', district: 'Moga', state: 'Punjab', landArea: 6.0, crops: [ProduceType.PADDY, ProduceType.WHEAT], lang: 'hi' },
];

export const seedFarmers: Farmer[] = farmerDataList.map((f, i) => {
  const idx = String(i + 1).padStart(4, '0');
  const phone = `98${String(10000000 + i * 97 + 11).slice(0, 8)}`;
  return {
    id: `farmer-${idx}`,
    farmerId: `KS-FARM-${idx}`,
    name: f.name,
    phone: i === 0 ? 'farmer1' : phone, // first farmer gets demo login
    password: i === 0 ? 'farmer1' : phone,
    role: UserRole.FARMER,
    village: f.village,
    district: f.district,
    state: f.state,
    landArea: f.landArea,
    crops: f.crops,
    language: f.lang,
    aadhaar: `XXXX-XXXX-${String(1000 + i).slice(0, 4)}`,
    createdAt: daysAgo(180 - i),
  };
});

// ==================== CENTRES (5) ====================

export const seedCentres: Centre[] = [
  {
    id: 'centre-001',
    name: 'Krishi Upaj Mandi',
    location: 'Alambagh, Lucknow',
    district: 'Lucknow',
    state: 'Uttar Pradesh',
    capacity: 200,
    activeBays: 6,
    totalBays: 8,
    operatingHours: { start: '06:00', end: '18:00' },
    status: 'ACTIVE',
    congestionLevel: CongestionLevel.YELLOW,
    contactPhone: '0522-2345678',
  },
  {
    id: 'centre-002',
    name: 'Kisan Sewa Kendra',
    location: 'Karond, Bhopal',
    district: 'Bhopal',
    state: 'Madhya Pradesh',
    capacity: 150,
    activeBays: 5,
    totalBays: 6,
    operatingHours: { start: '07:00', end: '17:00' },
    status: 'ACTIVE',
    congestionLevel: CongestionLevel.GREEN,
    contactPhone: '0755-3456789',
  },
  {
    id: 'centre-003',
    name: 'APMC Market Yard',
    location: 'Panchavati, Nashik',
    district: 'Nashik',
    state: 'Maharashtra',
    capacity: 180,
    activeBays: 5,
    totalBays: 7,
    operatingHours: { start: '06:00', end: '18:00' },
    status: 'ACTIVE',
    congestionLevel: CongestionLevel.RED,
    contactPhone: '0253-4567890',
  },
  {
    id: 'centre-004',
    name: 'Anaj Mandi',
    location: 'Sodala, Jaipur',
    district: 'Jaipur',
    state: 'Rajasthan',
    capacity: 120,
    activeBays: 4,
    totalBays: 5,
    operatingHours: { start: '07:00', end: '17:00' },
    status: 'ACTIVE',
    congestionLevel: CongestionLevel.GREEN,
    contactPhone: '0141-5678901',
  },
  {
    id: 'centre-005',
    name: 'Grain Market',
    location: 'Hall Bazaar, Amritsar',
    district: 'Amritsar',
    state: 'Punjab',
    capacity: 160,
    activeBays: 5,
    totalBays: 6,
    operatingHours: { start: '06:00', end: '18:00' },
    status: 'ACTIVE',
    congestionLevel: CongestionLevel.YELLOW,
    contactPhone: '0183-6789012',
  },
];

// ==================== PRODUCE ====================

export const seedProduce: Produce[] = seedFarmers.slice(0, 50).map((f, i) => {
  const crop = f.crops[0];
  return {
    id: `produce-${String(i + 1).padStart(4, '0')}`,
    farmerId: f.id,
    type: crop,
    quantity: Math.floor(10 + Math.random() * 90),
    unit: 'quintal',
    grade: (['A', 'B', 'A', 'A', 'B', 'C', 'A', 'B'] as const)[i % 8],
    mspRate: MSP_RATES[crop],
  };
});

// ==================== SLOTS (50+ across centres, today + 3 days) ====================

const slotTimes = [
  { start: '06:00', end: '08:00' },
  { start: '08:00', end: '10:00' },
  { start: '10:00', end: '12:00' },
  { start: '12:00', end: '14:00' },
  { start: '14:00', end: '16:00' },
  { start: '16:00', end: '18:00' },
];

export const seedSlots: Slot[] = [];
let slotCounter = 1;
for (let dayOffset = 0; dayOffset <= 3; dayOffset++) {
  const date = daysFromNow(dayOffset);
  for (const centre of seedCentres) {
    for (const st of slotTimes) {
      const cap = Math.floor(centre.capacity / slotTimes.length);
      const booked = dayOffset === 0 ? Math.floor(Math.random() * cap * 0.8) : Math.floor(Math.random() * cap * 0.3);
      seedSlots.push({
        id: `slot-${String(slotCounter++).padStart(4, '0')}`,
        centreId: centre.id,
        date,
        timeStart: st.start,
        timeEnd: st.end,
        maxCapacity: cap,
        currentBookings: booked,
        status: booked >= cap ? 'FULL' : 'AVAILABLE',
      });
    }
  }
}

// ==================== TOKENS (20+ active) ====================

export const seedTokens: Token[] = [];
const activeTokenFarmers = seedFarmers.slice(0, 25);
for (let i = 0; i < activeTokenFarmers.length; i++) {
  const farmer = activeTokenFarmers[i];
  // assign to centre based on state
  let centreId = 'centre-001';
  if (farmer.state === 'Madhya Pradesh') centreId = 'centre-002';
  else if (farmer.state === 'Maharashtra') centreId = 'centre-003';
  else if (farmer.state === 'Rajasthan') centreId = 'centre-004';
  else if (farmer.state === 'Punjab') centreId = 'centre-005';

  const centreSlots = seedSlots.filter(s => s.centreId === centreId && s.date === todayStr());
  const slot = centreSlots[i % centreSlots.length] || centreSlots[0];
  if (!slot) continue;

  const statusOptions: Array<'ACTIVE' | 'USED'> = i < 20 ? ['ACTIVE'] : ['USED'];
  seedTokens.push({
    id: `token-${String(i + 1).padStart(4, '0')}`,
    farmerId: farmer.id,
    slotId: slot.id,
    centreId,
    tokenNumber: `TKN-${centreId.split('-')[1]}-${String(i + 1).padStart(3, '0')}`,
    qrData: JSON.stringify({ tokenId: `token-${String(i + 1).padStart(4, '0')}`, farmerId: farmer.id, centreId }),
    status: statusOptions[0],
    queuePosition: i < 20 ? i + 1 : 0,
    estimatedTime: hoursFromNow(Math.floor(i * 0.5)),
    createdAt: daysAgo(0),
  });
}

// ==================== PROCUREMENTS (25+) ====================

const procurementStatuses: ProcurementStatus[] = [
  ProcurementStatus.BOOKED,
  ProcurementStatus.ARRIVED,
  ProcurementStatus.GATE_ENTRY,
  ProcurementStatus.WEIGHING,
  ProcurementStatus.QUALITY_CHECK,
  ProcurementStatus.PROCUREMENT,
  ProcurementStatus.PAYMENT_PENDING,
  ProcurementStatus.PAYMENT_PROCESSING,
  ProcurementStatus.COMPLETED,
];

export const seedProcurements: Procurement[] = [];
for (let i = 0; i < 30; i++) {
  const farmer = seedFarmers[i];
  const token = seedTokens[i] || seedTokens[0];
  const produce = seedProduce[i] || seedProduce[0];
  const status = i < 5 ? ProcurementStatus.BOOKED
    : i < 8 ? ProcurementStatus.ARRIVED
    : i < 10 ? ProcurementStatus.GATE_ENTRY
    : i < 13 ? ProcurementStatus.WEIGHING
    : i < 16 ? ProcurementStatus.QUALITY_CHECK
    : i < 18 ? ProcurementStatus.PROCUREMENT
    : i < 20 ? ProcurementStatus.PAYMENT_PENDING
    : i < 23 ? ProcurementStatus.PAYMENT_PROCESSING
    : ProcurementStatus.COMPLETED;

  const now = new Date();
  const baseTime = new Date(now.getTime() - (30 - i) * 30 * 60000).toISOString();

  const proc: Procurement = {
    id: `proc-${String(i + 1).padStart(4, '0')}`,
    farmerId: farmer.id,
    centreId: token.centreId,
    tokenId: token.id,
    produceId: produce.id,
    status,
    bookedAt: baseTime,
  };

  const statusIdx = procurementStatuses.indexOf(status);
  if (statusIdx >= 1) proc.arrivedAt = new Date(new Date(baseTime).getTime() + 15 * 60000).toISOString();
  if (statusIdx >= 2) proc.gateEntryAt = new Date(new Date(baseTime).getTime() + 25 * 60000).toISOString();
  if (statusIdx >= 3) proc.weighingAt = new Date(new Date(baseTime).getTime() + 40 * 60000).toISOString();
  if (statusIdx >= 4) proc.qualityCheckAt = new Date(new Date(baseTime).getTime() + 55 * 60000).toISOString();
  if (statusIdx >= 5) proc.procurementAt = new Date(new Date(baseTime).getTime() + 70 * 60000).toISOString();
  if (statusIdx >= 6) proc.paymentPendingAt = new Date(new Date(baseTime).getTime() + 85 * 60000).toISOString();
  if (statusIdx >= 7) proc.paymentProcessingAt = new Date(new Date(baseTime).getTime() + 100 * 60000).toISOString();
  if (statusIdx >= 8) proc.completedAt = new Date(new Date(baseTime).getTime() + 120 * 60000).toISOString();

  seedProcurements.push(proc);
}

// ==================== PAYMENTS (20+) ====================

export const seedPayments: Payment[] = [];
for (let i = 0; i < 25; i++) {
  const proc = seedProcurements[i];
  const produce = seedProduce[i] || seedProduce[0];
  const qty = produce.quantity;
  const rate = produce.mspRate;
  const gross = qty * rate;
  const deductions = Math.floor(gross * 0.02);
  const net = gross - deductions;

  const pStatus: PaymentStatus = i < 5 ? PaymentStatus.PENDING
    : i < 10 ? PaymentStatus.PROCESSING
    : i < 20 ? PaymentStatus.COMPLETED
    : PaymentStatus.FAILED;

  seedPayments.push({
    id: `payment-${String(i + 1).padStart(4, '0')}`,
    procurementId: proc.id,
    farmerId: proc.farmerId,
    grossAmount: gross,
    deductions,
    netAmount: net,
    status: pStatus,
    dbtReferenceId: pStatus === PaymentStatus.COMPLETED ? `DBT-${Date.now()}-${i}` : undefined,
    processedAt: pStatus === PaymentStatus.COMPLETED ? daysAgo(Math.floor(Math.random() * 5)) : undefined,
    createdAt: proc.bookedAt || daysAgo(1),
  });
}

// ==================== NOTIFICATIONS (30+) ====================

export const seedNotifications: Notification[] = [];
const notifTemplates: Array<{
  type: NotificationType;
  title: string;
  titleHi: string;
  message: string;
  messageHi: string;
}> = [
  { type: NotificationType.SLOT_CONFIRMED, title: 'Slot Booked', titleHi: 'स्लॉट बुक हो गया', message: 'Your slot has been confirmed. Please arrive on time.', messageHi: 'आपका स्लॉट कन्फर्म हो गया है। कृपया समय पर पहुंचें।' },
  { type: NotificationType.SLOT_REMINDER, title: 'Slot Reminder', titleHi: 'स्लॉट रिमाइंडर', message: 'Your slot is coming up in 1 hour. Please start heading to the centre.', messageHi: 'आपका स्लॉट 1 घंटे में है। कृपया केंद्र की ओर निकलें।' },
  { type: NotificationType.QUEUE_APPROACHING, title: 'Your Turn is Near', titleHi: 'आपकी बारी नज़दीक है', message: 'You are 3rd in the queue. Please be ready at the gate.', messageHi: 'आप कतार में तीसरे नंबर पर हैं। कृपया गेट पर तैयार रहें।' },
  { type: NotificationType.GATE_ENTRY, title: 'Gate Entry Done', titleHi: 'गेट प्रवेश हो गया', message: 'Gate entry completed. Proceed to weighing bay.', messageHi: 'गेट प्रवेश पूरा हुआ। तौल बे में जाएं।' },
  { type: NotificationType.WEIGHING_COMPLETED, title: 'Weighing Done', titleHi: 'तौल पूरी हुई', message: 'Your produce has been weighed. Net weight: 48.5 quintals.', messageHi: 'आपकी उपज तौली जा चुकी है। शुद्ध वज़न: 48.5 क्विंटल।' },
  { type: NotificationType.QUALITY_COMPLETED, title: 'Quality Check Done', titleHi: 'गुणवत्ता जांच पूरी', message: 'Quality check passed. Grade: A. Proceed to procurement.', messageHi: 'गुणवत्ता जांच पास। ग्रेड: A। खरीद के लिए आगे बढ़ें।' },
  { type: NotificationType.PROCUREMENT_COMPLETED, title: 'Procurement Complete', titleHi: 'खरीद पूरी', message: 'Your produce has been procured. Payment will be processed shortly.', messageHi: 'आपकी उपज खरीद ली गई है। भुगतान जल्द प्रोसेस किया जाएगा।' },
  { type: NotificationType.PAYMENT_PROCESSED, title: 'Payment Credited', titleHi: 'भुगतान जमा', message: 'Payment of ₹1,09,395 has been credited to your bank account via DBT.', messageHi: '₹1,09,395 का भुगतान आपके बैंक खाते में DBT से जमा किया गया।' },
  { type: NotificationType.QUEUE_DELAY, title: 'Queue Delay', titleHi: 'कतार में देरी', message: 'There is a 30-minute delay at the centre due to high volume.', messageHi: 'अधिक भीड़ के कारण केंद्र में 30 मिनट की देरी है।' },
];

for (let i = 0; i < 35; i++) {
  const tmpl = notifTemplates[i % notifTemplates.length];
  const farmer = seedFarmers[i % seedFarmers.length];
  seedNotifications.push({
    id: `notif-${String(i + 1).padStart(4, '0')}`,
    userId: farmer.id,
    type: tmpl.type,
    title: tmpl.title,
    titleHi: tmpl.titleHi,
    message: tmpl.message,
    messageHi: tmpl.messageHi,
    read: i > 20,
    createdAt: daysAgo(Math.floor(i / 3)),
  });
}

// ==================== WEIGHING RECORDS (20+) ====================

export const seedWeighings: Weighing[] = [];
const weighingProcs = seedProcurements.filter(p => {
  const idx = procurementStatuses.indexOf(p.status);
  return idx >= 3; // WEIGHING and beyond
});
for (let i = 0; i < weighingProcs.length && i < 22; i++) {
  const gross = 45 + Math.random() * 20;
  const tare = 1.5 + Math.random() * 1;
  seedWeighings.push({
    id: `weigh-${String(i + 1).padStart(4, '0')}`,
    procurementId: weighingProcs[i].id,
    grossWeight: parseFloat(gross.toFixed(1)),
    tareWeight: parseFloat(tare.toFixed(1)),
    netWeight: parseFloat((gross - tare).toFixed(1)),
    timestamp: weighingProcs[i].weighingAt || daysAgo(0),
  });
}

// ==================== QUALITY CHECKS (15+) ====================

export const seedQualityChecks: QualityCheck[] = [];
const qcProcs = seedProcurements.filter(p => {
  const idx = procurementStatuses.indexOf(p.status);
  return idx >= 4; // QUALITY_CHECK and beyond
});
for (let i = 0; i < qcProcs.length && i < 18; i++) {
  const grade: 'A' | 'B' | 'C' = (['A', 'B', 'A', 'A', 'B', 'C', 'A', 'A'] as const)[i % 8];
  seedQualityChecks.push({
    id: `qc-${String(i + 1).padStart(4, '0')}`,
    procurementId: qcProcs[i].id,
    moistureContent: parseFloat((10 + Math.random() * 5).toFixed(1)),
    foreignMatter: parseFloat((0.5 + Math.random() * 2).toFixed(1)),
    grade,
    accepted: grade !== 'C',
    remarks: grade === 'A' ? 'Excellent quality, well dried' : grade === 'B' ? 'Good quality, slightly higher moisture' : 'Below standard, excessive foreign matter',
    timestamp: qcProcs[i].qualityCheckAt || daysAgo(0),
  });
}

// ==================== AUDIT LOGS ====================

export const seedAuditLogs: AuditLog[] = [
  { id: 'audit-001', userId: 'user-officer-001', action: 'GATE_ENTRY', entity: 'procurement', entityId: 'proc-0009', details: 'Gate entry processed for farmer Geeta Singh', timestamp: daysAgo(0) },
  { id: 'audit-002', userId: 'user-officer-001', action: 'WEIGHING', entity: 'procurement', entityId: 'proc-0010', details: 'Weighing completed: 52.3 quintals net', timestamp: daysAgo(0) },
  { id: 'audit-003', userId: 'user-officer-001', action: 'QUALITY_CHECK', entity: 'procurement', entityId: 'proc-0013', details: 'Quality check: Grade A, Moisture 12.1%', timestamp: daysAgo(0) },
  { id: 'audit-004', userId: 'user-admin-001', action: 'PAYMENT_PROCESS', entity: 'payment', entityId: 'payment-0011', details: 'Payment of ₹1,09,395 processed via DBT', timestamp: daysAgo(1) },
  { id: 'audit-005', userId: 'user-officer-002', action: 'SLOT_CANCEL', entity: 'slot', entityId: 'slot-0005', details: 'Slot cancelled by officer due to weather', timestamp: daysAgo(2) },
  { id: 'audit-006', userId: 'user-admin-001', action: 'CENTRE_UPDATE', entity: 'centre', entityId: 'centre-001', details: 'Centre capacity updated from 180 to 200', timestamp: daysAgo(5) },
  { id: 'audit-007', userId: 'user-officer-001', action: 'GATE_ENTRY', entity: 'procurement', entityId: 'proc-0011', details: 'Gate entry processed for Suresh Patel', timestamp: daysAgo(0) },
  { id: 'audit-008', userId: 'user-admin-001', action: 'USER_CREATE', entity: 'user', entityId: 'user-officer-002', details: 'New officer account created', timestamp: daysAgo(90) },
];

// ==================== ANALYTICS (30 days) ====================

export const seedAnalytics: {
  registrations: AnalyticsDataPoint[];
  bookings: AnalyticsDataPoint[];
  waitTime: AnalyticsDataPoint[];
  queueLength: AnalyticsDataPoint[];
  utilization: AnalyticsDataPoint[];
  procurement: AnalyticsDataPoint[];
  payments: AnalyticsDataPoint[];
} = {
  registrations: [],
  bookings: [],
  waitTime: [],
  queueLength: [],
  utilization: [],
  procurement: [],
  payments: [],
};

for (let i = 30; i >= 0; i--) {
  const d = new Date();
  d.setDate(d.getDate() - i);
  const dateStr = d.toISOString().split('T')[0];

  seedAnalytics.registrations.push({ date: dateStr, value: Math.floor(3 + Math.random() * 8), label: 'New Registrations' });
  seedAnalytics.bookings.push({ date: dateStr, value: Math.floor(15 + Math.random() * 30), label: 'Bookings' });
  seedAnalytics.waitTime.push({ date: dateStr, value: Math.floor(20 + Math.random() * 40), label: 'Avg Wait (min)' });
  seedAnalytics.queueLength.push({ date: dateStr, value: Math.floor(5 + Math.random() * 25), label: 'Queue Length' });
  seedAnalytics.utilization.push({ date: dateStr, value: Math.floor(40 + Math.random() * 50), label: 'Utilization %' });
  seedAnalytics.procurement.push({ date: dateStr, value: Math.floor(10 + Math.random() * 20), label: 'Completed' });
  seedAnalytics.payments.push({ date: dateStr, value: Math.floor(50000 + Math.random() * 200000), label: 'Payments (₹)' });
}
