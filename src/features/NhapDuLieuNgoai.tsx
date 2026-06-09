'use client';

import React, { useState } from 'react';
import { useKhoLuuTru } from '../store/khoLuuTru';
import { docDuLieuCsv, docDuLieuJson } from '../services/dichVu';
import { Clipboard, FileSpreadsheet, CheckCircle2 } from 'lucide-react';

export default function NhapDuLieuNgoai() {
  const [noiDungTho, setNoiDungTho] = useState('');
  const [kieuNhap, setKieuNhap] = useState<'csv' | 'json' | 'tsv'>('csv');
  const [duLieuXemTruoc, setDuLieuXemTruoc] = useState<any[]>([]);
  const [cacCotXemTruoc, setCacCotXemTruoc] = useState<string[]>([]);

  const { duLieu, capNhatDuLieuVaCot, setThongBao, chuyenPhanHe } = useKhoLuuTru();

  // Đọc từ clipboard
  const docClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setNoiDungTho(text);
      chuyenDoiSangDuLieu(text, kieuNhap);
      setThongBao({ loai: 'thanh-cong', noiDung: 'Đã dán dữ liệu từ bộ nhớ tạm!' });
    } catch (e) {
      setThongBao({ loai: 'loi', noiDung: 'Không thể truy cập Clipboard!' });
    }
  };

  // Đọc từ tệp CSV/JSON tải lên
  const xuLyTaiFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      setNoiDungTho(text);
      
      const type = file.name.endsWith('.json') ? 'json' : file.name.endsWith('.tsv') ? 'tsv' : 'csv';
      setKieuNhap(type);
      chuyenDoiSangDuLieu(text, type);
      setThongBao({ loai: 'thanh-cong', noiDung: `Đã đọc file: ${file.name}` });
    };
    reader.readAsText(file);
  };

  // Convert raw text to preview grid rows
  const chuyenDoiSangDuLieu = (text: string, format: typeof kieuNhap) => {
    let resObj: { columns: string[], duLieu: any[] } = { columns: [], duLieu: [] };
    if (format === 'json') {
      resObj = docDuLieuJson(text);
    } else {
      resObj = docDuLieuCsv(text);
    }
    setDuLieuXemTruoc(resObj.duLieu);
    setCacCotXemTruoc(resObj.columns);
  };

  const thayDoiNoiDungTho = (val: string) => {
    setNoiDungTho(val);
    chuyenDoiSangDuLieu(val, kieuNhap);
  };

  const thayDoiDinhDang = (fmt: typeof kieuNhap) => {
    setKieuNhap(fmt);
    chuyenDoiSangDuLieu(noiDungTho, fmt);
  };

  // Chỉnh sửa trực tiếp
  const capNhatDongXemTruoc = (idx: number, cotId: string, val: string) => {
    const list = [...duLieuXemTruoc];
    if (list[idx]) {
      list[idx][cotId] = val;
      setDuLieuXemTruoc(list);
    }
  };

  // Đồng bộ vào kho lưu trữ chính
  const dongBoVaoBangChinh = () => {
    if (duLieuXemTruoc.length === 0) return;

    capNhatDuLieuVaCot(duLieuXemTruoc, cacCotXemTruoc);
    
    setThongBao({ loai: 'thanh-cong', noiDung: `Đồng bộ thành công ${duLieuXemTruoc.length} bản ghi với cấu trúc cột mới!` });
    setNoiDungTho('');
    setDuLieuXemTruoc([]);
    setCacCotXemTruoc([]);
    
    chuyenPhanHe('nhap-lieu-thu-cong');
  };

  return (
    <div className="flex-1 flex gap-6 overflow-hidden h-full">
      {/* 1. Left input panel */}
      <div className="w-1/2 flex flex-col gap-3 overflow-hidden h-full">
        <div className="flex justify-between items-center flex-shrink-0">
          <span className="font-semibold text-[#1A1A2E] text-sm">Nhập dữ liệu văn bản thô</span>
          
          <div className="flex gap-2">
            <button
              onClick={docClipboard}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E5E7EB] hover:bg-[#F8F9FA] text-xs font-semibold shadow-[0_1px_3px_rgba(0,0,0,0.08)] transition"
            >
              <Clipboard className="w-3.5 h-3.5" />
              <span>Dán Clipboard</span>
            </button>
            <input 
              type="file" 
              accept=".csv,.json,.txt,.tsv" 
              onChange={xuLyTaiFile} 
              id="file-import-input" 
              className="hidden" 
            />
            <button
              onClick={() => document.getElementById('file-import-input')?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E5E7EB] hover:bg-[#F8F9FA] text-xs font-semibold shadow-[0_1px_3px_rgba(0,0,0,0.08)] transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Tải file CSV/JSON</span>
            </button>
          </div>
        </div>

        <textarea
          value={noiDungTho}
          onChange={(e) => thayDoiNoiDungTho(e.target.value)}
          placeholder="Ví dụ dán CSV:&#10;Mã số,Họ tên,Lương,Bộ phận&#10;NV001,Nguyen Van A,15000000,Nhân sự"
          className="flex-grow border border-[#E5E7EB] p-3 outline-none focus:border-[#2563EB] text-xs font-mono resize-none bg-white rounded"
        />

        <div className="flex items-center gap-3 text-xs flex-shrink-0">
          <span className="font-semibold text-gray-700">Định dạng văn bản:</span>
          <select
            value={kieuNhap}
            onChange={(e) => thayDoiDinhDang(e.target.value as any)}
            className="border border-[#E5E7EB] px-2 py-1 outline-none bg-white focus:border-[#2563EB] rounded text-xs"
          >
            <option value="csv">CSV (Dấu phẩy)</option>
            <option value="tsv">TSV (Tab ngăn cách)</option>
            <option value="json">JSON format</option>
          </select>
        </div>
      </div>

      {/* 2. Right preview table */}
      <div className="w-1/2 flex flex-col gap-3 overflow-hidden h-full">
        <div className="flex justify-between items-center flex-shrink-0">
          <span className="font-semibold text-[#1A1A2E] text-sm">Xem trước bảng mapping</span>
          <button
            onClick={dongBoVaoBangChinh}
            disabled={duLieuXemTruoc.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold shadow-sm transition"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Đồng bộ vào bảng chính</span>
          </button>
        </div>

        <div className="flex-1 border border-[#E5E7EB] overflow-auto bg-white rounded">
          <table className="w-full border-collapse table-fixed text-[13px] text-[#1A1A2E]">
            <thead className="sticky top-0 bg-[#F8F9FA] z-10">
              <tr>
                <th className="w-[50px] border border-[#E5E7EB] bg-[#F8F9FA] px-2 py-2 text-center">STT</th>
                {cacCotXemTruoc.map(cot => (
                  <th key={cot} style={{ width: 150 }} className="border border-[#E5E7EB] px-3 py-2 text-left font-semibold">
                    {cot}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {duLieuXemTruoc.length === 0 ? (
                <tr>
                  <td colSpan={cacCotXemTruoc.length + 1} className="text-center p-12 text-gray-400">
                    Chưa có dữ liệu thô để hiển thị
                  </td>
                </tr>
              ) : (
                duLieuXemTruoc.map((dong, idx) => (
                  <tr key={`imp-${idx}`} className="hover:bg-[#F8F9FA]">
                    <td className="border border-[#E5E7EB] text-center font-medium text-gray-500 bg-[#F8F9FA]">{idx + 1}</td>
                    {cacCotXemTruoc.map(cot => {
                      const val = dong[cot];
                      return (
                        <td
                          key={`imp-${idx}-${cot}`}
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => capNhatDongXemTruoc(idx, cot, e.target.innerText)}
                          className="border border-[#E5E7EB] px-3 py-1 text-ellipsis overflow-hidden whitespace-nowrap outline-none focus:bg-blue-50"
                        >
                          {String(val || '')}
                        </td>
                      );
                    })}
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
