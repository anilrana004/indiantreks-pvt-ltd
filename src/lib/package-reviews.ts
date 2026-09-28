import {
  CLIENT_REVIEWS_STORAGE_KEY,
  type ExperienceKind,
  type ExperienceReview,
} from '@/lib/experience-reviews-content';

/** Guest review submitted from a trek / yatra / trip detail page. */
export type PackageReview = {
  id: string;
  packageId: string;
  packageTitle: string;
  packageHref: string;
  packageKind: 'trek' | 'yatra' | 'trip';
  name: string;
  email: string;
  rating: number;
  text: string;
  /** Profile / avatar image (URL or data-URL). */
  avatar: string;
  /** Memory photos (URLs or data-URLs). */
  photos: string[];
  reviewedAt: string;
  pending?: boolean;
};

export const PACKAGE_REVIEWS_STORAGE_KEY = 'it_package_reviews_v1';

/** Fired after local package reviews change so detail-page sidebars can refresh. */
export const PACKAGE_REVIEWS_CHANGED_EVENT = 'it:package-reviews-changed';

export const PACKAGE_REVIEW_LIMITS = {
  maxPhotos: 4,
  maxImageBytes: 900_000,
  minTextLength: 40,
  maxLocalReviews: 80,
} as const;

function notifyPackageReviewsChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(PACKAGE_REVIEWS_CHANGED_EVENT));
}

export function loadPackageReviews(): PackageReview[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PACKAGE_REVIEWS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PackageReview[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function savePackageReviews(reviews: PackageReview[]) {
  try {
    localStorage.setItem(
      PACKAGE_REVIEWS_STORAGE_KEY,
      JSON.stringify(reviews.slice(0, PACKAGE_REVIEW_LIMITS.maxLocalReviews)),
    );
  } catch {
    /* quota — keep in-memory only */
  }
  notifyPackageReviewsChanged();
}

export function reviewsForPackage(reviews: PackageReview[], packageId: string): PackageReview[] {
  return reviews.filter((r) => r.packageId === packageId);
}

/** Also mirror into the /reviews hub client store so submissions stay discoverable. */
export function mirrorToExperienceReviews(review: PackageReview) {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(CLIENT_REVIEWS_STORAGE_KEY);
    const existing = raw ? (JSON.parse(raw) as ExperienceReview[]) : [];
    const list = Array.isArray(existing) ? existing : [];
    const kind = review.packageKind as ExperienceKind;
    const mirrored: ExperienceReview = {
      id: review.id,
      name: review.name,
      avatar: review.avatar,
      reviewedAt: review.reviewedAt,
      rating: review.rating,
      kind,
      experienceId: review.packageId,
      experienceName: review.packageTitle,
      experienceHref: review.packageHref,
      text: review.text,
      photos: review.photos,
      pending: true,
    };
    localStorage.setItem(
      CLIENT_REVIEWS_STORAGE_KEY,
      JSON.stringify([mirrored, ...list.filter((r) => r.id !== review.id)].slice(0, 40)),
    );
  } catch {
    /* ignore */
  }
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please choose an image file.'));
      return;
    }
    if (file.size > PACKAGE_REVIEW_LIMITS.maxImageBytes) {
      reject(new Error('Each image must be under 900 KB. Compress and try again.'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Could not read that image.'));
    reader.readAsDataURL(file);
  });
}

/** Validate an image File before preview / upload (same limits as Cloudinary path). */
export function assertReviewImageFile(file: File): void {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose an image file.');
  }
  if (file.size > PACKAGE_REVIEW_LIMITS.maxImageBytes) {
    throw new Error('Each image must be under 900 KB. Compress and try again.');
  }
}
