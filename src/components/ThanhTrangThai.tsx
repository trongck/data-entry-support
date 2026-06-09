'use client';

import React, { useEffect, useState } from 'react';
import { useKhoLuuTru } from '../store/khoLuuTru';

export default function ThanhTrangThai() {
  const { duLieu, hangDangChon, chiSoLichSu } = useKhoLuuTru();
  const [lastSaved, setLastSaved] = useState<string>('Chưa có thay đổi');

  useEffect(() => {
    if (chiSoLichSu >= 0) {
      setLastSaved(new Date().toLocaleTimeString('vi-VN'));
    }
  }, [chiSoLichSu]);

  return (
    <footer className="bg-[#F8F9FA] border-t border-[#E5E7EB] h-8 px-4 flex items-center justify-between text-[11px] text-[#6B7280]">
      <div className="flex items-center gap-4">
        <span>Tổng số dòng: <strong className="text-[#1A1A2E]">{duLieu.length}</strong></span>
        <span>Đang chọn: <strong className="text-[#1A1A2E]">{hangDangChon.size}</strong></span>
      </div>
      <div>
        <span>Lưu lịch sử cuối: <strong>{lastSaved}</strong></span>
      </div>
    </footer>
  );
}
