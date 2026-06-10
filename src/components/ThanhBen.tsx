'use client';

import React from 'react';
import { useKhoLuuTru } from '../store/khoLuuTru';
import { Image, FileCode, FileText, CheckSquare, ScanLine } from 'lucide-react';

interface ThanhBenProps {
  coThuGon: boolean;
  onClose?: () => void;
}

export default function ThanhBen({ coThuGon, onClose }: ThanhBenProps) {
  const { giaoDienHienTai, chuyenPhanHe } = useKhoLuuTru();

  const danhSachChucNang = [
    { id: 'quet-phieu', ten: 'Quét Phiếu Liên Tục', Icon: ScanLine },
    { id: 'chuyen-anh', ten: 'Chuyển Ảnh thành Excel', Icon: Image },
    { id: 'doc-json', ten: 'Đọc dữ liệu JSON', Icon: FileCode },
    { id: 'nhap-pdf', ten: 'Nhập từ PDF sang Excel', Icon: FileText },
    { id: 'chuan-hoa', ten: 'Chuẩn hóa dữ liệu', Icon: CheckSquare },
  ];

  return (
    <>
      {/* Mobile drawer backdrop */}
      {!coThuGon && (
        <div 
          onClick={onClose}
          className="lg:hidden fixed inset-0 top-14 bg-black/40 z-20 backdrop-blur-xs transition-opacity duration-300"
        />
      )}
      
      <aside className={`bg-[#F8F9FA] border-r border-[#E5E7EB] flex flex-col justify-between py-4 transition-all duration-300 z-30
        lg:relative lg:translate-x-0
        fixed top-14 bottom-0 left-0
        ${coThuGon ? '-translate-x-full lg:translate-x-0 lg:w-16' : 'translate-x-0 w-60'}
      `}>
        <nav className="flex flex-col gap-1 px-2">
          {danhSachChucNang.map(item => {
            const Active = giaoDienHienTai === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  chuyenPhanHe(item.id);
                  if (onClose) onClose();
                }}
                className={`flex items-center gap-3 px-3 py-3 w-full text-left font-medium text-[13px] border border-transparent transition-all ${
                  Active 
                    ? 'bg-white text-[#2563EB] shadow-[0_1px_3px_rgba(0,0,0,0.08)] border-[#E5E7EB]' 
                    : 'text-[#1A1A2E] hover:bg-white hover:shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:border-[#E5E7EB]'
                } ${coThuGon ? 'lg:justify-center' : ''}`}
                title={item.ten}
              >
                <item.Icon className="w-4 h-4 flex-shrink-0" />
                <span className={`${coThuGon ? 'lg:hidden' : ''}`}>{item.ten}</span>
              </button>
            );
          })}
        </nav>
        <div className={`px-4 pt-4 border-t border-[#E5E7EB] text-[11px] text-gray-500 ${coThuGon ? 'lg:text-center lg:px-1' : ''}`}>
          <span className={`${coThuGon ? 'lg:hidden' : ''}`}>Hệ thống Nhập liệu Thông minh</span>
          {coThuGon && <span className="hidden lg:inline text-center font-bold text-indigo-600">AI</span>}
        </div>
      </aside>
    </>
  );
}
