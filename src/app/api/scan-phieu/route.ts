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
3. Tên lái xe (Tìm nhãn 'Lái xe' hoặc 'Họ tên lái xe' hoặc 'Tên khách hàng' nếu đó là tên người lái xe)

Hãy trả về một đối tượng JSON khớp chính xác cấu trúc sau:
{
  "ngay": "ngày cân dạng dd/mm/yyyy hoặc rỗng",
  "bienSo": "biển số xe hoặc rỗng",
  "laiXe": "tên lái xe hoặc rỗng"
}`;
    } else {
      prompt = `Bạn là một chuyên gia OCR chính xác cao. Hãy đọc PHIẾU XUẤT KHO hoặc LỆNH XUẤT KHO trong ảnh.
Quy tắc nhận diện bắt buộc:
1. SỐ PHIẾU CHỦ (Số phiếu của cả tờ Lệnh xuất kho):
   - Hãy tìm nhãn "Số phiếu:" (thường nằm ở phần trên cùng, ngay dưới hoặc bên phải tiêu đề "LỆNH XUẤT KHO" hoặc bên cạnh ngày tháng).
   - Lấy giá trị của Số phiếu này (thường được viết tay hoặc đóng dấu bằng mực đỏ/xanh, ví dụ: "... 02323").
   - Chỉ trích xuất đúng 5 CHỮ SỐ CUỐI CÙNG của số phiếu chủ này (ví dụ: "02323").
   - KHÔNG LẤY các mã sản phẩm trong bảng (như "120264TP12", "120271TP38") làm số phiếu.

2. CÁC DÒNG SẢN PHẨM TRONG BẢNG:
   - Quét qua bảng danh sách vật tư/hàng hóa. Với mỗi dòng, trích xuất:
     - Tên sản phẩm: Tên của loại gạo hoặc vật tư (ví dụ: "Gạo Nếp Hoa Vàng DB túi 2Kg", "Gạo ST25 Bao 3Kg"...).
     - Số lượng: Lấy số lượng tương ứng của dòng đó và bắt buộc bỏ đi 3 chữ số 0 ở cuối (ví dụ: "10,000" thành "10", "70,000" thành "70", "2,514,000" thành "2514").

Hãy trả về một đối tượng JSON chứa danh sách các dòng hàng với cấu trúc (trong đó "soPhieu" của tất cả các dòng đều là số phiếu chủ 5 số cuối vừa trích xuất được ở bước 1):
{
  "danhSach": [
    {
      "soPhieu": "5 số cuối của Số phiếu chủ của lệnh xuất",
      "tenSanPham": "tên sản phẩm nhận diện được trên dòng đó",
      "soLuong": "số lượng sau khi bỏ đi 3 chữ số 0 ở cuối"
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
