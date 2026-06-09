'use client';

import React, { useState, useEffect } from 'react';
import { useKhoLuuTru } from '../store/khoLuuTru';
import { Menu, Database, User, LogOut, Settings, X, Key, Cpu, Save, RefreshCw, Eye, EyeOff } from 'lucide-react';

interface ThanhTrenProps {
  onToggleSidebar: () => void;
}

export default function ThanhTren({ onToggleSidebar }: ThanhTrenProps) {
  const { 
    nguoiDung, 
    dangXuat, 
    customApiKey,
    customModel,
    setCustomConfig,
    setThongBao
  } = useKhoLuuTru();

  // Settings modal states
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [modelInput, setModelInput] = useState('gemini-2.0-flash');
  const [showApiKey, setShowApiKey] = useState(false);

  // Sync inputs with store values when modal opens
  useEffect(() => {
    if (isSettingsOpen) {
      setApiKeyInput(customApiKey || '');
      setModelInput(customModel || 'gemini-2.0-flash');
    }
  }, [isSettingsOpen, customApiKey, customModel]);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomConfig(apiKeyInput.trim(), modelInput.trim());
    setThongBao({ loai: 'thanh-cong', noiDung: 'Đã lưu cấu hình AI thành công!' });
    setIsSettingsOpen(false);
  };

  const handleResetSettings = () => {
    setApiKeyInput('');
    setModelInput('gemini-2.0-flash');
    setCustomConfig('', 'gemini-2.0-flash');
    setThongBao({ loai: 'thanh-cong', noiDung: 'Đã khôi phục cài đặt AI mặc định!' });
    setIsSettingsOpen(false);
  };

  return (
    <>
      <header className="bg-white border-b border-[#E5E7EB] h-14 px-4 flex items-center justify-between z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={onToggleSidebar} 
            className="p-1 hover:bg-[#F8F9FA] border border-transparent hover:border-[#E5E7EB] transition rounded"
            title="Thu gọn Sidebar"
          >
            <Menu className="w-5 h-5 text-[#1A1A2E]" />
          </button>
          <div className="flex items-center gap-2 font-bold text-sm text-[#1A1A2E]">
            <Database className="w-5 h-5 text-indigo-600" />
            <span className="tracking-wide">KHO DỮ LIỆU EXCEL ĐA NĂNG CỦA TRỌNG</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* AI Configuration Button */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-lg transition border border-indigo-100"
            title="Cấu hình API Key & Model Gemini"
          >
            <Settings className="w-4 h-4 animate-spin-slow" />
            <span>Cấu hình AI</span>
          </button>

          <div className="h-4 w-[1px] bg-gray-200" />

          {/* User profile */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 font-bold text-xs text-[#1A1A2E]">
              <div className="w-6 h-6 rounded-full bg-indigo-600/10 flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-indigo-600" />
              </div>
              <span>{nguoiDung?.ten || 'Trọng'}</span>
            </div>
            
            <button
              onClick={dangXuat}
              className="p-1.5 hover:bg-red-50 text-red-500 hover:text-red-700 transition rounded-lg"
              title="Đăng xuất"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </header>

      {/* AI Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5E7EB] w-full max-w-[460px] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-[#F8F9FA]">
              <h3 className="font-bold text-[#1A1A2E] text-base flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-600" />
                <span>Cài đặt cấu hình AI Gemini</span>
              </h3>
              <button 
                onClick={() => setIsSettingsOpen(false)} 
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveSettings}>
              <div className="p-6 flex flex-col gap-5">
                <p className="text-xs text-gray-500 leading-relaxed">
                  Thiết lập Khóa API cá nhân và Model tương ứng để chạy trực tiếp trên trình duyệt của bạn. Nếu để trống, hệ thống sẽ tự động sử dụng cấu hình mặc định từ máy chủ.
                </p>

                {/* API Key Input */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <Key className="w-4 h-4 text-indigo-500" />
                    <span>Google Gemini API Key</span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      placeholder="Dán AIzaSy... của bạn tại đây (Để trống để dùng Server Key)"
                      className="w-full border border-gray-200 pl-3 pr-10 py-2.5 text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 text-gray-400 hover:text-gray-600"
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Model Selection Input + Datalist */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-indigo-500" />
                    <span>Lựa chọn Model Gemini</span>
                  </label>
                  <input
                    type="text"
                    list="model-suggestions"
                    value={modelInput}
                    onChange={(e) => setModelInput(e.target.value)}
                    placeholder="Nhập hoặc dán tên Model (ví dụ: gemini-2.0-flash)"
                    className="w-full border border-gray-200 px-3 py-2.5 text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg bg-white"
                  />
                  <datalist id="model-suggestions">
                    <option value="gemini-2.0-flash">Gemini 2.0 Flash (Khuyên dùng - Nhanh, chuẩn)</option>
                    <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite (Cực nhanh, tiết kiệm)</option>
                    <option value="gemini-3.5-flash">Gemini 3.5 Flash (Bản mới nhất 3.5)</option>
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash (Thông minh, ổn định)</option>
                    <option value="gemini-2.5-pro">Gemini 2.5 Pro (Hiệu năng cao)</option>
                    <option value="gemini-2.0-flash-lite">Gemini 2.0 Flash-Lite</option>
                    <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro Preview</option>
                    <option value="gemini-3.1-flash-lite-preview">Gemini 3.1 Flash Lite Preview</option>
                    <option value="gemini-3-flash-preview">Gemini 3 Flash Preview</option>
                    <option value="gemini-3-pro-preview">Gemini 3 Pro Preview</option>
                    <option value="gemini-flash-latest">Gemini Flash Latest</option>
                    <option value="gemini-pro-latest">Gemini Pro Latest</option>
                  </datalist>
                </div>

                {/* Status Indicator */}
                <div className="text-[11px] bg-gray-50 border border-gray-100 p-3 rounded-lg flex flex-col gap-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500">API Key hiện tại:</span>
                    <span className="font-bold text-gray-700">
                      {customApiKey ? `${customApiKey.slice(0, 7)}...${customApiKey.slice(-4)}` : 'Sử dụng Server Key (Mặc định)'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Model hiện tại:</span>
                    <span className="font-bold text-indigo-700">{customModel || 'gemini-2.0-flash'}</span>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-gray-100 bg-[#F8F9FA] flex justify-between gap-2">
                <button
                  type="button"
                  onClick={handleResetSettings}
                  className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 hover:bg-gray-100 text-gray-600 text-xs font-bold rounded-lg transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Đặt lại mặc định</span>
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSettingsOpen(false)}
                    className="px-4 py-2 border border-gray-200 hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-lg transition"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition shadow-sm"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Lưu cài đặt</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
