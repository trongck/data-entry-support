import { create } from 'zustand';
import { HANG_SO_COT, CAU_HINH_CHUNG } from '../constants/cauHinh';

export interface CotCauHinh {
  id: string;
  ten: string;
  rong: number;
}

export type NhanVien = Record<string, any>;

interface TrangThaiCuaHang {
  duLieu: any[];
  danhSachCot: CotCauHinh[];
  boLoc: Record<string, string>;
  hangDangChon: Set<number>;
  oDangSua: { dongIndex: number, cotId: string } | null;
  lichSu: any[][];
  chiSoLichSu: number;
  nguoiDung: { ten: string; maTk: string } | null;
  giaoDienHienTai: string;
  chieuRongCot: Record<string, number>;
  thongBao: { loai: 'thanh-cong' | 'loi' | 'canh-bao'; noiDung: string } | null;
  dangXuLy: boolean;

  dangNhap: (maTk: string, pass: string) => Promise<boolean>;
  dangXuat: () => void;
  khoiPhucNguoiDung: () => void;
  customApiKey: string;
  customModel: string;
  setCustomConfig: (apiKey: string, model: string) => void;
  chuyenPhanHe: (id: string) => void;
  luuTrangThaiLichSu: () => void;
  hoanTac: () => void;
  lamLai: () => void;
  themDongMoi: () => void;
  xoaDongDaChon: () => void;
  xoaDongTaiIndex: (idx: number) => void;
  nhanBanDongTaiIndex: (idx: number) => void;
  lamTrongCellTaiIndex: (idx: number, cotId: string) => void;
  capNhatCell: (dongIndex: number, cotId: string, giaTriMoi: any) => void;
  capNhatBoLoc: (cotId: string, giaTri: string) => void;
  capNhatChieuRongCot: (cotId: string, rong: number) => void;
  chonHang: (dongIndex: number, ctrlKey: boolean, shiftKey: boolean) => void;
  giaiPhongChonHang: () => void;
  setODangSua: (o: { dongIndex: number, cotId: string } | null) => void;
  setDuLieu: (duLieuMoi: any[]) => void;
  capNhatDuLieuVaCot: (duLieuMoi: any[], cotMoi: string[]) => void;
  setThongBao: (tb: { loai: 'thanh-cong' | 'loi' | 'canh-bao'; noiDung: string } | null) => void;
  setDangXuLy: (status: boolean) => void;
}

export const useKhoLuuTru = create<TrangThaiCuaHang>((set, get) => ({
  duLieu: [],
  danhSachCot: [...HANG_SO_COT], // Mặc định khởi tạo các cột Nhân sự
  boLoc: {},
  hangDangChon: new Set<number>(),
  oDangSua: null,
  lichSu: [],
  chiSoLichSu: -1,
  nguoiDung: null,
  giaoDienHienTai: 'chuyen-anh',
  chieuRongCot: HANG_SO_COT.reduce((acc, cot) => {
    acc[cot.id] = cot.rong;
    return acc;
  }, {} as Record<string, number>),
  thongBao: null,
  dangXuLy: false,

  customApiKey: '',
  customModel: 'gemini-2.0-flash',

  setCustomConfig: (apiKey, model) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('customApiKey', apiKey);
      localStorage.setItem('customModel', model);
    }
    set({ customApiKey: apiKey, customModel: model });
  },

  dangNhap: async (maTk, pass) => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matk: maTk, pass })
      });
      if (res.ok) {
        const result = await res.json();
        const userObj = { ten: result.name, maTk };
        if (typeof window !== 'undefined') {
          localStorage.setItem('nguoiDung', JSON.stringify(userObj));
        }
        set({ nguoiDung: userObj });
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  },

  dangXuat: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('nguoiDung');
    }
    set({ nguoiDung: null, duLieu: [], lichSu: [], chiSoLichSu: -1, hangDangChon: new Set() });
  },

  khoiPhucNguoiDung: () => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('nguoiDung');
      if (stored) {
        try {
          set({ nguoiDung: JSON.parse(stored) });
        } catch (e) {
          localStorage.removeItem('nguoiDung');
        }
      }
      const storedKey = localStorage.getItem('customApiKey') || '';
      const storedModel = localStorage.getItem('customModel') || 'gemini-2.0-flash';
      set({ customApiKey: storedKey, customModel: storedModel });
    }
  },

  chuyenPhanHe: (id) => {
    set({ giaoDienHienTai: id, oDangSua: null });
  },

  luuTrangThaiLichSu: () => {
    const { duLieu, lichSu, chiSoLichSu } = get();
    const lichSuMoi = lichSu.slice(0, chiSoLichSu + 1);
    const banSaoDuLieu = JSON.parse(JSON.stringify(duLieu));
    
    set({
      lichSu: [...lichSuMoi, banSaoDuLieu].slice(-CAU_HINH_CHUNG.lichSuToiDa),
      chiSoLichSu: Math.min(chiSoLichSu + 1, CAU_HINH_CHUNG.lichSuToiDa - 1)
    });
  },

  hoanTac: () => {
    const { chiSoLichSu, lichSu } = get();
    if (chiSoLichSu > 0) {
      const chiSoMoi = chiSoLichSu - 1;
      set({
        chiSoLichSu: chiSoMoi,
        duLieu: JSON.parse(JSON.stringify(lichSu[chiSoMoi])),
        hangDangChon: new Set(),
        oDangSua: null
      });
      get().setThongBao({ loai: 'canh-bao', noiDung: 'Đã hoàn tác hành động' });
    }
  },

  lamLai: () => {
    const { chiSoLichSu, lichSu } = get();
    if (chiSoLichSu < lichSu.length - 1) {
      const chiSoMoi = chiSoLichSu + 1;
      set({
        chiSoLichSu: chiSoMoi,
        duLieu: JSON.parse(JSON.stringify(lichSu[chiSoMoi])),
        hangDangChon: new Set(),
        oDangSua: null
      });
      get().setThongBao({ loai: 'thanh-cong', noiDung: 'Đã làm lại hành động' });
    }
  },

  themDongMoi: () => {
    const { duLieu, danhSachCot } = get();
    const dongMoi: Record<string, any> = {};
    danhSachCot.forEach(cot => {
      dongMoi[cot.id] = '';
    });

    set({ duLieu: [...duLieu, dongMoi] });
    get().luuTrangThaiLichSu();
    get().setThongBao({ loai: 'thanh-cong', noiDung: 'Đã thêm dòng trống mới' });
  },

  xoaDongDaChon: () => {
    const { duLieu, hangDangChon } = get();
    if (hangDangChon.size === 0) return;

    const duLieuMoi = duLieu.filter((_, idx) => !hangDangChon.has(idx));
    set({ duLieu: duLieuMoi, hangDangChon: new Set() });
    get().luuTrangThaiLichSu();
    get().setThongBao({ loai: 'thanh-cong', noiDung: 'Đã xóa các dòng được chọn' });
  },

  xoaDongTaiIndex: (idx) => {
    const { duLieu } = get();
    const duLieuMoi = duLieu.filter((_, i) => i !== idx);
    set({ duLieu: duLieuMoi, hangDangChon: new Set() });
    get().luuTrangThaiLichSu();
    get().setThongBao({ loai: 'thanh-cong', noiDung: 'Đã xóa dòng' });
  },

  nhanBanDongTaiIndex: (idx) => {
    const { duLieu } = get();
    const dongGoc = duLieu[idx];
    if (!dongGoc) return;

    const dongNhanBan = { ...dongGoc };
    const firstKey = Object.keys(dongGoc)[0];
    if (firstKey) {
      dongNhanBan[firstKey] = dongGoc[firstKey] + '_Copy';
    }
    const duLieuMoi = [...duLieu];
    duLieuMoi.splice(idx + 1, 0, dongNhanBan);

    set({ duLieu: duLieuMoi });
    get().luuTrangThaiLichSu();
    get().setThongBao({ loai: 'thanh-cong', noiDung: 'Đã nhân bản dòng' });
  },

  lamTrongCellTaiIndex: (idx, cotId) => {
    const { duLieu } = get();
    const duLieuMoi = [...duLieu];
    if (duLieuMoi[idx]) {
      duLieuMoi[idx][cotId] = '';
      set({ duLieu: duLieuMoi });
      get().luuTrangThaiLichSu();
      get().setThongBao({ loai: 'thanh-cong', noiDung: 'Đã xóa nội dung ô' });
    }
  },

  capNhatCell: (dongIndex, cotId, giaTriMoi) => {
    const { duLieu, danhSachCot } = get();
    const duLieuMoi = [...duLieu];
    const cotConfig = danhSachCot.find(c => c.id === cotId);
    
    if (duLieuMoi[dongIndex] && cotConfig) {
      let giaTriChuan = giaTriMoi;
      const isNumberField = /lương|lượng|tiền|giá|số/i.test(cotId);
      if (isNumberField) {
        const cleanVal = parseFloat(String(giaTriMoi).replace(/[^0-9.-]/g, ''));
        giaTriChuan = isNaN(cleanVal) ? 0 : cleanVal;
      }
      duLieuMoi[dongIndex][cotId] = giaTriChuan;
      
      set({ duLieu: duLieuMoi });
      get().luuTrangThaiLichSu();
    }
  },

  capNhatBoLoc: (cotId, giaTri) => {
    set((state) => ({
      boLoc: { ...state.boLoc, [cotId]: giaTri }
    }));
  },

  capNhatChieuRongCot: (cotId, rong) => {
    set((state) => ({
      chieuRongCot: { ...state.chieuRongCot, [cotId]: rong }
    }));
  },

  chonHang: (dongIndex, ctrlKey, shiftKey) => {
    const { hangDangChon } = get();
    const hangMoi = new Set(hangDangChon);

    if (shiftKey && hangMoi.size > 0) {
      const mangChon = Array.from(hangMoi);
      const dongCuoi = mangChon[mangChon.length - 1];
      const tu = Math.min(dongCuoi, dongIndex);
      const den = Math.max(dongCuoi, dongIndex);
      for (let i = tu; i <= den; i++) {
        hangMoi.add(i);
      }
    } else if (ctrlKey) {
      if (hangMoi.has(dongIndex)) {
        hangMoi.delete(dongIndex);
      } else {
        hangMoi.add(dongIndex);
      }
    } else {
      hangMoi.clear();
      hangMoi.add(dongIndex);
    }

    set({ hangDangChon: hangMoi });
  },

  giaiPhongChonHang: () => {
    set({ hangDangChon: new Set() });
  },

  setODangSua: (o) => {
    set({ oDangSua: o });
  },

  setDuLieu: (duLieuMoi) => {
    set({ duLieu: duLieuMoi });
    get().luuTrangThaiLichSu();
  },

  capNhatDuLieuVaCot: (duLieuMoi, cotMoi) => {
    const danhSachCotMoi = cotMoi.map(c => ({
      id: c,
      ten: c,
      rong: Math.max(120, Math.min(300, c.length * 12 + 40))
    }));

    const chieuRongCotMoi: Record<string, number> = {};
    danhSachCotMoi.forEach(cot => {
      chieuRongCotMoi[cot.id] = cot.rong;
    });

    set({
      danhSachCot: danhSachCotMoi,
      duLieu: duLieuMoi,
      chieuRongCot: chieuRongCotMoi,
      boLoc: {},
      hangDangChon: new Set(),
      oDangSua: null
    });
    
    get().luuTrangThaiLichSu();
  },

  setThongBao: (tb) => {
    set({ thongBao: tb });
  },

  setDangXuLy: (status) => {
    set({ dangXuLy: status });
  }
}));
