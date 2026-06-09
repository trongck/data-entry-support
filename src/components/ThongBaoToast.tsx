'use client';

import React, { useEffect } from 'react';
import { useKhoLuuTru } from '../store/khoLuuTru';
import { CheckCircle2, AlertOctagon, AlertTriangle } from 'lucide-react';

export default function ThongBaoToast() {
  const { thongBao, setThongBao } = useKhoLuuTru();

  useEffect(() => {
    if (thongBao) {
      const timer = setTimeout(() => {
        setThongBao(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [thongBao, setThongBao]);

  if (!thongBao) return null;

  const { loai, noiDung } = thongBao;

  let mauSac = 'border-l-green-500 text-green-700';
  let Icon = CheckCircle2;

  if (loai === 'loi') {
    mauSac = 'border-l-red-500 text-red-700';
    Icon = AlertOctagon;
  } else if (loai === 'canh-bao') {
    mauSac = 'border-l-amber-500 text-amber-700';
    Icon = AlertTriangle;
  }

  return (
    <div className="fixed bottom-12 right-6 z-[9999] flex flex-col gap-2">
      <div className={`flex items-center gap-3 bg-white border border-gray-200 border-l-4 ${mauSac} shadow-md px-4 py-3 min-w-[280px] animate-slide-in`}>
        <Icon className="w-5 h-5 flex-shrink-0" />
        <span className="font-semibold text-sm text-gray-800">{noiDung}</span>
      </div>
    </div>
  );
}
