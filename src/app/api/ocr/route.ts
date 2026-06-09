import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: NextRequest) {
  try {
    const { imageBase64 } = await req.json();
    if (!imageBase64) {
      return NextResponse.json({ error: 'Không tìm thấy dữ liệu hình ảnh' }, { status: 400 });
    }

    const apiKey = req.headers.get('x-gemini-api-key') || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'Không tìm thấy API Key! Vui lòng nhập API Key trong phần "Cấu hình AI" ở góc trên màn hình hoặc cấu hình biến môi trường GEMINI_API_KEY trong file .env.local.' 
      }, { status: 400 });
    }

    const modelName = req.headers.get('x-gemini-model') || process.env.GEMINI_MODEL;
    if (!modelName) {
      return NextResponse.json({ 
        error: 'Không tìm thấy cấu hình Model! Vui lòng thiết lập tên Model trong phần "Cấu hình AI" ở góc trên màn hình hoặc cấu hình biến môi trường GEMINI_MODEL trong file .env.local.' 
      }, { status: 400 });
    }

    // Khởi tạo Google Gen AI client
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    // Loại bỏ header của base64 (nếu có)
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const prompt = `
Bạn là một trợ lý AI chuyên nghiệp về trích xuất dữ liệu bảng từ hình ảnh. 
Hình ảnh được cung cấp chứa một bảng biểu có các tiêu đề cột KHÔNG CỐ ĐỊNH (có thể là bất kỳ tiêu đề nào, ngôn ngữ bất kỳ, viết tắt hoặc tên cột đặc thù).

Hãy nhận diện chính xác tất cả các tiêu đề cột và tất cả các hàng dữ liệu có trong hình ảnh này.
Yêu cầu cực kỳ quan trọng:
1. Trả về một đối tượng JSON có đúng hai thuộc tính sau:
- columns: một mảng chứa tên của tất cả các tiêu đề cột được tìm thấy trong ảnh (ví dụ: ["STT", "Họ tên", "Số điện thoại", "Bộ phận",...])
- rows: một mảng các đối tượng chứa dữ liệu của các hàng. Mỗi đối tượng có các thuộc tính (keys) khớp chính xác với danh sách tiêu đề trong mảng 'columns'. Ví dụ:
{
  "columns": ["STT", "Họ tên", "Số điện thoại"],
  "rows": [
    { "STT": "1", "Họ tên": "Nguyễn Văn A", "Số điện thoại": "0987654321" },
    { "STT": "2", "Họ tên": "Trần Thị B", "Số điện thoại": "0912345678" }
  ]
}

2. CHỈ trả về chuỗi JSON thô, không viết thêm giải thích, không gói trong các cú pháp markdown (KHÔNG viết \`\`\`json ... \`\`\`).
3. Đọc kỹ tất cả các hàng và cột có trong ảnh, nhận diện chuẩn xác tiếng Việt và các con số, đảm bảo cấu trúc cột và hàng thẳng hàng chính xác.
`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: 'image/png'
        }
      }
    ]);

    const rawResponse = result.response.text();
    
    // Loại bỏ markdown nếu Gemini cố tình thêm vào
    const cleanJson = rawResponse
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    const parsedData = JSON.parse(cleanJson);
    return NextResponse.json({ 
      columns: parsedData.columns || [], 
      duLieu: parsedData.rows || [] 
    });

  } catch (error: any) {
    console.error('Lỗi phân tích OCR từ AI Gemini:', error);
    const msg = error.message || '';
    let userFriendlyError = 'Đã xảy ra lỗi khi gọi AI. Vui lòng kiểm tra lại cấu hình!';
    if (msg.includes('429') || msg.includes('quota') || msg.includes('limit') || msg.includes('Quota')) {
      userFriendlyError = 'Hạn ngạch API của bạn đã vượt quá giới hạn (Lỗi 429) hoặc bị giới hạn lượt gọi. Vui lòng thử lại sau ít phút hoặc thay đổi API Key / Model trong phần "Cấu hình AI" ở góc trên màn hình!';
    } else if (msg.includes('API key') || msg.includes('key not valid') || msg.includes('invalid') || msg.includes('403') || msg.includes('API_KEY_INVALID')) {
      userFriendlyError = 'API Key không hợp lệ, đã bị khóa hoặc bị lộ. Vui lòng kiểm tra lại API Key hoặc thay đổi API Key trong phần "Cấu hình AI" ở góc trên màn hình!';
    } else if (msg.includes('503') || msg.includes('overloaded') || msg.includes('Service Unavailable')) {
      userFriendlyError = 'Model hiện tại đang bị quá tải (Lỗi 503). Vui lòng thử lại sau hoặc đổi sang Model khác (ví dụ: gemini-3.1-flash-lite) trong phần "Cấu hình AI" ở góc trên màn hình!';
    } else if (msg.includes('not found') || msg.includes('not supported') || msg.includes('404')) {
      userFriendlyError = 'Tên Model không tồn tại hoặc không được hỗ trợ bởi API Key của bạn (Lỗi 404). Vui lòng đổi tên Model khác trong phần "Cấu hình AI" ở góc trên màn hình!';
    } else {
      userFriendlyError = `Lỗi hệ thống AI: ${msg}. Vui lòng kiểm tra lại cấu hình API Key hoặc Model trong phần "Cấu hình AI"!`;
    }
    return NextResponse.json({ error: userFriendlyError }, { status: 500 });
  }
}
