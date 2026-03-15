import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';

export default function MobileShell() {
  return (
    <div className="min-h-screen pb-20">
      <Outlet />
      <BottomNav />
    </div>
  );
}
