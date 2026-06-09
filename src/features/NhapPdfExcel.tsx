'use client';

import React, { useState, useRef } from 'react';
import { useKhoLuuTru } from '../store/khoLuuTru';
import { xuatExcelBangDauRa } from '../services/dichVu';
import { FileText, UploadCloud, Cpu, Download, Plus, Trash2, Tag, X } from 'lucide-react';

export default function NhapPdfExcel() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [truongCanBoc, setTruongCanBoc] = useState<string[]>([]);
  const [truongMoi, setTruongMoi] = useState('');
  
  const [dangXuLy, setDangXuLy] = useState(false);
  const [trangThaiPdf, setTrangThaiPdf] = useState('');
  const [duLieuXemTruoc, setDuLieuXemTruoc] = useState<any[]>([]);
  const [cacCotXemTruoc, setCacCotXemTruoc] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setThongBao, customApiKey, customModel } = useKhoLuuTru();

  // Đọc tệp PDF và chuyển sang Base64
  const xuLyChonPdf = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setThongBao({ loai: 'loi', noiDung: 'Vui lòng chọn tệp định dạng PDF!' });
      return;
    }

    setPdfFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setPdfBase64(event.target?.result as string);
      setThongBao({ loai: 'thanh-cong', noiDung: `Đã chọn tệp PDF: ${file.name}` });
    };
    reader.readAsDataURL(file);
  };

  // Thêm trường cần bóc tách
  const themTruongMoi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!truongMoi.trim()) return;
    if (truongCanBoc.includes(truongMoi.trim())) {
      setThongBao({ loai: 'canh-bao', noiDung: 'Trường này đã có trong danh sách!' });
      return;
    }
    setTruongCanBoc([...truongCanBoc, truongMoi.trim()]);
    setTruongMoi('');
  };

  // Xóa trường bóc tách
  const xoaTruong = (val: string) => {
    setTruongCanBoc(truongCanBoc.filter(t => t !== val));
  };

  // Gọi AI trích xuất dữ liệu
  const batDauTrichXuat = async () => {
    if (!pdfBase64) {
      setThongBao({ loai: 'canh-bao', noiDung: 'Vui lòng tải lên tài liệu PDF!' });
      return;
    }

    setDangXuLy(true);
    setTrangThaiPdf('Đang truyền tải PDF và kết nối AI...');

    try {
      const response = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(customApiKey ? { 'x-gemini-api-key': customApiKey } : {}),
          ...(customModel ? { 'x-gemini-model': customModel } : {}),
        },
        body: JSON.stringify({
          pdfBase64: pdfBase64,
          fields: truongCanBoc
        })
      });

      setTrangThaiPdf('AI đang phân tích và bóc tách thông tin...');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Lỗi server');
      }

      setDuLieuXemTruoc(result.duLieu || []);
      setCacCotXemTruoc(result.columns || []);
      setThongBao({ loai: 'thanh-cong', noiDung: 'Đã trích xuất thông tin PDF thành công!' });
    } catch (e: any) {
      console.error(e);
      setThongBao({ loai: 'loi', noiDung: e.message || 'Lỗi xử lý trích xuất PDF' });
    } finally {
      setDangXuLy(false);
      setTrangThaiPdf('');
    }
  };

  // Chỉnh sửa trực tiếp
  const suaOXemTruoc = (idx: number, cotId: string, value: string) => {
    const copyList = [...duLieuXemTruoc];
    if (copyList[idx]) {
      copyList[idx][cotId] = value;
      setDuLieuXemTruoc(copyList);
    }
  };

  // Thêm dòng mới
  const themDongMoi = () => {
    if (cacCotXemTruoc.length === 0) {
      setThongBao({ loai: 'canh-bao', noiDung: 'Chưa có cấu trúc cột để thêm dòng mới!' });
      return;
    }
    const dongMoi: Record<string, any> = {};
    cacCotXemTruoc.forEach(cot => {
      dongMoi[cot] = '';
    });
    setDuLieuXemTruoc([...duLieuXemTruoc, dongMoi]);
    setThongBao({ loai: 'thanh-cong', noiDung: 'Đã thêm một dòng trống mới!' });
  };

  // Xóa dòng
  const xoaDong = (idx: number) => {
    const duLieuMoi = duLieuXemTruoc.filter((_, i) => i !== idx);
    setDuLieuXemTruoc(duLieuMoi);
    setThongBao({ loai: 'thanh-cong', noiDung: 'Đã xóa dòng được chọn!' });
  };

  // Xuất file Excel
  const xuatFileExcel = () => {
    if (duLieuXemTruoc.length === 0) return;
    xuatExcelBangDauRa(duLieuXemTruoc, cacCotXemTruoc);
    setThongBao({ loai: 'thanh-cong', noiDung: 'Đã xuất và tải xuống tệp Excel thành công!' });
  };

  return (
    <div className="flex-1 flex gap-6 overflow-hidden h-full">
      {/* 1. Left controls panel */}
      <div className="w-80 border border-[#E5E7EB] bg-[#F8F9FA] p-5 flex flex-col gap-5 overflow-y-auto rounded-xl">
        <div>
          <h3 className="font-bold text-[#1A1A2E] text-base">Nhập liệu từ PDF thông minh</h3>
          <p className="text-xs text-gray-500 mt-1">Bóc tách các trường thông tin cụ thể từ tài liệu báo cáo, hợp đồng hoặc biên bản PDF.</p>
        </div>

        {/* File Uploader */}
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 hover:border-red-500 bg-white p-6 text-center cursor-pointer transition-all flex flex-col items-center gap-3 rounded-lg hover:bg-red-50/20"
        >
          <UploadCloud className="w-10 h-10 text-red-500" />
          <div>
            <p className="text-xs font-bold text-[#1A1A2E]">Nhấp để tải lên tệp PDF</p>
            <span className="text-[10px] text-gray-400 block mt-1">Tải tệp .pdf để AI phân tích</span>
          </div>
        </div>
        <input 
          ref={fileInputRef}
          type="file" 
          accept="application/pdf" 
          onChange={xuLyChonPdf} 
          className="hidden" 
        />

        {pdfFile && (
          <div className="border border-[#E5E7EB] bg-white p-3 rounded-lg shadow-sm flex items-center gap-2">
            <FileText className="w-8 h-8 text-red-500 flex-shrink-0" />
            <div className="overflow-hidden">
              <span className="text-xs font-bold text-[#1A1A2E] block truncate">{pdfFile.name}</span>
              <span className="text-[10px] text-gray-400">{(pdfFile.size / 1024 / 1024).toFixed(2)} MB</span>
            </div>
          </div>
        )}

        {/* Configuration of extraction fields */}
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-bold text-gray-500 flex items-center gap-1">
            <Tag className="w-3.5 h-3.5" /> Các trường thông tin cần bóc tách:
          </span>
          <div className="flex flex-wrap gap-1.5 p-2 border border-gray-200 bg-white rounded-lg min-h-[80px]">
            {truongCanBoc.map(truong => (
              <span 
                key={truong} 
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 border border-red-100 text-red-700 text-[10px] font-bold rounded"
              >
                {truong}
                <button type="button" onClick={() => xoaTruong(truong)} className="hover:text-red-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          <form onSubmit={themTruongMoi} className="flex gap-2 mt-1">
            <input 
              type="text" 
              value={truongMoi}
              onChange={(e) => setTruongMoi(e.target.value)}
              placeholder="Thêm cột mới..."
              className="flex-1 border border-gray-200 px-3 py-1.5 text-xs outline-none focus:border-red-500 rounded-lg"
            />
            <button 
              type="submit" 
              className="px-3 bg-red-500 text-white font-bold text-xs hover:bg-red-600 rounded-lg transition"
            >
              Thêm
            </button>
          </form>
        </div>

        {dangXuLy && (
          <div className="flex flex-col gap-1.5 bg-red-50/50 p-3 rounded-lg border border-red-100">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-red-200 border-t-red-600 rounded-full animate-spin" />
              <span className="text-[11px] font-bold text-red-700">{trangThaiPdf}</span>
            </div>
          </div>
        )}

        <button
          onClick={batDauTrichXuat}
          disabled={!pdfBase64 || dangXuLy}
          className="w-full flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-700 text-white text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed transition rounded-lg shadow-sm"
        >
          <Cpu className="w-4 h-4" />
          <span>Bắt đầu bóc tách PDF</span>
        </button>
      </div>

      {/* 2. Right preview editor panel */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden h-full">
        <div className="flex justify-between items-center flex-shrink-0">
          <div>
            <h3 className="font-bold text-[#1A1A2E] text-base">Bảng thông tin bóc tách từ PDF</h3>
            <p className="text-xs text-gray-500 mt-1">Kết quả bóc tách tự động bằng AI, bạn có thể chỉnh sửa trực tiếp dữ liệu trước khi xuất Excel.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={themDongMoi}
              disabled={duLieuXemTruoc.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 hover:bg-gray-50 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold rounded-lg transition"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm dòng</span>
            </button>
            <button
              onClick={xuatFileExcel}
              disabled={duLieuXemTruoc.length === 0}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold rounded-lg shadow-sm transition"
            >
              <Download className="w-4 h-4" />
              <span>Xuất file Excel</span>
            </button>
          </div>
        </div>

        <div className="flex-1 border border-[#E5E7EB] overflow-auto bg-white rounded-lg shadow-inner">
          <table className="w-full border-collapse table-fixed text-[13px] text-[#1A1A2E]">
            <thead className="sticky top-0 bg-[#F8F9FA] z-10 shadow-[0_1px_0_rgba(0,0,0,0.08)]">
              <tr>
                <th className="w-[50px] border border-[#E5E7EB] bg-[#F8F9FA] px-2 py-2.5 text-center font-bold">STT</th>
                {cacCotXemTruoc.map(cot => (
                  <th key={cot} style={{ width: 160 }} className="border border-[#E5E7EB] px-3 py-2.5 text-left font-bold text-gray-700">
                    {cot}
                  </th>
                ))}
                <th className="w-[60px] border border-[#E5E7EB] bg-[#F8F9FA] px-2 py-2.5 text-center font-bold">Xóa</th>
              </tr>
            </thead>
            <tbody>
              {duLieuXemTruoc.length === 0 ? (
                <tr>
                  <td colSpan={cacCotXemTruoc.length + 2} className="text-center py-28 text-gray-400 text-xs">
                    Chưa có dữ liệu trích xuất. Vui lòng tải lên file PDF và bấm "Bắt đầu bóc tách PDF".
                  </td>
                </tr>
              ) : (
                duLieuXemTruoc.map((dong, idx) => (
                  <tr key={`pdf-${idx}`} className="hover:bg-red-50/10 transition-colors">
                    <td className="border border-[#E5E7EB] text-center font-bold text-gray-400 bg-[#F8F9FA]">{idx + 1}</td>
                    {cacCotXemTruoc.map(cot => {
                      const val = dong[cot];
                      return (
                        <td
                          key={`pdf-${idx}-${cot}`}
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => suaOXemTruoc(idx, cot, e.target.innerText)}
                          className="border border-[#E5E7EB] px-3 py-2 text-ellipsis overflow-hidden whitespace-nowrap outline-none focus:bg-red-50/30 focus:ring-1 focus:ring-red-400"
                        >
                          {String(val !== undefined && val !== null ? val : '')}
                        </td>
                      );
                    })}
                    <td className="border border-[#E5E7EB] text-center bg-[#F8F9FA]">
                      <button
                        onClick={() => xoaDong(idx)}
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition"
                        title="Xóa hàng"
                      >
                        <Trash2 className="w-3.5 h-3.5 mx-auto" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
