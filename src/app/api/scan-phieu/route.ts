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
      - Quét đúng số lượng thực tế tương ứng của dòng đó. Bắt buộc bỏ đi 3 chữ số 0 ở cuối nếu số lượng kết thúc bằng ba chữ số 0 (ví dụ: "15,000" thì lấy "15", "2,514,000" thành "2514").
      - CHÚ Ý: Trong trường hợp số lượng hoặc cả dòng sản phẩm đó BỊ GẠCH ĐI (gạch ngang bằng bút mực, bút chì hoặc gạch in):
        - Trường hợp 1: Dòng hàng hoặc số lượng bị gạch thẳng ngang qua mà KHÔNG viết thêm thông tin gì khác -> KHÔNG ĐỌC dòng đó vào, bỏ qua hoàn toàn không đưa dòng này vào kết quả JSON.
          Ví dụ: Nếu một dòng vật tư bất kỳ có tên hoặc số lượng bị gạch bỏ bằng nét vẽ và không có bất kỳ con số hay chữ viết tay bổ sung nào ở bên cạnh -> Hãy bỏ qua hoàn toàn dòng đó.
        - Trường hợp 2: Số lượng bị gạch thẳng nhưng trước đó hoặc bên cạnh/phía trên có chữ/số viết tay bổ sung (ví dụ: ghi "TX 5", "TX 60", "TX 120" hoặc chỉ ghi số như "120" viết đè/bên cạnh) -> VẪN LẤY dòng vật tư đó, và lấy số lượng mới là con số được viết tay bổ sung (ví dụ: lấy số lượng là "5", "60", hoặc "120" tương ứng).

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
