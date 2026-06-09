import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { matk, pass } = await req.json();

    // Lấy thông tin tài khoản từ biến môi trường của .env.local
    const envMatk = process.env.matk || 'admin01';
    const envPass = process.env.pass || '04102005';
    const envName = process.env.name || 'Trọng';

    if (matk === envMatk && pass === envPass) {
      return NextResponse.json({ success: true, name: envName });
    }

    return NextResponse.json({ 
      success: false, 
      error: 'Mã tài khoản hoặc mật khẩu không chính xác!' 
    }, { status: 401 });
    
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Lỗi hệ thống đăng nhập' 
    }, { status: 500 });
  }
}
