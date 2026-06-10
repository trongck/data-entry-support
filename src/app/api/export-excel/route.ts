import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function POST(req: NextRequest) {
  try {
    // Read body as form data
    const formData = await req.formData();
    const payloadStr = formData.get('payload');
    if (!payloadStr) {
      return NextResponse.json({ error: 'Payload không hợp lệ' }, { status: 400 });
    }

    const { duLieu, danhSachCot, filename } = JSON.parse(payloadStr as string);

    const wb = XLSX.utils.book_new();
    const wsData = XLSX.utils.json_to_sheet(duLieu);

    // Auto calculate column widths
    const colsConfig = danhSachCot.map((cot: string) => {
      let maxLen = cot.length;
      duLieu.forEach((dong: any) => {
        const valStr = String(dong[cot] || '');
        if (valStr.length > maxLen) {
          maxLen = valStr.length;
        }
      });
      return { wch: Math.max(12, Math.min(50, maxLen + 4)) };
    });
    
    wsData['!cols'] = colsConfig;
    XLSX.utils.book_append_sheet(wb, wsData, "Dữ liệu");

    // Write to buffer
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Return the response as a file attachment
    const headers = new Headers();
    headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    headers.set('Content-Disposition', `attachment; filename="${filename || 'Xuat_Excel.xlsx'}"`);

    return new NextResponse(buf, {
      status: 200,
      headers: headers,
    });
  } catch (error: any) {
    console.error('Lỗi khi xuất excel trên server:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
