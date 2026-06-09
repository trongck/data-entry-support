import { HANG_SO_COT } from '../constants/cauHinh';

export function kiemTraEmail(email: string): boolean {
  if (!email) return true; // Cho phép rỗng
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.toLowerCase());
}

export function kiemTraSoDienThoai(sdt: string): boolean {
  if (!sdt) return true;
  const re = /^(0|84)[3|5|7|8|9][0-9]{8}$/;
  return re.test(sdt.replace(/\s+/g, ''));
}

export function kiemTraDong(
  giaTri: any,
  cotConfig: any,
  maNvList: string[],
  dongIndex: number
): string | null {
  if (cotConfig.batBuoc && (giaTri === null || giaTri === undefined || giaTri.toString().trim() === '')) {
    return 'Không được để trống';
  }

  if (cotConfig.duyNhat && giaTri) {
    const giaTriGoc = giaTri.toString().trim().toUpperCase();
    const biTrung = maNvList.some((ma, idx) => idx !== dongIndex && ma.trim().toUpperCase() === giaTriGoc);
    if (biTrung) return 'Mã NV này đã bị trùng';
  }

  if (cotConfig.kieu === 'email' && giaTri) {
    if (!kiemTraEmail(giaTri)) return 'Email không đúng định dạng';
  }

  if (cotConfig.kieu === 'phone' && giaTri) {
    if (!kiemTraSoDienThoai(giaTri)) return 'SĐT không đúng định dạng';
  }

  if (cotConfig.kieu === 'number' && giaTri !== '') {
    const so = Number(giaTri);
    if (isNaN(so) || so < 0) return 'Giá trị phải lớn hơn hoặc bằng 0';
  }

  return null;
}

export function chuanHoaO(giaTri: any, cotId: string): string {
  if (giaTri === null || giaTri === undefined) return '';
  let chuoi = giaTri.toString().trim().replace(/\s+/g, ' ');

  if (cotId === 'hoTen' && chuoi) {
    chuoi = chuoi.toLowerCase().replace(/(^|\s)\S/g, (l: string) => l.toUpperCase());
  }

  if (cotId === 'maNhanVien' && chuoi) {
    chuoi = chuoi.toUpperCase();
  }

  if (cotId === 'soDienThoai' && chuoi) {
    chuoi = chuoi.replace(/\s+/g, '');
  }

  return chuoi;
}

export function dinhDangSoLuong(so: number): string {
  return new Intl.NumberFormat('vi-VN').format(so);
}
