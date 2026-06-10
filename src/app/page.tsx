'use client';

import React, { useState, useEffect } from 'react';
import { useKhoLuuTru } from '../store/khoLuuTru';
import ThanhBen from '../components/ThanhBen';
import ThanhTren from '../components/ThanhTren';
import ThanhTrangThai from '../components/ThanhTrangThai';
import ThongBaoToast from '../components/ThongBaoToast';

// Features panels
import ChuyenAnhExcel from '../features/ChuyenAnhExcel';
import DocJsonExcel from '../features/DocJsonExcel';
import NhapPdfExcel from '../features/NhapPdfExcel';
import ChuanHoaDuLieu from '../features/ChuanHoaDuLieu';
import QuetPhieuLienTuc from '../features/QuetPhieuLienTuc';

export default function TrangChu() {
  const { 
    nguoiDung, 
    giaoDienHienTai, 
    duLieu, 
    setDuLieu, 
    dangNhap, 
    setThongBao,
    dangXuLy,
    khoiPhucNguoiDung
  } = useKhoLuuTru();

  // Restore user login status on mount
  useEffect(() => {
    khoiPhucNguoiDung();
  }, [khoiPhucNguoiDung]);

  // Login form states
  const [maForm, setMaForm] = useState('');
  const [passForm, setPassForm] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [coThuGonSidebar, setCoThuGonSidebar] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await dangNhap(maForm, passForm);
    if (success) {
      setErrorMessage('');
      setThongBao({ loai: 'thanh-cong', noiDung: 'Đăng nhập hệ thống thành công!' });
    } else {
      setErrorMessage('Mã tài khoản hoặc mật khẩu không chính xác!');
      setThongBao({ loai: 'loi', noiDung: 'Đăng nhập thất bại!' });
    }
  };

  // Render correct workflow panel
  const renderWorkflowPanel = () => {
    switch (giaoDienHienTai) {
      case 'quet-phieu':
        return <QuetPhieuLienTuc />;
      case 'chuyen-anh':
        return <ChuyenAnhExcel />;
      case 'doc-json':
        return <DocJsonExcel />;
      case 'nhap-pdf':
        return <NhapPdfExcel />;
      case 'chuan-hoa':
        return <ChuanHoaDuLieu />;
      default:
        return <QuetPhieuLienTuc />;
    }
  };

  if (!nguoiDung) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FA] px-4 font-sans">
        <div className="w-full max-w-sm bg-white border border-[#E5E7EB] p-8 shadow-[0_1px_3px_rgba(0,0,0,0.08)] flex flex-col gap-6">
          <div className="text-center flex flex-col gap-1.5">
            <h1 className="text-xl font-bold text-[#1A1A2E]">ĐĂNG NHẬP HỆ THỐNG</h1>
            <p className="text-xs text-[#6B7280]">Vui lòng nhập thông tin quản trị viên để bắt đầu</p>
          </div>

          {errorMessage && (
            <div className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 p-2.5 text-center">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#1A1A2E]">Mã tài khoản</label>
              <input
                type="text"
                value={maForm}
                onChange={(e) => setMaForm(e.target.value)}
                className="w-full border border-[#E5E7EB] px-3 py-2 outline-none focus:border-[#2563EB] text-sm bg-white rounded"
                placeholder="Nhập mã tài khoản..."
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#1A1A2E]">Mật khẩu</label>
              <input
                type="password"
                value={passForm}
                onChange={(e) => setPassForm(e.target.value)}
                className="w-full border border-[#E5E7EB] px-3 py-2 outline-none focus:border-[#2563EB] text-sm bg-white rounded"
                placeholder="Nhập mật khẩu..."
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-sm shadow-sm transition"
            >
              ĐĂNG NHẬP
            </button>
          </form>
        </div>
        <p className="mt-6 text-[11px] text-[#9CA3AF]">
          © {new Date().getFullYear()} Developed by <span className="text-[#2563EB] font-semibold">Nguyễn Văn Trọng</span>
        </p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col font-sans bg-white relative text-[#1A1A2E]">
      {/* Top Header bar */}
      <ThanhTren onToggleSidebar={() => setCoThuGonSidebar(!coThuGonSidebar)} />

      {/* Main Body (Sidebar + Content area) */}
      <div className="flex-grow flex overflow-hidden">
        <ThanhBen coThuGon={coThuGonSidebar} />
        
        <main className="flex-1 p-4 md:p-6 overflow-y-auto lg:overflow-hidden flex flex-col relative bg-white">
          {renderWorkflowPanel()}

          {/* Progress Overlay Indicator */}
          {dangXuLy && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-[9999]">
              <div className="flex flex-col items-center gap-2.5 p-6 bg-white border border-[#E5E7EB] shadow-md rounded">
                <div className="w-8 h-8 border-4 border-[#E5E7EB] border-t-[#2563EB] rounded-full animate-spin" />
                <span className="text-xs font-semibold text-gray-700">Đang xử lý dữ liệu lớn...</span>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Bottom Status bar */}
      <ThanhTrangThai />

      {/* Toast Notification Mount */}
      <ThongBaoToast />
    </div>
  );
}
