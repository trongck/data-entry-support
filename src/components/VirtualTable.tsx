'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useKhoLuuTru } from '../store/khoLuuTru';
import { CAU_HINH_CHUNG } from '../constants/cauHinh';
import { dinhDangSoLuong } from '../utils/tienIch';
import { Trash, Copy, Eraser } from 'lucide-react';

export default function VirtualTable() {
  const tableRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(500);

  const {
    duLieu,
    danhSachCot,
    boLoc,
    hangDangChon,
    oDangSua,
    chieuRongCot,
    capNhatCell,
    capNhatBoLoc,
    capNhatChieuRongCot,
    chonHang,
    giaiPhongChonHang,
    setODangSua,
    xoaDongTaiIndex,
    nhanBanDongTaiIndex,
    lamTrongCellTaiIndex,
  } = useKhoLuuTru();

  // Context Menu State
  const [menuNgucAnh, setMenuNgucAnh] = useState<{
    hienThi: boolean;
    x: number;
    y: number;
    dongIndex: number;
    cotId: string;
  } | null>(null);

  // Measure table wrapper height on mount/resize
  useEffect(() => {
    if (tableRef.current) {
      setViewportHeight(tableRef.current.clientHeight);
      const resizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
          setViewportHeight(entry.contentRect.height);
        }
      });
      resizeObserver.observe(tableRef.current);
      return () => resizeObserver.disconnect();
    }
  }, []);

  // Close context menu on external click
  useEffect(() => {
    const handleOutsideClick = () => {
      setMenuNgucAnh(null);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Filter Data
  const filteredData = duLieu
    .map((dong, idx) => ({ dong, idxGoc: idx }))
    .filter(({ dong }) => {
      for (const cot of danhSachCot) {
        const query = boLoc[cot.id];
        if (query && query.trim() !== '') {
          const val = String(dong[cot.id] || '').toLowerCase();
          if (!val.includes(query.toLowerCase())) {
            return false;
          }
        }
      }
      return true;
    });

  const tongSoDong = filteredData.length;
  const rowHeight = CAU_HINH_CHUNG.chieuCaoDong;
  const totalHeight = tongSoDong * rowHeight;

  // Virtual Indices
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - 5);
  const endIndex = Math.min(tongSoDong - 1, Math.ceil((scrollTop + viewportHeight) / rowHeight) + 5);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  // Drag Column Width Resizing
  const handleResizeStart = (e: React.MouseEvent, cotId: string) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = chieuRongCot[cotId] || 150;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const diffX = moveEvent.clientX - startX;
      const newWidth = Math.max(60, startWidth + diffX);
      capNhatChieuRongCot(cotId, newWidth);
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Right Click Menu Handler
  const handleContextMenu = (e: React.MouseEvent, dongIndex: number, cotId: string) => {
    e.preventDefault();
    setMenuNgucAnh({
      hienThi: true,
      x: e.pageX,
      y: e.pageY,
      dongIndex,
      cotId
    });
  };

  // Double Click / Edit Handler
  const handleCellBlur = (dongIndex: number, cotId: string, value: string) => {
    capNhatCell(dongIndex, cotId, value);
    setODangSua(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, dongIndex: number, cotId: string, value: string) => {
    if (e.key === 'Enter') {
      handleCellBlur(dongIndex, cotId, value);
    }
    if (e.key === 'Escape') {
      setODangSua(null);
    }
  };

  return (
    <div className="relative flex-1 border border-[#E5E7EB] bg-white overflow-hidden flex flex-col">
      {/* Table container with virtual scroll */}
      <div 
        ref={tableRef}
        onScroll={handleScroll}
        className="flex-1 overflow-auto relative"
      >
        <div style={{ height: totalHeight, width: '100%', position: 'relative' }}>
          <table className="w-full border-collapse table-fixed text-[13px] select-none text-[#1A1A2E]">
            {/* Table Header */}
            <thead className="sticky top-0 bg-[#F8F9FA] z-20 shadow-[0_1px_0_rgba(0,0,0,0.08)]">
              {/* Header Titles */}
              <tr>
                <th className="w-[50px] border border-[#E5E7EB] bg-[#F8F9FA] px-2 py-2 font-semibold text-center sticky left-0 z-30 shadow-[1px_0_0_#E5E7EB] border-r-2 border-r-[#D1D5DB]">
                  STT
                </th>
                {danhSachCot.map((cot) => (
                  <th
                    key={cot.id}
                    style={{ width: chieuRongCot[cot.id] || cot.rong }}
                    className="border border-[#E5E7EB] px-3 py-2 font-semibold text-left relative"
                  >
                    <span>{cot.ten}</span>
                    <div
                      onMouseDown={(e) => handleResizeStart(e, cot.id)}
                      className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize select-none hover:bg-[#2563EB] transition-colors"
                    />
                  </th>
                ))}
              </tr>

              {/* Filter inputs always visible */}
              <tr className="bg-[#F8F9FA]">
                <th className="w-[50px] border border-[#E5E7EB] bg-[#F8F9FA] p-1 sticky left-0 z-30 shadow-[1px_0_0_#E5E7EB] border-r-2 border-r-[#D1D5DB]"></th>
                {danhSachCot.map((cot) => (
                  <th key={`filter-${cot.id}`} className="border border-[#E5E7EB] p-1.5">
                    <input
                      type="text"
                      placeholder={`Lọc...`}
                      value={boLoc[cot.id] || ''}
                      onChange={(e) => capNhatBoLoc(cot.id, e.target.value)}
                      className="w-full text-xs font-normal border border-[#E5E7EB] px-2 py-1 outline-none focus:border-[#2563EB] bg-white rounded"
                    />
                  </th>
                ))}
              </tr>
            </thead>

            {/* Virtualized Body */}
            <tbody style={{ transform: `translateY(${startIndex * rowHeight}px)` }} className="absolute left-0 right-0">
              {filteredData.slice(startIndex, endIndex + 1).map(({ dong, idxGoc }) => {
                const Selected = hangDangChon.has(idxGoc);

                return (
                  <tr
                    key={`row-${idxGoc}`}
                    style={{ height: rowHeight }}
                    className={`hover:bg-[#F8F9FA] border-b border-[#E5E7EB] ${Selected ? 'bg-[#EFF6FF] hover:bg-[#EFF6FF]' : ''}`}
                  >
                    {/* Frozen STT */}
                    <td
                      onClick={(e) => chonHang(idxGoc, e.ctrlKey, e.shiftKey)}
                      className="w-[50px] border border-[#E5E7EB] bg-[#F8F9FA] text-center font-medium text-gray-500 cursor-pointer sticky left-0 z-10 shadow-[1px_0_0_#E5E7EB] border-r-2 border-r-[#D1D5DB]"
                    >
                      {idxGoc + 1}
                    </td>

                    {/* Columns */}
                    {danhSachCot.map((cot) => {
                      const value = dong[cot.id];
                      const isEditing = oDangSua && oDangSua.dongIndex === idxGoc && oDangSua.cotId === cot.id;

                      // Dynamic validation based on column name context
                      const isEmail = /email|thư/i.test(cot.id);
                      const isPhone = /sđt|điện thoại|phone/i.test(cot.id);
                      let validationError = '';
                      if (isEmail && value) {
                        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                        if (!emailRegex.test(String(value))) validationError = 'Sai định dạng email';
                      }
                      if (isPhone && value) {
                        const phoneRegex = /^(0|84)\d{9,10}$/;
                        if (!phoneRegex.test(String(value))) validationError = 'Sai định dạng số điện thoại';
                      }

                      return (
                        <td
                          key={`${idxGoc}-${cot.id}`}
                          onDoubleClick={() => setODangSua({ dongIndex: idxGoc, cotId: cot.id })}
                          onContextMenu={(e) => handleContextMenu(e, idxGoc, cot.id)}
                          style={{ width: chieuRongCot[cot.id] || cot.rong }}
                          className={`border border-[#E5E7EB] px-3 py-1 text-ellipsis overflow-hidden whitespace-nowrap relative ${
                            validationError ? 'bg-[#FEE2E2] text-red-900 border-red-300' : ''
                          } ${isEditing ? 'p-0' : ''}`}
                          title={validationError || undefined}
                        >
                          {isEditing ? (
                            <input
                              type="text"
                              defaultValue={String(value || '')}
                              autoFocus
                              onBlur={(e) => handleCellBlur(idxGoc, cot.id, e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, idxGoc, cot.id, (e.target as HTMLInputElement).value)}
                              className="w-full h-full border-2 border-[#2563EB] px-2 py-0.5 outline-none bg-white text-[13px]"
                            />
                          ) : (
                            <>
                              {/lương|lượng|tiền|giá|số/i.test(cot.id) && value !== '' && !isNaN(Number(value)) ? (
                                <div className="text-right">{dinhDangSoLuong(Number(value))}</div>
                              ) : (
                                String(value || '')
                              )}
                              {validationError && (
                                <div className="absolute bottom-full left-0 bg-gray-900 text-white text-[11px] px-2 py-1 hidden group-hover:block z-50 rounded">
                                  {validationError}
                                </div>
                              )}
                            </>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right Click Context Menu */}
      {menuNgucAnh && menuNgucAnh.hienThi && (
        <div
          style={{ top: menuNgucAnh.y, left: menuNgucAnh.x }}
          className="fixed bg-white border border-[#E5E7EB] shadow-md z-[9999] py-1 w-48 text-[13px]"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              xoaDongTaiIndex(menuNgucAnh.dongIndex);
              setMenuNgucAnh(null);
            }}
            className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-[#F8F9FA] text-[#1A1A2E] text-left font-medium"
          >
            <Trash className="w-4 h-4 text-red-500" />
            <span>Xóa dòng này</span>
          </button>
          <button
            onClick={() => {
              nhanBanDongTaiIndex(menuNgucAnh.dongIndex);
              setMenuNgucAnh(null);
            }}
            className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-[#F8F9FA] text-[#1A1A2E] text-left font-medium"
          >
            <Copy className="w-4 h-4 text-gray-500" />
            <span>Nhân bản dòng</span>
          </button>
          <button
            onClick={() => {
              lamTrongCellTaiIndex(menuNgucAnh.dongIndex, menuNgucAnh.cotId);
              setMenuNgucAnh(null);
            }}
            className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-[#F8F9FA] text-[#1A1A2E] text-left font-medium"
          >
            <Eraser className="w-4 h-4 text-gray-500" />
            <span>Xóa trắng ô</span>
          </button>
        </div>
      )}
    </div>
  );
}
