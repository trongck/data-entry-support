'use client';

import React from 'react';
import { useKhoLuuTru, NhanVien } from '../store/khoLuuTru';
import VirtualTable from '../components/VirtualTable';
import { Trash2 } from 'lucide-react';

export default function NhapLieuThuCong() {
  const { 
    duLieu,
    hangDangChon, 
    xoaDongDaChon, 
    setDuLieu, 
    setThongBao,
    setDangXuLy
  } = useKhoLuuTru();

  return (
    <div className="flex-1 flex flex-col gap-4 overflow-hidden h-full">
      <div className="flex justify-between items-center flex-shrink-0">
        <div>
          <h2 className="text-lg font-semibold text-[#1A1A2E]">Bảng dữ liệu chính</h2>
          <p className="text-xs text-gray-500">Hiển thị toàn bộ hồ sơ nhân viên tổng hợp. Kích đúp vào ô để sửa nhanh lỗi chính tả.</p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={xoaDongDaChon}
            disabled={hangDangChon.size === 0}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-red-200 hover:bg-red-50 text-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold shadow-[0_1px_3px_rgba(0,0,0,0.08)] transition"
          >
            <Trash2 className="w-4 h-4" />
            <span>Xóa hàng chọn ({hangDangChon.size})</span>
          </button>
        </div>
      </div>

      {/* Render Virtual scrolling table */}
      <VirtualTable />
    </div>
  );
}
