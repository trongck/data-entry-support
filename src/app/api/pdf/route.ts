import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: NextRequest) {
  try {
    const { pdfBase64, fields } = await req.json();
    if (!pdfBase64) {
      return NextResponse.json({ error: 'Không tìm thấy dữ liệu tệp PDF' }, { status: 400 });
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
    const base64Data = pdfBase64.replace(/^data:application\/pdf;base64,/, '');

    const fieldsPrompt = fields && fields.length > 0 
      ? `Hãy ưu tiên trích xuất các cột/trường thông tin sau: ${JSON.stringify(fields)}.`
      : `Hãy tự động nhận diện tất cả các trường/cột thông tin chính trong tài liệu PDF (ví dụ: Số hóa đơn, Ngày lập, Tên khách hàng, Tên hàng, Số lượng, Đơn giá, Thành tiền...).`;

    const prompt = `
Bạn là một trợ lý AI chuyên nghiệp về trích xuất dữ liệu bảng và thông tin cấu trúc từ tệp tài liệu PDF.
Tài liệu PDF được đính kèm chứa các thông tin, bảng biểu, hóa đơn hoặc báo cáo.

Nhiệm vụ của bạn:
1. Đọc kỹ nội dung của tài liệu PDF.
2. Trích xuất thông tin cấu trúc từ PDF này thành dạng bảng (các cột và các hàng dữ liệu).
3. ${fieldsPrompt}
4. Trả về đúng một đối tượng JSON có hai thuộc tính sau:
- columns: một mảng chứa tên của tất cả các tiêu đề cột được trích xuất (ví dụ: ["Số hóa đơn", "Ngày lập", "Tên sản phẩm", "Số lượng", "Tổng tiền"])
- rows: một mảng các đối tượng chứa dữ liệu của các hàng. Mỗi đối tượng có các thuộc tính (keys) khớp chính xác với danh sách tiêu đề trong mảng 'columns'. Ví dụ:
{
  "columns": ["Số hóa đơn", "Ngày lập", "Sản phẩm", "Số lượng", "Thành tiền"],
  "rows": [
    { "Số hóa đơn": "HD001", "Ngày lập": "01/06/2026", "Sản phẩm": "Sắt phi 10", "Số lượng": "100", "Thành tiền": "15,000,000" },
    { "Số hóa đơn": "HD001", "Ngày lập": "01/06/2026", "Sản phẩm": "Xi măng Hà Tiên", "Số lượng": "50", "Thành tiền": "4,500,000" }
  ]
}

5. CHỈ trả về chuỗi JSON thô, không viết thêm giải thích, không gói trong các cú pháp markdown (KHÔNG viết \`\`\`json ... \`\`\`).
6. Nhận diện chuẩn xác tiếng Việt, đọc kỹ các con số và thông tin ngày tháng. Đảm bảo dữ liệu trích xuất chính xác với nội dung trong tài liệu PDF.
`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: 'application/pdf'
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
    console.error('Lỗi phân tích PDF từ AI Gemini:', error);
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
