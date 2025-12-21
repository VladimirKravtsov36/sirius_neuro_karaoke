// components/Layout.tsx
import { Outlet } from 'react-router-dom';
import { KaraokeHeader } from './KaraokeHeader';

export default function Layout() {
  return (
    <div className="min-h-screen w-full overflow-hidden bg-[#0B0B0F] flex flex-col text-white">
      <KaraokeHeader />
      <Outlet />
    </div>
  );
}
