'use client';

import React, { useState } from 'react';
import { useKhoLuuTru } from '../store/khoLuuTru';
import { docDuLieuCsv, docDuLieuJson } from '../services/dichVu';
import { FileSpreadsheet, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function CapNhatDinhKy() {
  const [duLieuCapNhat, setDuLieuCapNhat] = useState<any[]>([]);
  const [cacCotXemTruoc, setCacCotXemTruoc] = useState<string[]>([]);
  const [kieuXuLyMoi, setKieuXuLyMoi] = useState<'them' | 'boqua'>('them');

  const { duLieu, danhSachCot, setDuLieu, setThongBao, chuyenPhanHe } = useKhoLuuTru();

  // Đọc tệp cập nhật
  const xuLyFileCapNhat = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      let resObj: { columns: string[], duLieu: any[] } = { columns: [], duLieu: [] };

      try {
        if (file.name.endsWith('.json')) {
          resObj = docDuLieuJson(text);
        } else {
          resObj = docDuLieuCsv(text);
        }
        setDuLieuCapNhat(resObj.duLieu);
        setCacCotXemTruoc(resObj.columns);
        setThongBao({ loai: 'thanh-cong', noiDung: `Đọc thành công ${resObj.duLieu.length} dòng cập nhật` });
      } catch (err) {
        setThongBao({ loai: 'loi', noiDung: 'Lỗi parse tệp cập nhật!' });
      }
    };
    reader.readAsText(file);
  };

  // Đồng bộ đè dữ liệu dựa trên Cột Khóa chính (cột đầu tiên)
  const thucHienGhiDeCapNhat = () => {
    if (duLieuCapNhat.length === 0) return;

    const primaryKey = danhSachCot[0]?.id;
    if (!primaryKey) return;

    const copyGoc = [...duLieu];
    let demCapNhat = 0;
    let demThemMoi = 0;

    duLieuCapNhat.forEach(dongMoi => {
      const keyVal = dongMoi[primaryKey];
      if (keyVal === undefined || keyVal === null) return;

      const idx = copyGoc.findIndex(d => String(d[primaryKey]).trim().toUpperCase() === String(keyVal).trim().toUpperCase());

      if (idx !== -1) {
        // Khớp khóa chính -> Ghi đè các giá trị mới
        danhSachCot.forEach(cot => {
          const val = dongMoi[cot.id];
          if (val !== undefined && val !== '') {
            copyGoc[idx][cot.id] = val;
          }
        });
        demCapNhat++;
      } else {
        // Không tìm thấy khóa chính trùng khớp
        if (kieuXuLyMoi === 'them') {
          copyGoc.push({ ...dongMoi });
          demThemMoi++;
        }
      }
    });

    setDuLieu(copyGoc);
    setThongBao({
      loai: 'thanh-cong',
      noiDung: `Cập nhật thành công! Ghi đè: ${demCapNhat} dòng, Thêm mới: ${demThemMoi} dòng.`
    });

    setDuLieuCapNhat([]);
    setCacCotXemTruoc([]);
    chuyenPhanHe('nhap-lieu-thu-cong');
  };

  const suaDongXemTruoc = (idx: number, cotId: string, val: string) => {
    const list = [...duLieuCapNhat];
    if (list[idx]) {
      list[idx][cotId] = val;
      setDuLieuCapNhat(list);
    }
  };

  const primaryKey = danhSachCot[0]?.id;

  return (
    <div className="flex-1 flex gap-6 overflow-hidden h-full">
      {/* 1. Control Panel */}
      <div className="w-80 border border-[#E5E7EB] bg-[#F8F9FA] p-4 flex flex-col gap-4 overflow-y-auto">
        <h3 className="font-semibold text-[#1A1A2E] text-sm flex items-center gap-1.5">
          <RefreshCw className="w-4 h-4 text-[#2563EB]" /> Cập nhật định kỳ
        </h3>
        <p className="text-xs text-gray-500">Tải lên tệp CSV/JSON chứa thông tin cập nhật dựa theo cột khóa chính: "{danhSachCot[0]?.ten || 'Khóa chính'}".</p>

        <input
          type="file"
          accept=".csv,.json"
          onChange={xuLyFileCapNhat}
          id="file-update-input"
          className="hidden"
        />
        <button
          onClick={() => document.getElementById('file-update-input')?.click()}
          className="w-full flex items-center justify-center gap-2 py-2 bg-white border border-[#E5E7EB] hover:bg-[#F8F9FA] text-xs font-semibold shadow-[0_1px_3px_rgba(0,0,0,0.08)] transition"
        >
          <FileSpreadsheet className="w-4 h-4 text-gray-700" />
          <span>Tải file cập nhật</span>
        </button>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-gray-700">Khi không khớp khóa chính:</label>
          <select
            value={kieuXuLyMoi}
            onChange={(e) => setKieuXuLyMoi(e.target.value as any)}
            className="w-full border border-[#E5E7EB] px-3 py-2 outline-none bg-white focus:border-[#2563EB] text-xs rounded"
          >
            <option value="them">Thêm mới dòng vào cuối bảng chính</option>
            <option value="boqua">Bỏ qua dòng này (Không import)</option>
          </select>
        </div>

        <button
          onClick={thucHienGhiDeCapNhat}
          disabled={duLieuCapNhat.length === 0}
          className="w-full flex items-center justify-center gap-2 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Áp dụng cập nhật</span>
        </button>
      </div>

      {/* 2. Preview Grid */}
      <div className="flex-grow flex flex-col gap-3 overflow-hidden h-full">
        <h3 className="font-semibold text-sm text-[#1A1A2E]">Danh sách các hàng sẽ thay đổi</h3>

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
              {duLieuCapNhat.length === 0 ? (
                <tr>
                  <td colSpan={cacCotXemTruoc.length + 1} className="text-center p-12 text-gray-400">
                    Chưa có tệp cập nhật nào được tải lên
                  </td>
                </tr>
              ) : (
                duLieuCapNhat.map((dong, idx) => {
                  const daTonTai = primaryKey && duLieu.some(d => String(d[primaryKey]).trim().toUpperCase() === String(dong[primaryKey]).trim().toUpperCase());
                  return (
                    <tr 
                      key={`update-${idx}`} 
                      className={`hover:bg-[#F8F9FA] ${daTonTai ? 'bg-emerald-50/50' : 'bg-amber-50/50'}`}
                      title={daTonTai ? "Dòng này sẽ ghi đè dữ liệu cũ" : "Dòng này sẽ được thêm mới"}
                    >
                      <td className="border border-[#E5E7EB] text-center font-medium text-gray-500 bg-[#F8F9FA]">{idx + 1}</td>
                      {cacCotXemTruoc.map(cot => {
                        const val = dong[cot];
                        return (
                          <td
                            key={`update-${idx}-${cot}`}
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => suaDongXemTruoc(idx, cot, e.target.innerText)}
                            className="border border-[#E5E7EB] px-3 py-1 text-ellipsis overflow-hidden whitespace-nowrap outline-none focus:bg-blue-50"
                          >
                            {String(val || '')}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
