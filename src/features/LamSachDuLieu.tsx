'use client';

import React, { useState } from 'react';
import { useKhoLuuTru } from '../store/khoLuuTru';
import { kiemTraEmail, kiemTraSoDienThoai } from '../utils/tienIch';
import { ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';

interface LoiLamSach {
  dongIndex: number;
  cotId: string;
  loai: 'KHOANG_TRANG' | 'HOA_THUONG_TEN' | 'SAI_EMAIL' | 'SAI_SDT' | 'TRUNG_MA_NV';
  tenLoi: string;
  moTa: string;
  khoiPhuc: string;
}

export default function LamSachDuLieu() {
  const { duLieu, danhSachCot, setDuLieu, setThongBao } = useKhoLuuTru();
  const [danhSachLoi, setDanhSachLoi] = useState<LoiLamSach[]>([]);
  const [daQuet, setDaQuet] = useState(false);

  // Phát hiện lỗi trong bảng chính
  const phatHienLoiHeThong = () => {
    const loiMoi: LoiLamSach[] = [];
    const mapMaNv: Record<string, number[]> = {};

    duLieu.forEach((dong, idx) => {
      // 1. Kiểm tra trùng lặp khóa chính ở cột đầu tiên
      const primaryCol = danhSachCot[0];
      if (primaryCol) {
        const val = dong[primaryCol.id];
        if (val) {
          const key = String(val).trim().toUpperCase();
          if (!mapMaNv[key]) {
            mapMaNv[key] = [];
          }
          mapMaNv[key].push(idx);
        }
      }

      // 2. Khoảng trắng thừa trên tất cả các cột
      danhSachCot.forEach(cot => {
        const val = dong[cot.id] || '';
        if (val.toString() !== val.toString().trim().replace(/\s+/g, ' ')) {
          loiMoi.push({
            dongIndex: idx,
            cotId: cot.id,
            loai: 'KHOANG_TRANG',
            tenLoi: `Khoảng trắng thừa ở dòng ${idx + 1}, cột ${cot.ten}`,
            moTa: `Dữ liệu hiện tại: "${val}"`,
            khoiPhuc: val.toString()
          });
        }
      });

      // 3. Chuẩn hóa hoa chữ cái đầu cho tên (Cột chứa từ 'tên' hoặc 'name')
      danhSachCot.forEach(cot => {
        const isNameCol = /tên|name/i.test(cot.id);
        const val = dong[cot.id];
        if (isNameCol && val) {
          const chuanHoaTen = String(val).trim().replace(/\s+/g, ' ').toLowerCase().replace(/(^|\s)\S/g, (l: string) => l.toUpperCase());
          if (String(val) !== chuanHoaTen) {
            loiMoi.push({
              dongIndex: idx,
              cotId: cot.id,
              loai: 'HOA_THUONG_TEN',
              tenLoi: `Họ tên chưa chuẩn hoa thường ở dòng ${idx + 1}, cột ${cot.ten}`,
              moTa: `Hiện tại: "${val}" → Nên sửa: "${chuanHoaTen}"`,
              khoiPhuc: String(val)
            });
          }
        }
      });

      // 4. Định dạng Email (Cột chứa 'email' hoặc 'thư')
      danhSachCot.forEach(cot => {
        const isEmailCol = /email|thư/i.test(cot.id);
        const val = dong[cot.id];
        if (isEmailCol && val && !kiemTraEmail(String(val))) {
          loiMoi.push({
            dongIndex: idx,
            cotId: cot.id,
            loai: 'SAI_EMAIL',
            tenLoi: `Email sai định dạng ở dòng ${idx + 1}, cột ${cot.ten}`,
            moTa: `Giá trị: "${val}"`,
            khoiPhuc: String(val)
          });
        }
      });

      // 5. Định dạng SĐT (Cột chứa 'sđt', 'phone' hoặc 'điện thoại')
      danhSachCot.forEach(cot => {
        const isPhoneCol = /sđt|điện thoại|phone/i.test(cot.id);
        const val = dong[cot.id];
        if (isPhoneCol && val && !kiemTraSoDienThoai(String(val))) {
          loiMoi.push({
            dongIndex: idx,
            cotId: cot.id,
            loai: 'SAI_SDT',
            tenLoi: `SĐT không đúng chuẩn ở dòng ${idx + 1}, cột ${cot.ten}`,
            moTa: `Giá trị: "${val}"`,
            khoiPhuc: String(val)
          });
        }
      });
    });

    // Xử lý trùng lặp cột đầu tiên
    const primaryCol = danhSachCot[0];
    if (primaryCol) {
      Object.keys(mapMaNv).forEach(maNvKey => {
        const indices = mapMaNv[maNvKey];
        if (indices.length > 1) {
          indices.forEach((idx, iIdx) => {
            if (iIdx > 0) {
              loiMoi.push({
                dongIndex: idx,
                cotId: primaryCol.id,
                loai: 'TRUNG_MA_NV',
                tenLoi: `Giá trị "${maNvKey}" ở cột ${primaryCol.ten} bị trùng lặp`,
                moTa: `Dòng ${idx + 1} trùng lặp với dòng ${indices[0] + 1}`,
                khoiPhuc: maNvKey
              });
            }
          });
        }
      });
    }

    setDanhSachLoi(loiMoi);
    setDaQuet(true);
    setThongBao({
      loai: loiMoi.length > 0 ? 'canh-bao' : 'thanh-cong',
      noiDung: `Phát hiện ${loiMoi.length} vấn đề cần làm sạch.`
    });
  };

  // Khắc phục 1 lỗi cụ thể
  const suaMotLoi = (indexLoi: number) => {
    const loi = danhSachLoi[indexLoi];
    if (!loi) return;

    const copyDuLieu = [...duLieu];
    const dong = copyDuLieu[loi.dongIndex];
    if (!dong) return;

    const val = dong[loi.cotId];

    if (loi.loai === 'KHOANG_TRANG') {
      dong[loi.cotId] = String(val).trim().replace(/\s+/g, ' ');
    } else if (loi.loai === 'HOA_THUONG_TEN') {
      dong[loi.cotId] = String(val).trim().replace(/\s+/g, ' ').toLowerCase().replace(/(^|\s)\S/g, (l: string) => l.toUpperCase());
    } else if (loi.loai === 'TRUNG_MA_NV') {
      dong[loi.cotId] = String(val) + '_S';
    } else if (loi.loai === 'SAI_EMAIL') {
      dong[loi.cotId] = val.toString().trim().toLowerCase();
    } else if (loi.loai === 'SAI_SDT') {
      let sdtChuan = val.toString().replace(/[^0-9]/g, '');
      if (sdtChuan.startsWith('84')) sdtChuan = '0' + sdtChuan.slice(2);
      dong[loi.cotId] = sdtChuan;
    }

    setDuLieu(copyDuLieu);
    setThongBao({ loai: 'thanh-cong', noiDung: 'Đã xử lý khắc phục lỗi chọn!' });

    // Loại bỏ lỗi khỏi danh sách hiển thị
    setDanhSachLoi(danhSachLoi.filter((_, i) => i !== indexLoi));
  };

  // Khắc phục toàn bộ các lỗi
  const suaToanBoLoi = () => {
    if (danhSachLoi.length === 0) return;

    const copyDuLieu = [...duLieu];

    danhSachLoi.forEach(loi => {
      const dong = copyDuLieu[loi.dongIndex];
      if (!dong) return;

      const val = dong[loi.cotId];

      if (loi.loai === 'KHOANG_TRANG') {
        dong[loi.cotId] = String(val).trim().replace(/\s+/g, ' ');
      } else if (loi.loai === 'HOA_THUONG_TEN') {
        dong[loi.cotId] = String(val).trim().replace(/\s+/g, ' ').toLowerCase().replace(/(^|\s)\S/g, (l: string) => l.toUpperCase());
      } else if (loi.loai === 'TRUNG_MA_NV') {
        dong[loi.cotId] = String(val) + '_S';
      } else if (loi.loai === 'SAI_EMAIL') {
        dong[loi.cotId] = val.toString().trim().toLowerCase();
      } else if (loi.loai === 'SAI_SDT') {
        let sdtChuan = val.toString().replace(/[^0-9]/g, '');
        if (sdtChuan.startsWith('84')) sdtChuan = '0' + sdtChuan.slice(2);
        dong[loi.cotId] = sdtChuan;
      }
    });

    setDuLieu(copyDuLieu);
    setDanhSachLoi([]);
    setThongBao({ loai: 'thanh-cong', noiDung: 'Đã hoàn tất tự động làm sạch toàn bộ dữ liệu!' });
  };

  return (
    <div className="flex-1 flex gap-6 overflow-hidden h-full">
      {/* Settings Control Panel */}
      <div className="w-80 border border-[#E5E7EB] bg-[#F8F9FA] p-4 flex flex-col gap-4 overflow-y-auto">
        <h3 className="font-semibold text-[#1A1A2E] text-sm flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-[#2563EB]" /> Cấu hình chuẩn hóa
        </h3>

        <div className="flex flex-col gap-3 text-xs text-gray-700">
          <label className="flex items-center gap-2 cursor-pointer py-1">
            <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#2563EB]" />
            <span>Phát hiện trùng lặp khóa chính</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer py-1">
            <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#2563EB]" />
            <span>Xóa khoảng trắng thừa</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer py-1">
            <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#2563EB]" />
            <span>Chuẩn hóa dạng Họ tên</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer py-1">
            <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#2563EB]" />
            <span>Kiểm tra chuẩn Email</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer py-1">
            <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#2563EB]" />
            <span>Chuẩn hóa số điện thoại</span>
          </label>
        </div>

        <button
          onClick={phatHienLoiHeThong}
          className="w-full flex items-center justify-center gap-2 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-sm transition"
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Quét & Phân tích lỗi</span>
        </button>

        <button
          onClick={suaToanBoLoi}
          disabled={danhSachLoi.length === 0}
          className="w-full flex items-center justify-center gap-2 py-2 bg-white border border-[#E5E7EB] hover:bg-[#F8F9FA] text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold transition"
        >
          <Sparkles className="w-4 h-4 text-[#2563EB]" />
          <span>Sửa nhanh toàn bộ lỗi</span>
        </button>
      </div>

      {/* List of Found Errors */}
      <div className="flex-1 border border-[#E5E7EB] bg-white p-4 flex flex-col gap-3 overflow-hidden h-full rounded">
        <h3 className="font-semibold text-sm text-[#1A1A2E]">Danh sách lỗi cần khắc phục</h3>
        
        {!daQuet ? (
          <div className="text-gray-400 text-xs text-center py-12">
            Hãy chạy quét lỗi để hệ thống phân tích dữ liệu bảng chính.
          </div>
        ) : danhSachLoi.length === 0 ? (
          <div className="text-emerald-600 text-xs font-semibold text-center py-12 flex flex-col items-center gap-2">
            <CheckCircle2 className="w-8 h-8" />
            <span>Không tìm thấy lỗi dữ liệu nào! Bảng của bạn đã được chuẩn hóa.</span>
          </div>
        ) : (
          <div className="flex-grow overflow-y-auto flex flex-col gap-3 pr-2">
            {danhSachLoi.map((loi, index) => (
              <div 
                key={`err-${index}`}
                className="border border-[#E5E7EB] border-l-4 border-l-red-500 bg-[#F8F9FA] p-3 flex justify-between items-start text-xs rounded"
              >
                <div>
                  <div className="font-semibold text-gray-800">{loi.tenLoi}</div>
                  <div className="text-gray-500 mt-1">{loi.moTa}</div>
                </div>
                <button
                  onClick={() => suaMotLoi(index)}
                  className="px-2 py-1 bg-white border border-[#E5E7EB] hover:bg-[#EFF6FF] text-[#2563EB] font-bold text-[11px] transition rounded"
                >
                  Sửa nhanh
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
