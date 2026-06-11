import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, loaiPhieu } = await req.json();
    if (!imageBase64) {
      return NextResponse.json({ error: 'Không tìm thấy dữ liệu hình ảnh' }, { status: 400 });
    }

    const apiKey = req.headers.get('x-gemini-api-key') || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'Chưa có API Key! Vào "Cấu hình AI" để nhập.' 
      }, { status: 400 });
    }

    const modelName = req.headers.get('x-gemini-model') || process.env.GEMINI_MODEL;
    if (!modelName) {
      return NextResponse.json({ 
        error: 'Chưa có Model AI! Vào "Cấu hình AI" để thiết lập.' 
      }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    let mimeType = 'image/jpeg';
    if (imageBase64.startsWith('data:image/png')) mimeType = 'image/png';
    else if (imageBase64.startsWith('data:image/webp')) mimeType = 'image/webp';

    let prompt = '';

    if (loaiPhieu === 'phieu-can') {
      prompt = `Bạn là một chuyên gia OCR chính xác cao. Hãy đọc PHIẾU CÂN XE trong ảnh.
Hãy tìm và nhận diện chính xác các trường sau:
1. Ngày cân (định dạng dd/mm/yyyy, tìm phần ghi ngày cân xe hoặc ngày xuất phiếu)
2. Biển số xe (dạng số xe ví dụ: 29C-123.45 hoặc 34C0852...)

Lưu ý: Không cần quét thông tin Lái xe hay bất cứ thông tin nào khác. Trường "laiXe" và "msl" để giá trị là chuỗi rỗng.

Hãy trả về một đối tượng JSON khớp chính xác cấu trúc sau:
{
  "ngay": "ngày cân dạng dd/mm/yyyy hoặc rỗng",
  "bienSo": "biển số xe hoặc rỗng",
  "laiXe": "",
  "msl": ""
}`;
    } else {
      prompt = `Bạn là một chuyên gia phân tích ảnh và trích xuất dữ liệu chính xác tuyệt đối. Hãy đọc PHIẾU XUẤT KHO hoặc LỆNH XUẤT KHO trong ảnh.

LƯU Ý QUAN TRỌNG: Trên phiếu này có các chữ viết tay nét mỏng viết bằng bút mực xanh/đen (ví dụ: "TX 5", "TX 60", "TX 50"...). Hãy tập trung phân tích kỹ từng chi tiết nhỏ của điểm ảnh để nhận dạng đúng các chữ viết tay này và tránh bỏ sót bất kỳ dòng nào có chữ viết tay bổ sung.

Quy tắc nhận diện bắt buộc:

1. MÃ PHIẾU GÓC TRÊN CÙNG BÊN PHẢI (Số phiếu của cả tờ Lệnh xuất kho):
   - Hãy tìm mã số phiếu nằm ở GÓC TRÊN CÙNG BÊN PHẢI của tờ phiếu.
   - Chỉ trích xuất đúng 5 CHỮ SỐ CUỐI CÙNG của mã phiếu này (ví dụ: nếu góc trên phải ghi "Số phiếu: VG0126002604", hãy lấy "02604").
   - KHÔNG LẤY các mã sản phẩm/mã vật tư trong bảng làm mã số phiếu.

2. CÁC DÒNG VẬT TƯ/HÀNG HÓA TRONG BẢNG:
   - Hãy quét qua bảng danh sách vật tư. Trích xuất thông tin từng dòng với các yêu cầu cực kỳ nghiêm ngặt sau:

   a) TÊN VẬT TƯ (Tên sản phẩm):
      - CHỈ QUẾT ĐÚNG TÊN của vật tư/hàng hóa.
      - TUYỆT ĐỐI KHÔNG quét mã hàng/mã sản phẩm nằm trước tên hoặc các thông tin ở cột khác ngoài cột tên vật tư.
      - Ví dụ: nếu dòng ghi dạng "MÃ_HÀNG - TÊN_VẬT_TƯ" (ví dụ: "GA120272TP38 - Gạo Huyết rồng...") hoặc "MÃ_HÀNG TÊN_VẬT_TƯ" (ví dụ: "120264TP12 Gạo Nếp...") thì hãy loại bỏ hoàn toàn phần mã hàng phía trước (kể cả dấu gạch ngang "-") để chỉ lấy phần tên vật tư (ví dụ: "Gạo Huyết rồng..." hoặc "Gạo Nếp...").

   b) SỐ LƯỢNG VÀ XỬ LÝ DÒNG BỊ GẠCH:
      - Quét đúng số lượng thực tế tương ứng của dòng đó. Bắt buộc bỏ đi 3 chữ số 0 ở cuối nếu số lượng kết thúc bằng ba chữ số 0 (ví dụ: "15,000" thì lấy "15", "1,030,000" thành "1030").
      - CHÚ Ý CỰC KỲ QUAN TRỌNG VỀ GẠCH HỦY VÀ GHI ĐÈ:
        - Quy tắc 1 (Gạch bỏ hoàn toàn): Nếu một dòng vật tư có số lượng bị gạch ngang và KHÔNG có ghi chú "TX [số]" viết tay bên cạnh -> BẮT BUỘC bỏ qua dòng đó, không đưa vào kết quả JSON.
          Ví dụ: Trong ảnh mẫu, các dòng có số lượng "2,640,000" và "1,785,000" bị gạch ngang và không có chữ TX viết tay bên cạnh -> Bỏ qua hoàn toàn các dòng này.
        - Quy tắc 2 (Gạch bỏ có thay thế): Nếu số lượng bị gạch ngang nhưng có ghi chú "TX [số]" viết tay bên cạnh (ví dụ: "TX 5", "TX 60", "TX 50", "TX 90"...) -> VẪN LẤY dòng đó và cập nhật số lượng mới là con số viết sau chữ "TX" (ví dụ: "TX 5" lấy là "5", "TX 60" lấy là "60", "TX 90" lấy là "90").
        - Quy tắc 3 (Không bị gạch): Nếu số lượng của dòng hàng đó hoàn toàn không bị gạch ngang (ví dụ: dòng có số lượng "1,030,000" và "15,000" không bị nét bút gạch ngang qua) -> VẪN LẤY dòng đó bình thường với số lượng gốc đã rút gọn 3 số 0 (ví dụ: "1,030,000" lấy là "1030", "15,000" lấy là "15").
        - ĐỐI CHIẾU DÓNG HÀNG CHÍNH XÁC (Alignment): Hãy đối chiếu hàng ngang thật cẩn thận từ Cột Tên vật tư sang Cột Số lượng để khớp đúng chữ viết tay của hàng nào vào hàng đó, tuyệt đối không dóng lệch hàng (không lấy nhầm chữ viết tay của hàng này gán cho hàng khác).

Hãy trả về một đối tượng JSON chứa danh sách các dòng hàng với cấu trúc sau:
{
  "danhSach": [
    {
      "soPhieu": "5 số cuối của mã phiếu ở góc trên cùng bên phải",
      "tenSanPham": "Tên vật tư nhận dạng được (đã bỏ mã hàng ở đầu)",
      "soLuong": "Số lượng sau khi đã xử lý bỏ 3 chữ số 0 ở cuối hoặc lấy số bổ sung nếu bị gạch"
    }
  ]
}`;
    }

    // Call Gemini with native JSON output configuration
    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            { inlineData: { data: base64Data, mimeType } }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      }
    });

    const rawResponse = result.response.text();
    const cleanJson = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsedData = JSON.parse(cleanJson);

    return NextResponse.json({ ketQua: parsedData, loaiPhieu });

  } catch (error: any) {
    console.error('Lỗi scan phiếu:', error);
    const msg = error.message || '';
    let userError = 'Lỗi AI. Kiểm tra cấu hình!';
    if (msg.includes('429') || msg.includes('quota')) {
      userError = 'Hết quota API! Chờ hoặc đổi Key.';
    } else if (msg.includes('API key') || msg.includes('invalid') || msg.includes('403')) {
      userError = 'API Key sai! Kiểm tra lại.';
    } else if (msg.includes('503') || msg.includes('overloaded')) {
      userError = 'Model quá tải! Thử lại sau.';
    } else if (msg.includes('404') || msg.includes('not found')) {
      userError = 'Model không tồn tại! Đổi Model.';
    }
    return NextResponse.json({ error: userError }, { status: 500 });
  }
}
