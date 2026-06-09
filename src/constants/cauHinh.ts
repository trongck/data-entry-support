export const HANG_SO_COT = [
  { id: 'maNhanVien', ten: 'Mã NV', rong: 120, batBuoc: true, duyNhat: true },
  { id: 'hoTen', ten: 'Họ và tên', rong: 200, batBuoc: true },
  { id: 'email', ten: 'Email', rong: 220, kieu: 'email' },
  { id: 'soDienThoai', ten: 'Số điện thoại', rong: 150, kieu: 'phone' },
  { id: 'phongBan', ten: 'Phòng ban', rong: 160, tuyChon: ['Nhân sự', 'Kỹ thuật', 'Kinh doanh', 'Kế toán', 'Tiếp thị'] },
  { id: 'chucVu', ten: 'Chức vụ', rong: 160, tuyChon: ['Nhân viên', 'Trưởng phòng', 'Giám đốc', 'Thực tập sinh'] },
  { id: 'ngayVaoLam', ten: 'Ngày vào làm', rong: 150, kieu: 'date' },
  { id: 'mucLuong', ten: 'Mức lương', rong: 150, kieu: 'number' },
  { id: 'ghiChu', ten: 'Ghi chú', rong: 250 },
  { id: 'trangThai', ten: 'Trạng thái', rong: 150, tuyChon: ['Đang làm', 'Thử việc', 'Nghỉ việc'] }
] as const;

export const CAU_HINH_CHUNG = {
  chieuCaoDong: 38,
  lichSuToiDa: 50,
  treLocMs: 300,
} as const;

export const TAI_KHOAN_MAC_DINH = {
  ten: 'name',
  maTk: 'matk',
  pass: 'pass',
} as const;
