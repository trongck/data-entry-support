'use client';

import React, { useState, useRef } from 'react';
import { useKhoLuuTru } from '../store/khoLuuTru';
import { xuatExcelBangDauRa } from '../services/dichVu';
import { FileCode, Upload, Cpu, Download, Plus, Trash2 } from 'lucide-react';

export default function DocJsonExcel() {
  const [jsonText, setJsonText] = useState('');
  const [dangXuLy, setDangXuLy] = useState(false);
  const [duLieuXemTruoc, setDuLieuXemTruoc] = useState<any[]>([]);
  const [cacCotXemTruoc, setCacCotXemTruoc] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setThongBao, customApiKey, customModel } = useKhoLuuTru();

  // Đọc từ file JSON tải lên
  const xuLyTaiFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      setJsonText(text);
      setThongBao({ loai: 'thanh-cong', noiDung: `Đã đọc tệp: ${file.name}` });
    };
    reader.readAsText(file);
  };

  // Phân tích JSON thông minh qua Gemini
  const batDauPhanTich = async () => {
    if (!jsonText.trim()) {
      setThongBao({ loai: 'canh-bao', noiDung: 'Vui lòng nhập hoặc tải lên chuỗi JSON!' });
      return;
    }

    setDangXuLy(true);
    try {
      const res = await fetch('/api/json', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(customApiKey ? { 'x-gemini-api-key': customApiKey } : {}),
          ...(customModel ? { 'x-gemini-model': customModel } : {}),
        },
        body: JSON.stringify({ jsonString: jsonText })
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Lỗi server');
      }

      setDuLieuXemTruoc(result.duLieu || []);
      setCacCotXemTruoc(result.columns || []);
      setThongBao({ loai: 'thanh-cong', noiDung: 'Đã phân tích JSON thành cấu trúc bảng phẳng!' });

    } catch (e: any) {
      console.error(e);
      setThongBao({ loai: 'loi', noiDung: e.message || 'Lỗi phân tích JSON bằng AI' });
    } finally {
      setDangXuLy(false);
    }
  };

  // Chỉnh sửa ô trong bảng preview
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
      {/* 1. Left Input Area */}
      <div className="w-1/2 flex flex-col gap-4 overflow-hidden h-full border border-[#E5E7EB] bg-[#F8F9FA] p-5 rounded-xl">
        <div className="flex justify-between items-center flex-shrink-0">
          <div>
            <h3 className="font-bold text-[#1A1A2E] text-base">Đọc dữ liệu JSON thông minh</h3>
            <p className="text-xs text-gray-500 mt-1">Dán chuỗi JSON hoặc tải tệp JSON lên để AI chuyển đổi thành bảng.</p>
          </div>
          
          <div className="flex gap-2">
            <input 
              ref={fileInputRef}
              type="file" 
              accept=".json" 
              onChange={xuLyTaiFile} 
              className="hidden" 
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E5E7EB] hover:bg-[#F8F9FA] text-xs font-bold text-gray-700 rounded-lg shadow-sm transition"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Tải file .json</span>
            </button>
          </div>
        </div>

        <textarea
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          placeholder={`Nhập hoặc dán JSON của bạn tại đây...\n\nVí dụ:\n[\n  { "Ma": "NV01", "Ten": "Nguyen Van A", "ChiTiet": { "BoPhan": "Ke Toan", "Luong": 15000000 } }\n]`}
          className="flex-grow border border-[#E5E7EB] p-4 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs font-mono resize-none bg-white rounded-lg shadow-inner"
        />

        <button
          onClick={batDauPhanTich}
          disabled={!jsonText.trim() || dangXuLy}
          className="w-full flex items-center justify-center gap-2 py-3 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed transition rounded-lg shadow-sm"
        >
          <Cpu className={`w-4 h-4 ${dangXuLy ? 'animate-spin' : ''}`} />
          <span>{dangXuLy ? 'AI Đang phân tích...' : 'Phân tích JSON bằng AI'}</span>
        </button>
      </div>

      {/* 2. Right Preview Table */}
      <div className="w-1/2 flex flex-col gap-4 overflow-hidden h-full">
        <div className="flex justify-between items-center flex-shrink-0">
          <div>
            <h3 className="font-bold text-[#1A1A2E] text-base flex items-center gap-2">
              Bảng dữ liệu phẳng xem trước
            </h3>
            <p className="text-xs text-gray-500 mt-1">Xem dữ liệu JSON đã được làm phẳng thành cột/dòng và có thể chỉnh sửa.</p>
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
              <span>Xuất Excel</span>
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
                  <td colSpan={cacCotXemTruoc.length + 2} className="text-center py-24 text-gray-400 text-xs">
                    Chưa có dữ liệu. Vui lòng dán chuỗi JSON ở bên trái và bấm phân tích AI.
                  </td>
                </tr>
              ) : (
                duLieuXemTruoc.map((dong, idx) => (
                  <tr key={`json-${idx}`} className="hover:bg-violet-50/10 transition-colors">
                    <td className="border border-[#E5E7EB] text-center font-bold text-gray-400 bg-[#F8F9FA]">{idx + 1}</td>
                    {cacCotXemTruoc.map(cot => {
                      const val = dong[cot];
                      return (
                        <td
                          key={`json-${idx}-${cot}`}
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => suaOXemTruoc(idx, cot, e.target.innerText)}
                          className="border border-[#E5E7EB] px-3 py-2 text-ellipsis overflow-hidden whitespace-nowrap outline-none focus:bg-violet-50/30 focus:ring-1 focus:ring-violet-400"
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
