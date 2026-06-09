import * as XLSX from 'xlsx';
import { CotCauHinh } from '../store/khoLuuTru';

export function docDuLieuCsv(noiDung: string): { columns: string[], duLieu: any[] } {
  const lines = noiDung.split('\n').map(l => l.trim()).filter(l => l !== '');
  if (lines.length === 0) return { columns: [], duLieu: [] };
  
  // Giả định dòng đầu tiên là tiêu đề
  const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
  const rows: any[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
    const row: Record<string, any> = {};
    headers.forEach((h, idx) => {
      row[h] = cols[idx] || '';
    });
    rows.push(row);
  }
  return { columns: headers, duLieu: rows };
}

export function docDuLieuJson(noiDung: string): { columns: string[], duLieu: any[] } {
  try {
    const obj = JSON.parse(noiDung);
    if (Array.isArray(obj) && obj.length > 0) {
      const keysSet = new Set<string>();
      obj.forEach(item => {
        Object.keys(item).forEach(k => keysSet.add(k));
      });
      return { columns: Array.from(keysSet), duLieu: obj };
    }
  } catch (e) {
    console.error('Lỗi parse JSON:', e);
  }
  return { columns: [], duLieu: [] };
}

export function xuatExcelNhanVien(
  duLieu: any[], 
  danhSachCot: CotCauHinh[],
  chieuRongCot: Record<string, number>
): void {
  const wb = XLSX.utils.book_new();

  // 1. Tạo sheet dữ liệu chính
  const duLieuExcelFormat = duLieu.map(dong => {
    const objectMoi: Record<string, any> = {};
    danhSachCot.forEach(cot => {
      objectMoi[cot.ten] = dong[cot.id];
    });
    return objectMoi;
  });

  const wsData = XLSX.utils.json_to_sheet(duLieuExcelFormat);

  // Cấu hình độ rộng cột tự động dựa trên độ rộng giao diện
  const colsConfig = danhSachCot.map(cot => {
    const w = chieuRongCot[cot.id] || cot.rong;
    return { wch: Math.max(12, Math.floor(w / 8)) };
  });
  wsData['!cols'] = colsConfig;

  XLSX.utils.book_append_sheet(wb, wsData, "Dữ liệu");

  // 2. Tạo sheet thống kê tổng hợp (Summary sheet)
  const tongSoRecord = duLieu.length;
  const duLieuThongKe: { "Chỉ số báo cáo": string; "Số liệu thực tế": string | number; "Mô tả chi tiết": string }[] = [
    { "Chỉ số báo cáo": "Tổng số bản ghi", "Số liệu thực tế": tongSoRecord, "Mô tả chi tiết": "Tổng số lượng dòng dữ liệu hiện có" }
  ];

  // Nếu có các cột số, tự động tạo thống kê tổng hợp để báo cáo chuyên nghiệp
  danhSachCot.forEach(cot => {
    const isNumberField = /lương|lượng|tiền|giá|số/i.test(cot.id);
    if (isNumberField && tongSoRecord > 0) {
      const tong = duLieu.reduce((acc, curr) => acc + (parseFloat(String(curr[cot.id]).replace(/[^0-9.-]/g, '')) || 0), 0);
      const trungBinh = Math.round(tong / tongSoRecord);
      duLieuThongKe.push({
        "Chỉ số báo cáo": `Trung bình ${cot.ten}`,
        "Số liệu thực tế": trungBinh.toLocaleString('vi-VN') + (cot.ten.toLowerCase().includes('lương') || cot.ten.toLowerCase().includes('tiền') ? ' đ' : ''),
        "Mô tả chi tiết": `Bình quân giá trị cột ${cot.ten}`
      });
    }
  });

  const wsThongKe = XLSX.utils.json_to_sheet(duLieuThongKe);
  wsThongKe['!cols'] = [{ wch: 30 }, { wch: 20 }, { wch: 35 }];
  XLSX.utils.book_append_sheet(wb, wsThongKe, "Báo cáo Tổng hợp");

  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `Bao_Cao_Excel_${dateStr}.xlsx`);
}

export function gopDuLieuNhanVien(
  duLieuGoc: any[],
  duLieuMoi: any[],
  danhSachCot: CotCauHinh[],
  kieuXungDot: string
): any[] {
  const ketQua = [...duLieuGoc];
  const primaryCol = danhSachCot[0];
  if (!primaryCol) return [...duLieuGoc, ...duLieuMoi];

  const primaryKey = primaryCol.id;

  duLieuMoi.forEach(dongMoi => {
    const keyVal = dongMoi[primaryKey];
    if (keyVal === undefined || keyVal === null) {
      ketQua.push({ ...dongMoi });
      return;
    }

    const idxTonTai = ketQua.findIndex(d => String(d[primaryKey]).trim().toUpperCase() === String(keyVal).trim().toUpperCase());

    if (idxTonTai !== -1) {
      if (kieuXungDot === 'ghi-de') {
        danhSachCot.forEach(cot => {
          if (dongMoi[cot.id] !== undefined) {
            ketQua[idxTonTai][cot.id] = dongMoi[cot.id];
          }
        });
      } else if (kieuXungDot === 'tao-moi') {
        let maNvFinal = String(keyVal);
        let countIndex = 1;
        while (ketQua.some(d => String(d[primaryKey]).trim().toUpperCase() === (maNvFinal + '_' + countIndex).toUpperCase())) {
          countIndex++;
        }
        const dongMoiChuan = { ...dongMoi, [primaryKey]: maNvFinal + '_' + countIndex };
        ketQua.push(dongMoiChuan);
      }
      // 'giu-nguyen': bỏ qua dòng mới
    } else {
      ketQua.push({ ...dongMoi });
    }
  });

  return ketQua;
}

export function xuatExcelBangDauRa(duLieu: any[], danhSachCot: string[]): void {
  try {
    const wb = XLSX.utils.book_new();
    const duLieuExcelFormat = duLieu.map(dong => {
      const objectMoi: Record<string, any> = {};
      danhSachCot.forEach(cot => {
        objectMoi[cot] = dong[cot] !== undefined ? dong[cot] : '';
      });
      return objectMoi;
    });

    const wsData = XLSX.utils.json_to_sheet(duLieuExcelFormat);

    // Tự động tính chiều rộng cột
    const colsConfig = danhSachCot.map(cot => {
      let maxLen = cot.length;
      duLieu.forEach(dong => {
        const valStr = String(dong[cot] || '');
        if (valStr.length > maxLen) {
          maxLen = valStr.length;
        }
      });
      return { wch: Math.max(12, Math.min(50, maxLen + 4)) };
    });
    
    wsData['!cols'] = colsConfig;
    XLSX.utils.book_append_sheet(wb, wsData, "Dữ liệu");
    const filename = `Xuat_Du_Lieu_${new Date().toISOString().slice(0, 10)}_${Math.floor(Math.random() * 1000)}.xlsx`;
    XLSX.writeFile(wb, filename);
  } catch (error) {
    console.error('Lỗi xuất Excel:', error);
  }
}
