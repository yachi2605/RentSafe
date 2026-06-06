'use client';

import { Bell } from 'lucide-react';

interface NotificationBellProps {
  count: number;
}

export default function NotificationBell({ count }: NotificationBellProps) {
  return (
    <div className="relative inline-flex">
      <Bell className="h-5 w-5 text-white" />
      {count > 0 && (
        <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-brand-green text-[10px] font-semibold text-white">
          {count}
        </span>
      )}
    </div>
  );
}
