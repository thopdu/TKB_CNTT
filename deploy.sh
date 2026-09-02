#!/bin/bash
# ==============================================================================
# Script Tự Động Triển Khai & Cập Nhật Hệ Thống PDU Academic trên Ubuntu Server
# Tên miền: tkb.pvantho.id.vn
# ==============================================================================

set -e

echo "🚀 [1/5] Kéo mã nguồn mới nhất từ GitHub..."
git pull origin main || git pull origin master

echo "📦 [2/5] Cài đặt / cập nhật các gói phụ thuộc (Dependencies)..."
npm install --production=false

echo "⚙️ [3/5] Biên dịch ứng dụng (Vite + esbuild Server)..."
npm run build

echo "📁 [4/5] Tạo thư mục logs nếu chưa tồn tại..."
mkdir -p logs

echo "🔄 [5/5] Khởi động lại dịch vụ qua PM2..."
if command -v pm2 &> /dev/null; then
    pm2 reload ecosystem.config.cjs --env production || pm2 start ecosystem.config.cjs --env production
    pm2 save
    echo "✅ Triển khai thành công trên PM2! Ứng dụng đang chạy tại: https://tkb.pvantho.id.vn"
else
    echo "⚠️ PM2 chưa được cài đặt toàn cục. Hãy chạy: sudo npm install -g pm2"
    echo "▶️ Chạy tạm thời với lệnh: npm start"
fi
