import type { Metadata } from 'next';
import ProfileHub from '@/components/profile/ProfileHub';

export const metadata: Metadata = {
  title: 'Profile',
  description: 'Manage your Indian Treks bookings, wishlist, and account on mobile.',
  robots: { index: false, follow: false },
};

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-[#f3f7f4] pt-20 lg:pt-24 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] lg:pb-16">
      <div className="container mx-auto px-4">
        <ProfileHub />
      </div>
    </div>
  );
}
