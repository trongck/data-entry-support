'use client';

import React, { useState, useRef } from 'react';
import { useKhoLuuTru } from '../store/khoLuuTru';
import { xuatExcelBangDauRa } from '../services/dichVu';
import { UploadCloud, Check, FileCode, Cpu, Download, Plus, Trash2 } from 'lucide-react';

export default function ChuyenAnhExcel() {
  const [anhSrc, setAnhSrc] = useState<string | null>(null);
  const [dangOcr, setDangOcr] = useState(false);
  const [phanTramOcr, setPhanTramOcr] = useState(0);
  const [trangThaiOcr, setTrangThaiOcr] = useState('');
  const [vanBanTho, setVanBanTho] = useState('');
  const [duLieuXemTruoc, setDuLieuXemTruoc] = useState<any[]>([]);
  const [cacCotXemTruoc, setCacCotXemTruoc] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setThongBao, customApiKey, customModel } = useKhoLuuTru();

  // Chọn ảnh nguồn
  const xuLyChonAnh = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setAnhSrc(event.target?.result as string);
      setThongBao({ loai: 'thanh-cong', noiDung: 'Đã tải ảnh lên! Hãy bấm phân tích bằng AI.' });
    };
    reader.readAsDataURL(file);
  };

  // Kích hoạt quét OCR bằng AI Gemini
  const thucHienQuetOcr = async () => {
    if (!anhSrc) return;

    setDangOcr(true);
    setPhanTramOcr(20);
    setTrangThaiOcr('Đang tải hình ảnh và kết nối AI...');

    try {
      setPhanTramOcr(50);
      setTrangThaiOcr('AI đang phân tích cấu trúc dòng và cột...');
      
      const response = await fetch('/api/ocr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(customApiKey ? { 'x-gemini-api-key': customApiKey } : {}),
          ...(customModel ? { 'x-gemini-model': customModel } : {}),
        },
        body: JSON.stringify({ imageBase64: anhSrc }),
      });

      setPhanTramOcr(80);
      setTrangThaiOcr('Đang định dạng bảng dữ liệu...');

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Lỗi xử lý AI từ server');
      }

      const parsedList = result.duLieu || [];
      const parsedColumns = result.columns || [];

      setDuLieuXemTruoc(parsedList);
      setCacCotXemTruoc(parsedColumns);
      setVanBanTho(JSON.stringify(parsedList, null, 2));
      
      setTrangThaiOcr('Phân tích hoàn tất!');
      setPhanTramOcr(100);
      setThongBao({ loai: 'thanh-cong', noiDung: 'Đã trích xuất thành công dữ liệu bảng!' });

    } catch (error: any) {
      console.error(error);
      setTrangThaiOcr('Lỗi phân tích AI!');
      setThongBao({ loai: 'loi', noiDung: error.message || 'Không thể xử lý hình ảnh này!' });
    } finally {
      setDangOcr(false);
    }
  };

  // Cập nhật lại danh sách xem trước khi thay đổi văn bản JSON thô
  const capNhatBangXemTruoc = (vanBanMoi: string) => {
    setVanBanTho(vanBanMoi);
    try {
      const parsed = JSON.parse(vanBanMoi);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setDuLieuXemTruoc(parsed);
        const keysSet = new Set<string>();
        parsed.forEach(item => {
          Object.keys(item).forEach(k => keysSet.add(k));
        });
        setCacCotXemTruoc(Array.from(keysSet));
      }
    } catch (e) {
      // Bỏ qua lỗi cú pháp JSON khi đang nhập dở
    }
  };

  // Chỉnh sửa trực tiếp trên ô xem trước
  const suaOXemTruoc = (idx: number, cotId: string, value: string) => {
    const copyList = [...duLieuXemTruoc];
    if (copyList[idx]) {
      copyList[idx][cotId] = value;
      setDuLieuXemTruoc(copyList);
      setVanBanTho(JSON.stringify(copyList, null, 2));
    }
  };

  // Thêm một dòng mới vào bảng xem trước
  const themDongMoi = () => {
    if (cacCotXemTruoc.length === 0) {
      setThongBao({ loai: 'canh-bao', noiDung: 'Chưa có cấu trúc cột để thêm dòng mới!' });
      return;
    }
    const dongMoi: Record<string, any> = {};
    cacCotXemTruoc.forEach(cot => {
      dongMoi[cot] = '';
    });
    const duLieuMoi = [...duLieuXemTruoc, dongMoi];
    setDuLieuXemTruoc(duLieuMoi);
    setVanBanTho(JSON.stringify(duLieuMoi, null, 2));
    setThongBao({ loai: 'thanh-cong', noiDung: 'Đã thêm một dòng trống mới!' });
  };

  // Xóa một dòng tại chỉ số index
  const xoaDong = (idx: number) => {
    const duLieuMoi = duLieuXemTruoc.filter((_, i) => i !== idx);
    setDuLieuXemTruoc(duLieuMoi);
    setVanBanTho(JSON.stringify(duLieuMoi, null, 2));
    setThongBao({ loai: 'thanh-cong', noiDung: 'Đã xóa dòng được chọn!' });
  };

  // Xuất file Excel trực tiếp
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
          <h3 className="font-bold text-[#1A1A2E] text-base">Chuyển ảnh thành Excel</h3>
          <p className="text-xs text-gray-500 mt-1">Trích xuất bảng biểu từ hình ảnh hóa đơn, phiếu nhập kho, bảng lương...</p>
        </div>
        
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 hover:border-blue-500 bg-white p-6 text-center cursor-pointer transition-all flex flex-col items-center gap-3 rounded-lg hover:bg-blue-50/20"
        >
          <UploadCloud className="w-10 h-10 text-blue-500" />
          <div>
            <p className="text-xs font-bold text-[#1A1A2E]">Kéo thả hoặc nhấp để tải ảnh</p>
            <span className="text-[10px] text-gray-400 block mt-1">Hỗ trợ PNG, JPG, JPEG</span>
          </div>
        </div>
        <input 
          ref={fileInputRef}
          type="file" 
          accept="image/*" 
          onChange={xuLyChonAnh} 
          className="hidden" 
        />

        {anhSrc && (
          <div className="border border-[#E5E7EB] bg-white p-2.5 rounded-lg shadow-sm">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Ảnh đã chọn</span>
            <img src={anhSrc} alt="Preview" className="max-w-full max-h-44 object-contain mx-auto rounded border" />
          </div>
        )}

        {dangOcr || phanTramOcr > 0 ? (
          <div className="flex flex-col gap-2 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
            <div className="flex justify-between items-center text-[11px] font-bold text-blue-700">
              <span>{trangThaiOcr}</span>
              <span>{phanTramOcr}%</span>
            </div>
            <div className="h-1.5 w-full bg-blue-200/50 rounded-full overflow-hidden">
              <div style={{ width: `${phanTramOcr}%` }} className="h-full bg-blue-600 transition-all duration-300" />
            </div>
          </div>
        ) : null}

        <button
          onClick={thucHienQuetOcr}
          disabled={!anhSrc || dangOcr}
          className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed transition rounded-lg shadow-sm"
        >
          <Cpu className="w-4 h-4 animate-pulse" />
          <span>Bắt đầu phân tích AI (OCR)</span>
        </button>
      </div>

      {/* 2. Right preview editor panel */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden h-full">
        <div className="flex justify-between items-center flex-shrink-0">
          <div>
            <h3 className="font-bold text-[#1A1A2E] text-base flex items-center gap-2">
              Bảng dữ liệu xem trước & Sửa đổi
            </h3>
            <p className="text-xs text-gray-500 mt-1">Sửa đổi trực tiếp trên bảng hoặc chỉnh sửa JSON bên dưới trước khi xuất ra Excel.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={themDongMoi}
              disabled={duLieuXemTruoc.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold rounded-lg transition"
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

        <div className="flex-1 grid grid-rows-[120px_1fr] gap-4 overflow-hidden">
          {/* Raw Text Output */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-gray-500 flex items-center gap-1">
              <FileCode className="w-4 h-4" /> Chuỗi cấu trúc JSON (Sửa trực tiếp để cập nhật bảng):
            </span>
            <textarea
              value={vanBanTho}
              onChange={(e) => capNhatBangXemTruoc(e.target.value)}
              placeholder="Dữ liệu JSON phân tích từ AI sẽ xuất hiện tại đây..."
              className="flex-1 border border-[#E5E7EB] p-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs font-mono resize-none bg-white rounded-lg"
            />
          </div>

          {/* Grid Preview Editor */}
          <div className="flex flex-col gap-2 overflow-hidden">
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-extrabold rounded-md flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5" /> GEMINI AI VISION
              </span>
              <span className="text-[11px] text-gray-400">Nhấp đúp vào ô để sửa dữ liệu, bấm biểu tượng Thùng rác để xóa hàng.</span>
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
                      <td colSpan={cacCotXemTruoc.length + 2} className="text-center py-20 text-gray-400 text-xs">
                        Chưa có dữ liệu. Vui lòng chọn ảnh và nhấn quét AI.
                      </td>
                    </tr>
                  ) : (
                    duLieuXemTruoc.map((dong, idx) => (
                      <tr key={`ocr-${idx}`} className="hover:bg-blue-50/20 transition-colors">
                        <td className="border border-[#E5E7EB] text-center font-bold text-gray-400 bg-[#F8F9FA]">{idx + 1}</td>
                        {cacCotXemTruoc.map(cot => {
                          const val = dong[cot];
                          return (
                            <td
                              key={`ocr-${idx}-${cot}`}
                              contentEditable
                              suppressContentEditableWarning
                              onBlur={(e) => suaOXemTruoc(idx, cot, e.target.innerText)}
                              className="border border-[#E5E7EB] px-3 py-2 text-ellipsis overflow-hidden whitespace-nowrap outline-none focus:bg-blue-50/50 focus:ring-1 focus:ring-blue-400"
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
      </div>
    </div>
  );
}
