import { Loader } from 'lucide-react';

export default function BookingLoading() {
  return (
    <div className="pt-28 min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader className="w-8 h-8 animate-spin text-[#16a34a] mx-auto mb-3" />
        <p className="text-sm text-gray-500">Loading checkout…</p>
      </div>
    </div>
  );
}
