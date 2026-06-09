'use client';

import React, { useState } from 'react';
import { useKhoLuuTru } from '../store/khoLuuTru';
import { docDuLieuCsv, docDuLieuJson, gopDuLieuNhanVien } from '../services/dichVu';
import { Files, GitMerge, CheckCircle2 } from 'lucide-react';

export default function GopNhieuFile() {
  const [danhSachTenFile, setDanhSachTenFile] = useState<string[]>([]);
  const [duLieuGopTam, setDuLieuGopTam] = useState<any[]>([]);
  const [cacCotXemTruoc, setCacCotXemTruoc] = useState<string[]>([]);
  const [phuongThucXungDot, setPhuongThucXungDot] = useState<'ghi-de' | 'giu-nguyen' | 'tao-moi'>('ghi-de');

  const { duLieu, danhSachCot, capNhatDuLieuVaCot, setThongBao, chuyenPhanHe } = useKhoLuuTru();

  // Đọc danh sách nhiều file cùng lúc
  const docDanhSachFileGop = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    setDanhSachTenFile(fileList.map(f => f.name));
    setThongBao({ loai: 'canh-bao', noiDung: `Đang đọc ${fileList.length} tệp tin...` });

    let combinedList: any[] = [];
    const allHeaders = new Set<string>();
    let readCount = 0;

    fileList.forEach(file => {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target?.result as string;
        try {
          let resObj: { columns: string[], duLieu: any[] } = { columns: [], duLieu: [] };
          if (file.name.endsWith('.json')) {
            resObj = docDuLieuJson(text);
          } else {
            resObj = docDuLieuCsv(text);
          }
          combinedList = combinedList.concat(resObj.duLieu);
          resObj.columns.forEach(c => allHeaders.add(c));
        } catch (e) {
          console.error(e);
        }

        readCount++;
        if (readCount === fileList.length) {
          setDuLieuGopTam(combinedList);
          setCacCotXemTruoc(Array.from(allHeaders));
          setThongBao({ loai: 'thanh-cong', noiDung: `Đọc xong! Tổng bản ghi gom được: ${combinedList.length}` });
        }
      };
      reader.readAsText(file);
    });
  };

  // Đồng bộ kết quả gộp vào bảng chính
  const thucHienGopTepTin = () => {
    if (duLieuGopTam.length === 0) return;

    const ketQuaMoi = gopDuLieuNhanVien(duLieu, duLieuGopTam, danhSachCot, phuongThucXungDot);

    // Hợp nhất các cột của bảng chính hiện tại và các tệp gộp mới
    const mergedHeaders = new Set<string>();
    danhSachCot.forEach(c => mergedHeaders.add(c.id));
    cacCotXemTruoc.forEach(c => mergedHeaders.add(c));

    capNhatDuLieuVaCot(ketQuaMoi, Array.from(mergedHeaders));

    setThongBao({ 
      loai: 'thanh-cong', 
      noiDung: `Đã gộp thành công! Bảng chính hiện tại có ${ketQuaMoi.length} dòng và cấu trúc cột được cập nhật.` 
    });

    setDanhSachTenFile([]);
    setDuLieuGopTam([]);
    setCacCotXemTruoc([]);
    chuyenPhanHe('nhap-lieu-thu-cong');
  };

  const suaDongGop = (idx: number, cotId: string, val: string) => {
    const list = [...duLieuGopTam];
    if (list[idx]) {
      list[idx][cotId] = val;
      setDuLieuGopTam(list);
    }
  };

  return (
    <div className="flex-1 flex gap-6 overflow-hidden h-full">
      {/* 1. Left control panel */}
      <div className="w-80 border border-[#E5E7EB] bg-[#F8F9FA] p-4 flex flex-col gap-4 overflow-y-auto">
        <h3 className="font-semibold text-[#1A1A2E] text-sm flex items-center gap-1.5">
          <GitMerge className="w-4 h-4 text-[#2563EB]" /> Gộp nhiều file
        </h3>
        <p className="text-xs text-gray-500">Chọn đồng thời nhiều tệp tin CSV/JSON từ máy tính của bạn để tiến hành ghép dữ liệu và cột tự động.</p>

        <input
          type="file"
          accept=".csv,.json"
          multiple
          onChange={docDanhSachFileGop}
          id="file-merge-input"
          className="hidden"
        />
        <button
          onClick={() => document.getElementById('file-merge-input')?.click()}
          className="w-full flex items-center justify-center gap-2 py-2 bg-white border border-[#E5E7EB] hover:bg-[#F8F9FA] text-xs font-semibold shadow-[0_1px_3px_rgba(0,0,0,0.08)] transition"
        >
          <Files className="w-4 h-4 text-gray-700" />
          <span>Chọn các tệp gộp</span>
        </button>

        {danhSachTenFile.length > 0 && (
          <div className="bg-white border border-[#E5E7EB] p-3 text-xs text-[#2563EB] flex flex-col gap-1 rounded max-h-36 overflow-y-auto">
            <span className="font-semibold text-gray-700">Tệp đã chọn:</span>
            {danhSachTenFile.map((name, i) => (
              <div key={i} className="truncate">• {name}</div>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-gray-700">Phương thức giải quyết xung đột:</label>
          <select
            value={phuongThucXungDot}
            onChange={(e) => setPhuongThucXungDot(e.target.value as any)}
            className="w-full border border-[#E5E7EB] px-3 py-2 outline-none bg-white focus:border-[#2563EB] text-xs rounded"
          >
            <option value="ghi-de">Ưu tiên tệp mới (Ghi đè dòng cũ)</option>
            <option value="giu-nguyen">Ưu tiên bảng gốc (Bỏ qua dòng mới)</option>
            <option value="tao-moi">Tạo Khóa mới tự động (Ví dụ: NV001_1)</option>
          </select>
        </div>

        <button
          onClick={thucHienGopTepTin}
          disabled={duLieuGopTam.length === 0}
          className="w-full flex items-center justify-center gap-2 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Áp dụng gộp file</span>
        </button>
      </div>

      {/* 2. Right preview table */}
      <div className="flex-grow flex flex-col gap-3 overflow-hidden h-full">
        <h3 className="font-semibold text-sm text-[#1A1A2E]">Danh sách kết quả gộp tạm tính</h3>

        <div className="flex-grow border border-[#E5E7EB] overflow-auto bg-white rounded">
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
              {duLieuGopTam.length === 0 ? (
                <tr>
                  <td colSpan={cacCotXemTruoc.length + 1} className="text-center p-12 text-gray-400">
                    Chưa tải tệp tin nào để thực hiện gộp
                  </td>
                </tr>
              ) : (
                duLieuGopTam.map((dong, idx) => (
                  <tr key={`merge-${idx}`} className="hover:bg-[#F8F9FA]">
                    <td className="border border-[#E5E7EB] text-center font-medium text-gray-500 bg-[#F8F9FA]">{idx + 1}</td>
                    {cacCotXemTruoc.map(cot => {
                      const val = dong[cot];
                      return (
                        <td
                          key={`merge-${idx}-${cot}`}
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => suaDongGop(idx, cot, e.target.innerText)}
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
