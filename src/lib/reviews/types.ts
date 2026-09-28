export type PackageKind = 'trek' | 'yatra' | 'trip';

export type GuestReviewStatus = 'pending' | 'approved' | 'rejected';

/** Public-safe review shape (no email). */
export type PublicGuestReview = {
  id: string;
  packageId: string;
  packageTitle: string;
  packageHref: string;
  packageKind: PackageKind;
  name: string;
  rating: number;
  text: string;
  avatarUrl: string | null;
  photoUrls: string[];
  status: GuestReviewStatus;
  createdAt: string;
};

/** Full review for admin (includes customer contact). */
export type AdminGuestReview = PublicGuestReview & {
  email: string;
  avatarPublicId: string | null;
  photoPublicIds: string[];
  moderatedAt: string | null;
  moderatedBy: string | null;
  userAgent: string | null;
  ipHash: string | null;
};

export type CreateGuestReviewInput = {
  packageId: string;
  packageTitle: string;
  packageHref: string;
  packageKind: PackageKind;
  name: string;
  email: string;
  rating: number;
  text: string;
  avatarUrl?: string | null;
  photoUrls?: string[];
  avatarPublicId?: string | null;
  photoPublicIds?: string[];
  userAgent?: string | null;
  ipHash?: string | null;
};

export const GUEST_REVIEWS_COLLECTION = 'guest_reviews';
