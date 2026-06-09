'use client';

import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { useKhoLuuTru } from '../store/khoLuuTru';
import { xuatExcelBangDauRa, docDuLieuCsv } from '../services/dichVu';
import { Sparkles, Upload, Clipboard, Cpu, Download, Plus, Trash2, HelpCircle } from 'lucide-react';

export default function ChuanHoaDuLieu() {
  const [originalData, setOriginalData] = useState<any[]>([]);
  const [originalColumns, setOriginalColumns] = useState<string[]>([]);
  const [customRequirements, setCustomRequirements] = useState('');
  const [dangXuLy, setDangXuLy] = useState(false);
  const [importedFilename, setImportedFilename] = useState('');

  const [duLieuXemTruoc, setDuLieuXemTruoc] = useState<any[]>([]);
  const [cacCotXemTruoc, setCacCotXemTruoc] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setThongBao, customApiKey, customModel } = useKhoLuuTru();

  // Đọc từ Clipboard
  const docTuClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) {
        setThongBao({ loai: 'canh-bao', noiDung: 'Bộ nhớ đệm rỗng!' });
        return;
      }
      
      // Giả lập đọc CSV/TSV từ clipboard
      const parsed = docDuLieuCsv(text.replace(/\t/g, ','));
      if (parsed.duLieu.length > 0) {
        setOriginalData(parsed.duLieu);
        setOriginalColumns(parsed.columns);
        setImportedFilename('Dữ liệu từ Clipboard');
        setThongBao({ loai: 'thanh-cong', noiDung: `Đã dán ${parsed.duLieu.length} dòng từ clipboard!` });
      } else {
        setThongBao({ loai: 'loi', noiDung: 'Không nhận diện được định dạng bảng!' });
      }
    } catch (e) {
      setThongBao({ loai: 'loi', noiDung: 'Không thể truy cập Clipboard!' });
    }
  };

  // Tải lên tệp Excel
  const xuLyTaiFileExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        if (data.length === 0) {
          setThongBao({ loai: 'canh-bao', noiDung: 'Tệp Excel không chứa dữ liệu!' });
          return;
        }

        const cols = new Set<string>();
        data.forEach((row: any) => {
          Object.keys(row).forEach(k => cols.add(k));
        });

        setOriginalData(data);
        setOriginalColumns(Array.from(cols));
        setImportedFilename(file.name);
        setThongBao({ loai: 'thanh-cong', noiDung: `Đã tải lên tệp: ${file.name}` });
      } catch (err) {
        setThongBao({ loai: 'loi', noiDung: 'Lỗi định dạng tệp Excel!' });
      }
    };
    reader.readAsBinaryString(file);
  };

  // Thực hiện chuẩn hóa AI
  const thucHienChuanHoa = async () => {
    if (originalData.length === 0) {
      setThongBao({ loai: 'canh-bao', noiDung: 'Vui lòng nhập dữ liệu nguồn trước!' });
      return;
    }

    setDangXuLy(true);
    try {
      const res = await fetch('/api/normalize', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(customApiKey ? { 'x-gemini-api-key': customApiKey } : {}),
          ...(customModel ? { 'x-gemini-model': customModel } : {}),
        },
        body: JSON.stringify({
          columns: originalColumns,
          rows: originalData,
          customRequirements: customRequirements
        })
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Lỗi server');
      }

      setDuLieuXemTruoc(result.duLieu || []);
      setCacCotXemTruoc(result.columns || []);
      setThongBao({ loai: 'thanh-cong', noiDung: 'Đã hoàn tất chuẩn hóa dữ liệu bằng AI!' });
    } catch (e: any) {
      console.error(e);
      setThongBao({ loai: 'loi', noiDung: e.message || 'Lỗi chuẩn hóa dữ liệu' });
    } finally {
      setDangXuLy(false);
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
      {/* 1. Left Control Panel */}
      <div className="w-80 border border-[#E5E7EB] bg-[#F8F9FA] p-5 flex flex-col gap-5 overflow-y-auto rounded-xl">
        <div>
          <h3 className="font-bold text-[#1A1A2E] text-base flex items-center gap-1.5">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            <span>Chuẩn hóa dữ liệu thông minh</span>
          </h3>
          <p className="text-xs text-gray-500 mt-1">Làm sạch bảng biểu, tự động sửa lỗi chính tả, hoa thường, số điện thoại, ngày tháng và xử lý yêu cầu riêng.</p>
        </div>

        {/* Input selectors */}
        <div className="flex flex-col gap-2.5">
          <input 
            ref={fileInputRef}
            type="file" 
            accept=".xlsx,.xls,.csv" 
            onChange={xuLyTaiFileExcel} 
            className="hidden" 
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-lg shadow-sm transition"
          >
            <Upload className="w-4 h-4 text-gray-500" />
            <span>Tải lên tệp Excel (.xlsx, .xls)</span>
          </button>
          
          <button
            onClick={docTuClipboard}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-lg shadow-sm transition"
          >
            <Clipboard className="w-4 h-4 text-gray-500" />
            <span>Dán dữ liệu từ Clipboard</span>
          </button>
        </div>

        {importedFilename && (
          <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-lg flex flex-col gap-1 shadow-sm">
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Tệp nguồn</span>
            <span className="text-xs font-bold text-indigo-900 truncate">{importedFilename}</span>
            <span className="text-[10px] text-indigo-600 font-medium">{originalData.length} dòng & {originalColumns.length} cột đã đọc</span>
          </div>
        )}

        {/* Custom Requirements Textbox */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
            Yêu cầu chuẩn hóa riêng (nếu có)
          </label>
          <textarea
            value={customRequirements}
            onChange={(e) => setCustomRequirements(e.target.value)}
            placeholder="Ví dụ:&#10;- Đổi cột giới tính 'M' thành 'Nam', 'F' thành 'Nữ'&#10;- Tính thêm cột Tổng điểm = Toán + Văn + Anh&#10;- Đổi tên cột 'Mã hàng' thành 'Mã sản phẩm'"
            className="w-full h-32 border border-gray-200 p-2.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs bg-white rounded-lg resize-none"
          />
        </div>

        {/* Info panel of presets */}
        <div className="bg-gray-100/70 p-3 rounded-lg border border-gray-200">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5" /> Quy tắc AI mặc định
          </span>
          <ul className="list-disc pl-4 text-[10px] text-gray-500 space-y-1 mt-1.5 font-medium">
            <li>Tự động xóa khoảng trắng thừa đầu, giữa, cuối.</li>
            <li>Định dạng viết hoa chữ cái đầu đối với Họ tên.</li>
            <li>Chuẩn hóa số điện thoại theo định dạng Việt Nam.</li>
            <li>Chuẩn hóa ngày tháng về định dạng DD/MM/YYYY.</li>
          </ul>
        </div>

        {dangXuLy && (
          <div className="flex items-center gap-2 bg-indigo-50/50 p-3 rounded-lg border border-indigo-100">
            <div className="w-4 h-4 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            <span className="text-[11px] font-bold text-indigo-700">AI đang phân tích và chuẩn hóa...</span>
          </div>
        )}

        <button
          onClick={thucHienChuanHoa}
          disabled={originalData.length === 0 || dangXuLy}
          className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed transition rounded-lg shadow-sm"
        >
          <Cpu className="w-4 h-4 animate-pulse" />
          <span>Bắt đầu chuẩn hóa AI</span>
        </button>
      </div>

      {/* 2. Right preview editor panel */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden h-full">
        <div className="flex justify-between items-center flex-shrink-0">
          <div>
            <h3 className="font-bold text-[#1A1A2E] text-base">Bảng dữ liệu sau chuẩn hóa</h3>
            <p className="text-xs text-gray-500 mt-1">Dữ liệu được chuẩn hóa thông minh bởi AI. Xem trước và chỉnh sửa trực tiếp trước khi xuất.</p>
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
                    Chưa có dữ liệu chuẩn hóa. Vui lòng dán dữ liệu hoặc tải lên tệp Excel nguồn, nhập yêu cầu chuẩn hóa riêng và bấm "Bắt đầu chuẩn hóa AI".
                  </td>
                </tr>
              ) : (
                duLieuXemTruoc.map((dong, idx) => (
                  <tr key={`norm-${idx}`} className="hover:bg-indigo-50/10 transition-colors">
                    <td className="border border-[#E5E7EB] text-center font-bold text-gray-400 bg-[#F8F9FA]">{idx + 1}</td>
                    {cacCotXemTruoc.map(cot => {
                      const val = dong[cot];
                      return (
                        <td
                          key={`norm-${idx}-${cot}`}
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => suaOXemTruoc(idx, cot, e.target.innerText)}
                          className="border border-[#E5E7EB] px-3 py-2 text-ellipsis overflow-hidden whitespace-nowrap outline-none focus:bg-indigo-50/30 focus:ring-1 focus:ring-indigo-400"
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
