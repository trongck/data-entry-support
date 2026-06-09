import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: NextRequest) {
  try {
    const { columns, rows, customRequirements } = await req.json();
    if (!rows || !Array.isArray(rows)) {
      return NextResponse.json({ error: 'Không tìm thấy dữ liệu bảng hợp lệ để chuẩn hóa' }, { status: 400 });
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

    const prompt = `
Bạn là một chuyên gia chuẩn hóa dữ liệu cao cấp.
Nhiệm vụ của bạn là nhận một bảng dữ liệu (dưới dạng mảng các dòng và danh sách cột) và thực hiện chuẩn hóa dữ liệu đó dựa trên các quy tắc chuẩn hóa chuẩn mực và các yêu cầu tùy chỉnh từ người dùng.

### QUY TẮC CHUẨN HÓA MẶC ĐỊNH (Luôn thực hiện):
1. **Khoảng trắng**: Loại bỏ mọi khoảng trắng thừa đầu/cuối của các ô dữ liệu. Các khoảng trắng ở giữa chỉ giữ lại đúng 1 dấu cách (ví dụ: "  Nguyễn   Văn   A  " -> "Nguyễn Văn A").
2. **Họ và tên**: Định dạng viết hoa chữ cái đầu cho mỗi từ của tên người (ví dụ: "nguyen van anh" -> "Nguyễn Văn Anh").
3. **Số điện thoại**: Định dạng lại số điện thoại về chuẩn Việt Nam bắt đầu bằng số 0 (ví dụ: "+84912345678" -> "0912345678", "912.345.678" -> "0912345678").
4. **Ngày tháng**: Chuẩn hóa ngày tháng về định dạng DD/MM/YYYY (nếu có thể nhận diện được ngày tháng).
5. **Số lượng/Giá tiền**: Loại bỏ ký tự lạ trong các cột số, định dạng thành số nguyên hoặc số thập phân sạch.
6. **Tính nhất quán**: Sửa các lỗi chính tả phổ biến và đồng bộ hóa các từ viết tắt tương tự (ví dụ: "hn", "hanoi" -> "Hà Nội").

### YÊU CẦU CHUẨN HÓA TÙY CHỈNH TỪ NGƯỜI DÙNG (Ưu tiên cao nhất):
"${customRequirements || 'Không có yêu cầu thêm. Hãy thực hiện theo các quy tắc mặc định.'}"

### DỮ LIỆU ĐẦU VÀO:
- Cột hiện tại: ${JSON.stringify(columns)}
- Dòng dữ liệu hiện tại (JSON):
${JSON.stringify(rows, null, 2)}

### YÊU CẦU KẾT QUẢ ĐẦU RA:
1. Trả về đúng một đối tượng JSON có hai thuộc tính sau:
- columns: một mảng chứa tên của tất cả các tiêu đề cột sau chuẩn hóa (nếu yêu cầu của người dùng có tạo thêm cột mới hoặc sửa tên cột).
- rows: một mảng các đối tượng chứa dữ liệu của các hàng sau khi đã chuẩn hóa. Mỗi đối tượng có các thuộc tính (keys) khớp chính xác với danh sách tiêu đề trong mảng 'columns'. Ví dụ:
{
  "columns": ["STT", "Họ tên", "Số điện thoại", "Bộ phận"],
  "rows": [
    { "STT": "1", "Họ tên": "Nguyễn Văn A", "Số điện thoại": "0987654321", "Bộ phận": "Kỹ thuật" }
  ]
}

2. CHỈ trả về chuỗi JSON thô, không viết thêm giải thích, không gói trong các cú pháp markdown (KHÔNG viết \`\`\`json ... \`\`\`).
3. Không làm mất mát hoặc thay đổi nội dung thông tin gốc trừ khi có yêu cầu rõ ràng từ người dùng. Đảm bảo toàn vẹn dữ liệu.
`;

    const result = await model.generateContent(prompt);
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
    console.error('Lỗi chuẩn hóa dữ liệu từ AI Gemini:', error);
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
