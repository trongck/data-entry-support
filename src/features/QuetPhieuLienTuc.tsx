'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useKhoLuuTru } from '../store/khoLuuTru';
import { xuatExcelBangDauRa } from '../services/dichVu';
import {
  Camera, Zap, Download, Trash2, ScanLine, RotateCcw,
  CheckCircle2, AlertCircle, X, Plus, Image, FileCheck
} from 'lucide-react';

// One row in final Excel = phiếu cân info + one phiếu xuất line
interface DongDuLieu {
  ngay: string;
  bienSo: string;
  laiXe: string;
  soPhieu: string;
  tenSanPham: string;
  soLuong: string;
  msl: string;
}

export default function QuetPhieuLienTuc() {
  const { setThongBao, customApiKey, customModel } = useKhoLuuTru();

  // === WORKFLOW STATE (persisted in localStorage) ===
  const [buoc, setBuoc] = useState<'phieu-can' | 'phieu-xuat'>('phieu-can');
  const [phieuCanInfo, setPhieuCanInfo] = useState({ ngay: '', bienSo: '', laiXe: '' });
  const [phieuXuatList, setPhieuXuatList] = useState<{ id?: string; soPhieu: string; tenSanPham: string; soLuong: string; msl: string; dangQuet?: boolean }[]>([]);
  const [ketQuaList, setKetQuaList] = useState<DongDuLieu[]>([]);
  
  // UI states
  const [dangQuet, setDangQuet] = useState(false);
  const [phieuCanDangQuet, setPhieuCanDangQuet] = useState(false);
  const [trangThaiQuet, setTrangThaiQuet] = useState('');
  const [daKhoiPhuc, setDaKhoiPhuc] = useState(false);

  // Restore from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('scanData');
      if (saved) {
        const d = JSON.parse(saved);
        if (d.buoc) setBuoc(d.buoc);
        if (d.phieuCanInfo) setPhieuCanInfo(d.phieuCanInfo);
        if (d.phieuXuatList) setPhieuXuatList(d.phieuXuatList);
        if (d.ketQuaList) setKetQuaList(d.ketQuaList);
      }
    } catch {}
    setDaKhoiPhuc(true);
  }, []);

  // Save to localStorage whenever data changes (after initial restore)
  useEffect(() => {
    if (!daKhoiPhuc) return;
    localStorage.setItem('scanData', JSON.stringify({ buoc, phieuCanInfo, phieuXuatList, ketQuaList }));
  }, [buoc, phieuCanInfo, phieuXuatList, ketQuaList, daKhoiPhuc]);

  // === CAMERA ===
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoElRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => { streamRef.current?.getTracks().forEach(t => t.stop()); };
  }, []);

  // Callback ref: fires when <video> element mounts/unmounts in DOM
  const videoRef = useCallback((el: HTMLVideoElement | null) => {
    videoElRef.current = el;
    if (el && streamRef.current) {
      el.srcObject = streamRef.current;
      el.play().catch(() => {});
    }
  }, [cameraOn]);

  const batCamera = async () => {
    setCameraError('');
    try {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      streamRef.current = stream;
      setCameraOn(true);
    } catch (err: any) {
      const msg = err.name === 'NotAllowedError' ? 'Chưa cấp quyền camera! Hãy cho phép trong trình duyệt.'
        : err.name === 'NotReadableError' ? 'Camera đang bị ứng dụng khác sử dụng! Hãy tắt app đang dùng camera rồi thử lại.'
        : `Lỗi camera: ${err.message}`;
      setCameraError(msg);
      setThongBao({ loai: 'loi', noiDung: msg });
    }
  };

  const tatCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  };

  // Capture photo from camera (resized directly for high-speed upload)
  const chupVaQuet = () => {
    if (!videoElRef.current || !canvasRef.current) return;
    const v = videoElRef.current, c = canvasRef.current;
    
    let width = v.videoWidth;
    let height = v.videoHeight;
    const maxDim = 1000; // Nâng lên 1000px để đảm bảo các chữ số cực nhỏ đều nét căng
    
    if (width > maxDim || height > maxDim) {
      if (width > height) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }
    }
    
    c.width = width;
    c.height = height;
    const ctx = c.getContext('2d');
    if (ctx) {
      ctx.drawImage(v, 0, 0, width, height);
      // Nén ảnh chất lượng 0.70: Giữ nguyên độ sắc nét tối đa cho OCR chính xác 100% nhưng tối ưu được dung lượng truyền
      const base64 = c.toDataURL('image/jpeg', 0.70);
      guiQuetAI(base64);
    }
  };

  // Upload file and scan (with image compression/downsizing)
  const chonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const b64 = ev.target?.result as string;
      if (!b64) return;
      
      // Compress image
      const img = new window.Image();
      img.src = b64;
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        const maxDim = 1000; // Đảm bảo độ phân giải cao cho các văn bản tài liệu
        
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        tempCanvas.getContext('2d')?.drawImage(img, 0, 0, width, height);
        // Nén ảnh chất lượng 0.70 để tối ưu tốc độ và giữ độ chính xác tuyệt đối
        const compressedB64 = tempCanvas.toDataURL('image/jpeg', 0.70);
        guiQuetAI(compressedB64);
      };
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // === SEND TO AI ===
  const guiQuetAI = async (imageBase64: string) => {
    // Save current step because it might change immediately
    const currentBuoc = buoc;

    if (currentBuoc === 'phieu-can') {
      // Advance step to 'phieu-xuat' IMMEDIATELY so the user can start scanning export tickets
      setBuoc('phieu-xuat');
      setPhieuCanDangQuet(true);
      setPhieuCanInfo({ ngay: 'Đang quét...', bienSo: 'Đang quét...', laiXe: '' });
      setThongBao({ loai: 'thanh-cong', noiDung: 'Đang nhận dạng phiếu cân ngầm dưới nền...' });

      // Run fetching in background
      fetch('/api/scan-phieu', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(customApiKey ? { 'x-gemini-api-key': customApiKey } : {}),
          ...(customModel ? { 'x-gemini-model': customModel } : {}),
        },
        body: JSON.stringify({ imageBase64, loaiPhieu: 'phieu-can' }),
      })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Lỗi nhận dạng phiếu cân');
        const kq = data.ketQua;
        setPhieuCanInfo({ ngay: kq.ngay || '', bienSo: kq.bienSo || '', laiXe: '' });
        setThongBao({ loai: 'thanh-cong', noiDung: `✅ Đọc xong phiếu cân: ${kq.bienSo || '?'}` });
      })
      .catch(err => {
        setPhieuCanInfo({ ngay: 'Lỗi quét', bienSo: 'Lỗi quét', laiXe: '' });
        setThongBao({ loai: 'loi', noiDung: `❌ Lỗi đọc phiếu cân: ${err.message}` });
      })
      .finally(() => {
        setPhieuCanDangQuet(false);
      });

    } else {
      // For export tickets
      const placeholderId = Math.random().toString();
      
      // Add a loading placeholder immediately
      const placeholderItem = {
        id: placeholderId,
        soPhieu: 'Đang quét...',
        tenSanPham: 'Đang nhận dạng ngầm...',
        soLuong: '...',
        msl: '',
        dangQuet: true
      };
      
      setPhieuXuatList(prev => [...prev, placeholderItem]);
      setThongBao({ loai: 'thanh-cong', noiDung: 'Đang nhận dạng phiếu xuất ngầm dưới nền...' });

      // Run fetching in background
      fetch('/api/scan-phieu', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(customApiKey ? { 'x-gemini-api-key': customApiKey } : {}),
          ...(customModel ? { 'x-gemini-model': customModel } : {}),
        },
        body: JSON.stringify({ imageBase64, loaiPhieu: 'phieu-xuat' }),
      })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Lỗi nhận dạng phiếu xuất');
        const kq = data.ketQua;
        const ds = kq.danhSach || [kq];
        const newItems = ds.map((item: any) => {
          let sl = String(item.soLuong || '').trim();
          if (sl.endsWith('000')) sl = sl.slice(0, -3);
          
          let sp = String(item.soPhieu || '').trim();
          if (sp.length > 5) sp = sp.slice(-5);

          return {
            id: Math.random().toString(),
            soPhieu: sp,
            tenSanPham: item.tenSanPham || '',
            soLuong: sl,
            msl: '',
            dangQuet: false
          };
        });

        // Replace placeholder with results
        setPhieuXuatList(prev => {
          const idx = prev.findIndex(item => item.id === placeholderId);
          if (idx !== -1) {
            const copy = [...prev];
            copy.splice(idx, 1, ...newItems);
            return copy;
          }
          return [...prev, ...newItems];
        });
        setThongBao({ loai: 'thanh-cong', noiDung: `✅ Đọc xong ${newItems.length} dòng phiếu xuất` });
      })
      .catch(err => {
        // Mark placeholder as failed
        setPhieuXuatList(prev => prev.map(item => {
          if (item.id === placeholderId) {
            return { ...item, soPhieu: 'Lỗi', tenSanPham: 'Lỗi quét ảnh', soLuong: '!', dangQuet: false };
          }
          return item;
        }));
        setThongBao({ loai: 'loi', noiDung: `❌ Lỗi quét phiếu xuất: ${err.message}` });
      });
    }
  };

  // === KẾT THÚC PHIẾU ===
  const ketThucPhieu = () => {
    if (phieuXuatList.length === 0) {
      setThongBao({ loai: 'canh-bao', noiDung: 'Chưa có phiếu xuất nào! Hãy scan phiếu xuất trước.' });
      return;
    }
    const dongMoi: DongDuLieu[] = phieuXuatList.map(px => ({
      ngay: phieuCanInfo.ngay,
      bienSo: phieuCanInfo.bienSo,
      laiXe: phieuCanInfo.laiXe,
      soPhieu: px.soPhieu,
      tenSanPham: px.tenSanPham,
      soLuong: px.soLuong,
      msl: px.msl,
    }));
    setKetQuaList(prev => [...prev, ...dongMoi]);
    // Reset for next phiếu cân
    setPhieuCanInfo({ ngay: '', bienSo: '', laiXe: '' });
    setPhieuXuatList([]);
    setBuoc('phieu-can');
    setThongBao({ loai: 'thanh-cong', noiDung: ` Đã lưu ${dongMoi.length} dòng. Sẵn sàng phiếu cân mới!` });
  };

  // === XUẤT EXCEL ===
  const xuatExcel = () => {
    if (ketQuaList.length === 0) return;
    const cols = ['Ngày', 'Biển số xe', 'Lái xe', 'Số phiếu', 'Số lượng (Kg)', 'MSL', 'Tên vật tư'];
    const rows = ketQuaList.map(d => ({
      'Ngày': d.ngay,
      'Biển số xe': d.bienSo,
      'Lái xe': d.laiXe,
      'Số phiếu': d.soPhieu,
      'Số lượng (Kg)': d.soLuong,
      'MSL': d.msl,
      'Tên vật tư': d.tenSanPham
    }));
    xuatExcelBangDauRa(rows, cols);
    setThongBao({ loai: 'thanh-cong', noiDung: `Xuất ${rows.length} dòng Excel thành công!` });
  };

  // Edit helpers
  const suaPhieuXuat = (idx: number, field: string, val: string) => {
    setPhieuXuatList(prev => prev.map((p, i) => i === idx ? { ...p, [field]: val } : p));
  };
  const xoaPhieuXuat = (idx: number) => {
    setPhieuXuatList(prev => prev.filter((_, i) => i !== idx));
  };
  const xoaDongKetQua = (idx: number) => {
    setKetQuaList(prev => prev.filter((_, i) => i !== idx));
  };
  const suaDongKetQua = (idx: number, field: keyof DongDuLieu, val: string) => {
    setKetQuaList(prev => prev.map((d, i) => i === idx ? { ...d, [field]: val } : d));
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-5 overflow-y-auto lg:overflow-hidden h-full">
      {/* === LEFT PANEL === */}
      <div className="w-full lg:w-80 flex-shrink-0 border border-[#E5E7EB] bg-[#F8F9FA] p-5 flex flex-col gap-4 overflow-y-visible lg:overflow-y-auto rounded-xl">
        <div>
          <h3 className="font-bold text-[#1A1A2E] text-base flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-emerald-600" />
            Quét Phiếu Liên Tục
          </h3>
          <p className="text-xs text-gray-500 mt-1">Scan phiếu cân → scan phiếu xuất → kết thúc → phiếu mới</p>
        </div>

        {/* STEP INDICATOR */}
        <div className="flex gap-2">
          <div className={`flex-1 text-center py-2 rounded-lg text-xs font-bold border transition ${
            buoc === 'phieu-can' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-400 border-gray-200'
          }`}>
            ① Phiếu cân
          </div>
          <div className={`flex-1 text-center py-2 rounded-lg text-xs font-bold border transition ${
            buoc === 'phieu-xuat' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-400 border-gray-200'
          }`}>
            ② Phiếu xuất
          </div>
        </div>

        {/* Current phieu-can info (if step 2) */}
        {buoc === 'phieu-xuat' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-blue-500 uppercase flex items-center gap-1">
                {phieuCanDangQuet && <div className="w-2.5 h-2.5 border border-blue-500 border-t-transparent rounded-full animate-spin" />}
                Phiếu cân hiện tại {phieuCanDangQuet && '(Đang quét...)'}
              </span>
              <button onClick={() => {
                setBuoc('phieu-can');
                setPhieuCanInfo({ ngay: '', bienSo: '', laiXe: '' });
                setPhieuXuatList([]);
                setThongBao({ loai: 'canh-bao', noiDung: 'Đã hủy phiếu cân. Hãy scan lại phiếu cân mới.' });
              }} className="flex items-center gap-1 text-[10px] font-bold text-red-500 hover:text-red-700 hover:bg-red-100 px-2 py-0.5 rounded transition">
                <RotateCcw className="w-3 h-3" /> Quét lại
              </button>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <div>
                <span className="text-[9px] text-gray-400">Ngày</span>
                <input value={phieuCanInfo.ngay} onChange={e => setPhieuCanInfo(p => ({...p, ngay: e.target.value}))} disabled={phieuCanDangQuet}
                  className="w-full text-xs font-bold border border-blue-200 rounded px-1.5 py-1 bg-white disabled:bg-gray-50" />
              </div>
              <div>
                <span className="text-[9px] text-gray-400">Biển số</span>
                <input value={phieuCanInfo.bienSo} onChange={e => setPhieuCanInfo(p => ({...p, bienSo: e.target.value}))} disabled={phieuCanDangQuet}
                  className="w-full text-xs font-bold border border-blue-200 rounded px-1.5 py-1 bg-white disabled:bg-gray-50" />
              </div>
              <div>
                <span className="text-[9px] text-gray-400">Lái xe</span>
                <input value={phieuCanInfo.laiXe} onChange={e => setPhieuCanInfo(p => ({...p, laiXe: e.target.value}))} disabled={phieuCanDangQuet}
                  className="w-full text-xs font-bold border border-blue-200 rounded px-1.5 py-1 bg-white disabled:bg-gray-50" />
              </div>
            </div>
          </div>
        )}

        {/* CAMERA */}
        <div className="flex flex-col gap-2">
          {!cameraOn ? (
            <div className="flex flex-col gap-2">
              <button onClick={batCamera}
                className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition">
                <Camera className="w-4 h-4" /> Bật Camera
              </button>
              {cameraError && (
                <div className="text-[11px] text-red-600 bg-red-50 border border-red-100 p-2.5 rounded-lg font-medium">
                  ⚠️ {cameraError}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="relative rounded-lg overflow-hidden border border-gray-300 bg-black">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-48 sm:h-56 md:h-64 object-cover" />
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-emerald-400" />
                  <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-emerald-400" />
                  <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-emerald-400" />
                  <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-emerald-400" />
                </div>
                {/* Show which ticket type we're scanning */}
                <div className="absolute top-1 left-1/2 -translate-x-1/2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    buoc === 'phieu-can' ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'
                  }`}>
                    {buoc === 'phieu-can' ? ' SCAN PHIẾU CÂN' : ' SCAN PHIẾU XUẤT'}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={chupVaQuet}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition">
                  <Zap className="w-4 h-4 text-amber-300 fill-amber-300 animate-pulse" /> CHỤP & QUÉT LIÊN TỤC
                </button>
                <button onClick={tatCamera} className="px-3 py-2.5 border border-red-200 hover:bg-red-50 text-red-500 rounded-lg transition">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* File upload alternative */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-[10px] font-bold text-gray-400">HOẶC</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>
        <button onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-gray-300 hover:border-emerald-400 text-gray-600 text-xs font-bold rounded-lg transition">
          <Image className="w-4 h-4" /> Chọn ảnh {buoc === 'phieu-can' ? 'phiếu cân' : 'phiếu xuất'}
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={chonFile} className="hidden" />

        {/* Processing indicator */}
        {(phieuCanDangQuet || phieuXuatList.some(p => p.dangQuet)) && (
          <div className="flex items-center gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="w-3.5 h-3.5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
            <span className="text-[11px] font-bold text-amber-700">Đang nhận dạng dữ liệu ngầm dưới nền...</span>
          </div>
        )}

        {/* PHIẾU XUẤT LIST (current session) */}
        {buoc === 'phieu-xuat' && phieuXuatList.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-3 flex flex-col gap-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase">Phiếu xuất đã scan ({phieuXuatList.length})</span>
            <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
              {phieuXuatList.map((px, i) => (
                <div key={px.id || i} className={`flex flex-col gap-1.5 border-b border-gray-100 pb-2 last:border-b-0 last:pb-0 ${
                  px.dangQuet ? 'opacity-70 bg-amber-50/20 p-1.5 rounded border border-dashed border-amber-200' : ''
                }`}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400 font-bold flex items-center gap-1">
                      {px.dangQuet && <div className="w-2.5 h-2.5 border border-amber-500 border-t-transparent rounded-full animate-spin" />}
                      Dòng {i + 1} {px.dangQuet && '(Đang quét...)'}
                    </span>
                    <button onClick={() => xoaPhieuXuat(i)} className="text-red-400 hover:text-red-600 p-0.5" disabled={px.dangQuet}>
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <input value={px.soPhieu} onChange={e => suaPhieuXuat(i, 'soPhieu', e.target.value)} placeholder="Số phiếu" disabled={px.dangQuet}
                      className="border border-gray-200 rounded px-1.5 py-1 text-xs disabled:bg-gray-50 font-bold" />
                    <input value={px.tenSanPham} onChange={e => suaPhieuXuat(i, 'tenSanPham', e.target.value)} placeholder="Tên sản phẩm" disabled={px.dangQuet}
                      className="border border-gray-200 rounded px-1.5 py-1 text-xs disabled:bg-gray-50" />
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <input value={px.soLuong} onChange={e => suaPhieuXuat(i, 'soLuong', e.target.value)} placeholder="Số lượng" disabled={px.dangQuet}
                      className="border border-gray-200 rounded px-1.5 py-1 text-xs text-center disabled:bg-gray-50 font-bold" />
                    <input value={px.msl} onChange={e => suaPhieuXuat(i, 'msl', e.target.value)} placeholder="MSL (tự điền)" disabled={px.dangQuet}
                      className="border border-amber-300 rounded px-1.5 py-1 text-xs text-center bg-amber-50 disabled:bg-gray-100" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ACTION BUTTONS */}
        <div className="flex flex-col gap-2 mt-auto">
          {buoc === 'phieu-xuat' && (
            <button onClick={ketThucPhieu}
              className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition">
              <FileCheck className="w-4 h-4" /> Kết thúc phiếu → Phiếu cân mới
            </button>
          )}
          <button onClick={xuatExcel} disabled={ketQuaList.length === 0}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed">
            <Download className="w-4 h-4" /> Xuất Excel ({ketQuaList.length} dòng)
          </button>
        </div>
      </div>

      {/* Hidden canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* === RIGHT PANEL - RESULT TABLE === */}
      <div className="flex-1 flex flex-col gap-3 min-h-[450px] lg:overflow-hidden">
        <div className="flex justify-between items-center gap-2">
          <div>
            <h3 className="font-bold text-[#1A1A2E] text-base">Bảng dữ liệu ({ketQuaList.length} dòng)</h3>
            <p className="text-xs text-gray-500">Nhấp vào ô để sửa. MSL điền tay. Xuất Excel khi hoàn tất.</p>
          </div>
          {ketQuaList.length > 0 && (
            <button onClick={() => { setKetQuaList([]); setThongBao({loai:'thanh-cong', noiDung:'Đã xóa hết!'}); }}
              className="flex items-center gap-1 px-3 py-1.5 border border-red-200 hover:bg-red-50 text-red-500 text-xs font-bold rounded-lg transition flex-shrink-0">
              <Trash2 className="w-3.5 h-3.5" /> Xóa hết
            </button>
          )}
        </div>

        <div className="flex-1 border border-[#E5E7EB] overflow-auto bg-white rounded-lg shadow-inner">
          <table className="w-full border-collapse text-[13px] min-w-[850px]">
            <thead className="sticky top-0 bg-[#F8F9FA] z-10 shadow-[0_1px_0_rgba(0,0,0,0.08)]">
              <tr>
                <th className="w-10 border border-[#E5E7EB] px-2 py-2.5 text-center font-bold text-gray-500">#</th>
                <th className="border border-[#E5E7EB] px-3 py-2.5 text-left font-bold text-gray-700 w-28">Ngày</th>
                <th className="border border-[#E5E7EB] px-3 py-2.5 text-left font-bold text-gray-700 w-28">Biển số xe</th>
                <th className="border border-[#E5E7EB] px-3 py-2.5 text-left font-bold text-gray-700 w-32">Lái xe</th>
                <th className="border border-[#E5E7EB] px-3 py-2.5 text-left font-bold text-gray-700 w-24">Số phiếu</th>
                <th className="border border-[#E5E7EB] px-3 py-2.5 text-center font-bold text-gray-700 w-24">Số lượng</th>
                <th className="border border-[#E5E7EB] px-3 py-2.5 text-center font-bold text-amber-600 w-24 bg-amber-50">MSL</th>
                <th className="border border-[#E5E7EB] px-3 py-2.5 text-left font-bold text-gray-700">Tên vật tư</th>
                <th className="w-10 border border-[#E5E7EB] px-2 py-2.5 text-center font-bold text-gray-500">Xóa</th>
              </tr>
            </thead>
            <tbody>
              {ketQuaList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-20 text-gray-400 text-xs">
                    <ScanLine className="w-12 h-12 mx-auto opacity-20 mb-2" />
                    Chưa có dữ liệu. Hãy scan phiếu cân → phiếu xuất → kết thúc.
                  </td>
                </tr>
              ) : ketQuaList.map((d, i) => (
                <tr key={i} className="hover:bg-blue-50/30 transition-colors">
                  <td className="border border-[#E5E7EB] text-center font-bold text-gray-400 bg-[#F8F9FA]">{i + 1}</td>
                  
                  {/* Cột Ngày */}
                  <td className="border border-[#E5E7EB] px-1">
                    <input value={d.ngay} onChange={e => suaDongKetQua(i, 'ngay', e.target.value)}
                      className="w-full px-2 py-1.5 bg-transparent outline-none text-xs focus:bg-blue-50" />
                  </td>

                  {/* Cột Biển số xe */}
                  <td className="border border-[#E5E7EB] px-1">
                    <input value={d.bienSo} onChange={e => suaDongKetQua(i, 'bienSo', e.target.value)}
                      className="w-full px-2 py-1.5 bg-transparent outline-none text-xs focus:bg-blue-50" />
                  </td>

                  {/* Cột Lái xe */}
                  <td className="border border-[#E5E7EB] px-1">
                    <input value={d.laiXe} onChange={e => suaDongKetQua(i, 'laiXe', e.target.value)}
                      className="w-full px-2 py-1.5 bg-transparent outline-none text-xs focus:bg-blue-50" placeholder="(Trống)" />
                  </td>

                  {/* Cột Số phiếu */}
                  <td className="border border-[#E5E7EB] px-1">
                    <input value={d.soPhieu} onChange={e => suaDongKetQua(i, 'soPhieu', e.target.value)}
                      className="w-full px-2 py-1.5 bg-transparent outline-none text-xs focus:bg-blue-50" />
                  </td>

                  {/* Cột Số lượng */}
                  <td className="border border-[#E5E7EB] px-1">
                    <input value={d.soLuong} onChange={e => suaDongKetQua(i, 'soLuong', e.target.value)}
                      className="w-full px-2 py-1.5 bg-transparent outline-none text-xs text-center focus:bg-blue-50" />
                  </td>

                  {/* Cột MSL */}
                  <td className="border border-[#E5E7EB] px-1 bg-amber-50/50">
                    <input value={d.msl} onChange={e => suaDongKetQua(i, 'msl', e.target.value)}
                      className="w-full px-2 py-1.5 bg-transparent outline-none text-xs text-center font-bold focus:bg-amber-100" placeholder="Điền MSL" />
                  </td>

                  {/* Cột Tên vật tư (cuối cùng) */}
                  <td className="border border-[#E5E7EB] px-1">
                    <input value={d.tenSanPham} onChange={e => suaDongKetQua(i, 'tenSanPham', e.target.value)}
                      className="w-full px-2 py-1.5 bg-transparent outline-none text-xs focus:bg-blue-50" />
                  </td>

                  <td className="border border-[#E5E7EB] text-center bg-[#F8F9FA]">
                    <button onClick={() => xoaDongKetQua(i)} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition">
                      <Trash2 className="w-3.5 h-3.5 mx-auto" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
