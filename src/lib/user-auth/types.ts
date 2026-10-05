export type PublicUser = {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  phoneCountryCode?: string;
  dateOfBirth?: string;
  gender?: string;
  nationality?: string;
  role: 'user' | 'admin';
  emailVerified: boolean;
  avatarUrl?: string;
  bookingsCount: number;
  createdAt: string;
};

export type AuthUserRecord = PublicUser & {
  passwordHash: string | null;
  googleSub: string | null;
  sessionVersion: number;
};

export type RegisterUserInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  phoneCountryCode: string;
  dateOfBirth: string;
  gender: string;
  nationality: string;
  password: string;
};
