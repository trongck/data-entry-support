# 📊 Kho Dữ Liệu Excel Đa Năng

> Hệ thống nhập liệu thông minh tích hợp AI — Chuyển đổi ảnh, PDF, JSON thành bảng Excel chỉ trong vài giây.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-06B6D4?style=flat-square&logo=tailwindcss)
![Gemini AI](https://img.shields.io/badge/Gemini_AI-Powered-8E75B2?style=flat-square&logo=google)

---

## 📋 Mục lục

- [Giới thiệu](#-giới-thiệu)
- [Tính năng chính](#-tính-năng-chính)
- [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
- [Cấu trúc dự án](#-cấu-trúc-dự-án)
- [Cài đặt & Chạy](#-cài-đặt--chạy)
- [Cấu hình biến môi trường](#-cấu-hình-biến-môi-trường)
- [Hướng dẫn sử dụng](#-hướng-dẫn-sử-dụng)
- [API Endpoints](#-api-endpoints)
- [Ảnh chụp màn hình](#-ảnh-chụp-màn-hình)
- [Tác giả](#-tác-giả)

---

## 🎯 Giới thiệu

**Kho Dữ Liệu Excel Đa Năng** là một ứng dụng web hỗ trợ nhân viên văn phòng tự động hóa quy trình nhập liệu. Thay vì nhập liệu thủ công từ hóa đơn, phiếu nhập kho, hay bảng lương giấy, hệ thống sử dụng **Google Gemini AI** để:

- Trích xuất dữ liệu bảng biểu từ **ảnh chụp** (OCR thông minh)
- Phân tích và chuyển đổi **file PDF** sang bảng tính
- Nhập và xử lý dữ liệu từ **file JSON**
- Chuẩn hóa và làm sạch dữ liệu tự động bằng AI

Kết quả cuối cùng được xuất ra file **Excel (.xlsx)** sẵn sàng sử dụng.

---

## ✨ Tính năng chính

### 🖼️ Chuyển Ảnh thành Excel (AI OCR)
- Upload ảnh hóa đơn, bảng biểu, phiếu nhập kho
- AI Gemini Vision tự động nhận diện cấu trúc bảng (dòng, cột)
- Xem trước kết quả dưới dạng bảng, chỉnh sửa trực tiếp trước khi xuất

### 📄 Nhập PDF sang Excel
- Hỗ trợ trích xuất bảng dữ liệu từ file PDF
- AI phân tích cấu trúc văn bản và tái tạo bảng tính

### 📦 Đọc dữ liệu JSON
- Import trực tiếp từ file JSON
- Tự động phát hiện schema và tạo cấu trúc cột tương ứng

### 🧹 Chuẩn hóa dữ liệu
- Làm sạch, chuẩn hóa dữ liệu bằng AI Gemini
- Loại bỏ trùng lặp, sửa lỗi chính tả, format lại dữ liệu

### 📊 Bảng tính ảo (Virtual Table)
- Bảng tính hiệu suất cao với scroll ảo (virtual scrolling)
- Hỗ trợ sửa trực tiếp trên ô (inline editing)
- Lọc theo từng cột, chọn nhiều hàng (Ctrl/Shift click)
- Kéo thay đổi độ rộng cột
- Hoàn tác (Undo) / Làm lại (Redo) — lưu tối đa 50 bước

### ⚙️ Cấu hình AI linh hoạt
- Thay đổi API Key và Model Gemini ngay trên giao diện
- Hỗ trợ nhiều model: `gemini-2.0-flash`, `gemini-2.5-pro`, `gemini-3.5-flash`,...
- Không cần restart server khi đổi cấu hình

### 🔐 Đăng nhập bảo mật
- Xác thực tài khoản qua API server-side
- Lưu phiên đăng nhập trên localStorage

---

## 🛠 Công nghệ sử dụng

| Thành phần      | Công nghệ                                                     |
| --------------- | -------------------------------------------------------------- |
| **Framework**   | [Next.js 16](https://nextjs.org/) (App Router)                |
| **UI Library**  | [React 19](https://react.dev/)                                |
| **Ngôn ngữ**    | [TypeScript 5](https://www.typescriptlang.org/)               |
| **Styling**     | [Tailwind CSS 4](https://tailwindcss.com/)                    |
| **State**       | [Zustand 5](https://zustand-demo.pmnd.rs/)                    |
| **AI Engine**   | [Google Generative AI SDK](https://ai.google.dev/) (Gemini)   |
| **Excel**       | [SheetJS (xlsx)](https://sheetjs.com/)                         |
| **Icons**       | [Lucide React](https://lucide.dev/)                           |

---

## 📁 Cấu trúc dự án

```
Du_an_nhap_lieu_kho/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── api/                    # API Routes (Server-side)
│   │   │   ├── auth/route.ts       #   └─ Xác thực đăng nhập
│   │   │   ├── ocr/route.ts        #   └─ OCR ảnh bằng Gemini Vision
│   │   │   ├── pdf/route.ts        #   └─ Xử lý PDF
│   │   │   ├── json/route.ts       #   └─ Xử lý JSON
│   │   │   └── normalize/route.ts  #   └─ Chuẩn hóa dữ liệu AI
│   │   ├── layout.tsx              # Layout gốc
│   │   ├── page.tsx                # Trang chủ (đăng nhập + dashboard)
│   │   └── globals.css             # CSS toàn cục
│   │
│   ├── components/                 # UI Components dùng chung
│   │   ├── ThanhTren.tsx           #   └─ Header (thanh trên + cài đặt AI)
│   │   ├── ThanhBen.tsx            #   └─ Sidebar điều hướng
│   │   ├── ThanhTrangThai.tsx      #   └─ Thanh trạng thái dưới cùng
│   │   ├── ThongBaoToast.tsx       #   └─ Hệ thống thông báo toast
│   │   └── VirtualTable.tsx        #   └─ Bảng dữ liệu ảo hiệu suất cao
│   │
│   ├── features/                   # Các module chức năng chính
│   │   ├── ChuyenAnhExcel.tsx      #   └─ Ảnh → Excel (AI OCR)
│   │   ├── NhapPdfExcel.tsx        #   └─ PDF → Excel
│   │   ├── DocJsonExcel.tsx        #   └─ JSON → Excel
│   │   ├── ChuanHoaDuLieu.tsx      #   └─ Chuẩn hóa dữ liệu AI
│   │   ├── LamSachDuLieu.tsx       #   └─ Làm sạch dữ liệu
│   │   ├── NhapDuLieuNgoai.tsx     #   └─ Nhập dữ liệu ngoài
│   │   ├── GopNhieuFile.tsx        #   └─ Gộp nhiều file
│   │   ├── NhapLieuThuCong.tsx     #   └─ Nhập liệu thủ công
│   │   └── CapNhatDinhKy.tsx       #   └─ Cập nhật định kỳ
│   │
│   ├── store/
│   │   └── khoLuuTru.ts            # Zustand store (quản lý state toàn cục)
│   │
│   ├── services/
│   │   └── dichVu.ts               # Dịch vụ xuất Excel, tiện ích chung
│   │
│   ├── constants/
│   │   └── cauHinh.ts              # Hằng số cấu hình (cột, tài khoản,...)
│   │
│   └── utils/
│       └── tienIch.ts              # Hàm tiện ích dùng chung
│
├── .env.local                      # Biến môi trường (KHÔNG commit lên Git)
├── .gitignore
├── package.json
├── tsconfig.json
├── next.config.ts
└── README.md
```

---

## 🚀 Cài đặt & Chạy

### Yêu cầu hệ thống

- **Node.js** >= 18.x
- **npm** >= 9.x (hoặc yarn / pnpm)
- **Google Gemini API Key** (lấy tại [Google AI Studio](https://aistudio.google.com/apikey))

### Các bước cài đặt

```bash
# 1. Clone repository
git clone https://github.com/<username>/Du_an_nhap_lieu_kho.git
cd Du_an_nhap_lieu_kho

# 2. Cài đặt dependencies
npm install

# 3. Tạo file biến môi trường
cp .env.local
# Sau đó mở .env.local và điền thông tin cấu hình (xem phần bên dưới)

# 4. Chạy server phát triển
npm run dev
```

Mở trình duyệt tại: **http://localhost:3000**

### Build production

```bash
npm run build
npm start
```

---

## 🔑 Cấu hình biến môi trường

Tạo file `.env.local` tại thư mục gốc với nội dung:

```env
# Thông tin tài khoản đăng nhập mặc định
name=Ten_Nguoi_Dung
matk=ma_tai_khoan
pass=mat_khau

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash
```

> ⚠️ **Lưu ý:** File `.env.local` đã được thêm vào `.gitignore` và sẽ **KHÔNG** được commit lên Git. Tuyệt đối không chia sẻ API Key công khai.

---

## 📖 Hướng dẫn sử dụng

### 1. Đăng nhập
Nhập mã tài khoản và mật khẩu đã cấu hình trong `.env.local` để truy cập hệ thống.

### 2. Chọn chức năng
Sử dụng thanh sidebar bên trái để chuyển đổi giữa các module:

| Chức năng                | Mô tả                                                       |
| ------------------------ | ------------------------------------------------------------ |
| **Chuyển Ảnh thành Excel** | Upload ảnh → AI phân tích → Xem trước bảng → Xuất Excel     |
| **Đọc dữ liệu JSON**      | Import file JSON → Hiển thị bảng → Chỉnh sửa → Xuất Excel  |
| **Nhập từ PDF sang Excel** | Upload PDF → AI trích xuất bảng → Xem trước → Xuất Excel    |
| **Chuẩn hóa dữ liệu**     | Chọn dữ liệu → AI chuẩn hóa & làm sạch → Xuất kết quả     |

### 3. Cấu hình AI
Nhấn nút **"Cấu hình AI"** trên thanh header để:
- Nhập API Key cá nhân (nếu muốn dùng key riêng)
- Chọn model Gemini phù hợp nhu cầu

### 4. Xuất file Excel
Sau khi dữ liệu đã sẵn sàng, nhấn **"Xuất file Excel"** để tải về file `.xlsx`.

---

## 🔌 API Endpoints

| Method | Endpoint          | Mô tả                                      |
| ------ | ----------------- | ------------------------------------------- |
| POST   | `/api/auth`       | Xác thực đăng nhập                          |
| POST   | `/api/ocr`        | OCR ảnh bằng Gemini Vision AI               |
| POST   | `/api/pdf`        | Trích xuất bảng dữ liệu từ PDF             |
| POST   | `/api/json`       | Xử lý và parse dữ liệu JSON               |
| POST   | `/api/normalize`  | Chuẩn hóa & làm sạch dữ liệu bằng AI      |

Các API hỗ trợ custom header:
- `x-gemini-api-key`: API Key tùy chỉnh (ghi đè server key)
- `x-gemini-model`: Model tùy chỉnh (ghi đè model mặc định)

---

## 📸 Ảnh chụp màn hình

> *Sẽ cập nhật thêm ảnh demo sau.*

<!-- 
Bạn có thể thêm ảnh chụp màn hình vào đây:
![Màn hình đăng nhập](./screenshots/login.png)
![Dashboard chính](./screenshots/dashboard.png)
![OCR kết quả](./screenshots/ocr-result.png)
-->

---

## 👤 Tác giả

**Nguyễn Trọng**

- Dự án phục vụ mục đích nhập liệu kho, quản lý dữ liệu văn phòng
- Được phát triển với sự hỗ trợ của Google Gemini AI

---

## 📄 License

Dự án này được phát triển cho mục đích cá nhân và học tập.

---

<p align="center">
  <sub>Built with ❤️ using Next.js, React & Google Gemini AI</sub>
</p>
