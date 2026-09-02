# 📘 HƯỚNG DẪN CHI TIẾT CÀI ĐẶT & TRIỂN KHAI PDU ACADEMIC TRÊN UBUNTU SERVER
**Tên miền:** `tkb.pvantho.id.vn`  
**Hệ thống:** PDU Academic - Cổng Quản lý Thời khóa biểu & Đào tạo Khoa CNTT - Đại học Phạm Văn Đồng

---

## 📑 MỤC LỤC
1. [Chuẩn bị & Yêu cầu hệ thống](#1-chuẩn-bị--yêu-cầu-hệ-thống)
2. [Cấu hình DNS tên miền (Cloudflare / Nhà cung cấp tên miền)](#2-cấu-hình-dns-tên-miền)
3. [Cài đặt môi trường trên Ubuntu Server (Node.js 20, Nginx, PM2, Certbot)](#3-cài-đặt-môi-trường-trên-ubuntu-server)
4. [Đẩy mã nguồn lên GitHub & Clone về Server](#4-đẩy-mã-nguồn-lên-github--clone-về-server)
5. [Cấu hình Biến môi trường (.env) & Biên dịch dự án](#5-cấu-hình-biến-môi-trường-env--biên-dịch-dự-án)
6. [Cấu hình PM2 để quản lý tiến trình chạy ngầm & Tự khởi động](#6-cấu-hình-pm2-quản-lý-tiến-trình)
7. [Cấu hình Nginx Reverse Proxy cho tên miền tkb.pvantho.id.vn](#7-cấu-hình-nginx-reverse-proxy)
8. [Cài đặt chứng chỉ SSL miễn phí Let's Encrypt (HTTPS)](#8-cài-đặt-chứng-chỉ-ssl-miễn-phí-lets-encrypt)
9. [Cấu hình Google Workspace Sign-In (@pdu.edu.vn)](#9-cấu-hình-google-workspace-sign-in)
10. [Lệnh cập nhật ứng dụng tự động khi có code mới (1-Click Update)](#10-lệnh-cập-nhật-ứng-dụng-tự-động)

---

## 1. Chuẩn bị & Yêu cầu hệ thống
- **Hệ điều hành:** Ubuntu Server 20.04 LTS / 22.04 LTS / 24.04 LTS
- **Cấu hình tối thiểu:** 1 vCPU, 1 GB RAM (Khuyến nghị 2 GB RAM trở lên), 15 GB SSD
- **Quyền truy cập:** Quyền `root` hoặc tài khoản có đặc quyền `sudo`
- **Tên miền:** `tkb.pvantho.id.vn` đã trỏ về địa chỉ IP Public của VPS/Server

---

## 2. Cấu hình DNS tên miền
Truy cập vào trang quản lý DNS tên miền của bạn (ví dụ Cloudflare, iNET, MatBao, v.v.):
- **Loại bản ghi (Record Type):** `A`
- **Tên (Name / Host):** `tkb` (hoặc `tkb.pvantho.id.vn`)
- **Giá trị (Value / IPv4 Address):** `<Địa_chỉ_IP_Public_của_Ubuntu_Server>`
- **TTL:** Auto hoặc 300s
- *(Nếu dùng Cloudflare: Tạm thời để Proxy status là DNS Only trong lúc cấp SSL lần đầu hoặc chuyển sang Full (strict))*.

Kiểm tra xem tên miền đã trỏ đúng IP chưa bằng lệnh trên máy tính:
```bash
ping tkb.pvantho.id.vn
```

---

## 3. Cài đặt môi trường trên Ubuntu Server

Mở Terminal và SSH vào Ubuntu Server:
```bash
ssh root@<IP_SERVER_CỦA_BẠN>
```

### 3.1. Cập nhật hệ thống
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git build-essential ufw
```

### 3.2. Cài đặt Node.js v20 LTS và NPM
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Kiểm tra phiên bản Node và npm
node -v   # Kết quả: v20.x.x
npm -v    # Kết quả: v10.x.x
```

### 3.3. Cài đặt PM2 (Process Manager)
```bash
sudo npm install -g pm2
```

### 3.4. Cài đặt Nginx & Certbot (SSL Let's Encrypt)
```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

### 3.5. Cấu hình Tường lửa (UFW)
```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
```

---

## 4. Đẩy mã nguồn lên GitHub & Clone về Server

### 4.1. Đẩy mã nguồn từ máy lên GitHub (nếu chưa có)
Trên máy làm việc / AI Studio:
```bash
git init
git add .
git commit -m "feat: optimize PDU Academic for Ubuntu deployment on tkb.pvantho.id.vn"
git branch -M main
git remote add origin https://github.com/<tai-khoan-github>/<ten-repository>.git
git push -u origin main
```

### 4.2. Clone về Ubuntu Server
Trên Ubuntu Server, tạo thư mục lưu trữ ứng dụng (ví dụ `/var/www/tkb-pdu`):
```bash
sudo mkdir -p /var/www/tkb-pdu
sudo chown -R $USER:$USER /var/www/tkb-pdu
cd /var/www/tkb-pdu

# Clone mã nguồn
git clone https://github.com/<tai-khoan-github>/<ten-repository>.git .
```

---

## 5. Cấu hình Biến môi trường (.env) & Biên dịch dự án

### 5.1. Tạo file cấu hình `.env`
```bash
cp .env.example .env
nano .env
```
Nội dung file `.env`:
```env
PORT=3005
NODE_ENV=production
APP_URL=https://tkb.pvantho.id.vn
GEMINI_API_KEY=AIzaSy... (Điền key Gemini của bạn nếu dùng AI học vụ)
VITE_GOOGLE_CLIENT_ID= (Điền Google Client ID nếu có)
```
*(Bấm `Ctrl + O` -> `Enter` để lưu, `Ctrl + X` để thoát nano)*.

### 5.2. Cài đặt các gói phụ thuộc & Build ứng dụng
```bash
npm install
npm run build
```
Lệnh build sẽ tạo ra thư mục `dist/` chứa toàn bộ frontend HTML/CSS/JS đã tối ưu và file bundle server `dist/server.cjs`.

---

## 6. Cấu hình PM2 Quản lý tiến trình

### 6.1. Khởi chạy ứng dụng qua PM2 (Cổng 3005, Fork Mode, 1 Instance)
Dự án đã có sẵn file cấu hình tối ưu `ecosystem.config.cjs` (cấu hình `instances: 1`, `exec_mode: 'fork'`, cổng `3005`):
```bash
pm2 start ecosystem.config.cjs --env production
```

Hoặc nếu muốn chạy trực tiếp bằng câu lệnh PM2:
```bash
PORT=3005 pm2 start dist/server.cjs --name "pdu-academic" -i 1 --env NODE_ENV=production
```

### 6.2. Kiểm tra trạng thái ứng dụng
```bash
pm2 list
pm2 logs pdu-academic --lines 30
```

### 6.3. Thiết lập tự động khởi động cùng hệ điều hành (Auto-restart on reboot)
```bash
pm2 startup
# Copy và chạy dòng lệnh mà PM2 hiển thị ra trên màn hình (nếu có)
pm2 save
```

---

## 7. Cấu hình Nginx Reverse Proxy

### 7.1. Tạo file Virtual Host cho `tkb.pvantho.id.vn`
```bash
sudo nano /etc/nginx/sites-available/tkb.pvantho.id.vn
```

Dán nội dung cấu hình sau (chuyển tiếp tới cổng 3005):
```nginx
server {
    listen 80;
    listen [::]:80;
    server_name tkb.pvantho.id.vn;

    client_max_body_size 100M;

    # Nén Gzip tăng tốc
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/rss+xml application/atom+xml image/svg+xml;

    location / {
        proxy_pass http://127.0.0.1:3005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
```

### 7.2. Kích hoạt Virtual Host & Khởi động lại Nginx
```bash
sudo ln -sf /etc/nginx/sites-available/tkb.pvantho.id.vn /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 8. Cài đặt chứng chỉ SSL miễn phí Let's Encrypt (HTTPS)

Chạy Certbot để tự động đăng ký chứng chỉ SSL và cấu hình HTTPS cho Nginx:
```bash
sudo certbot --nginx -d tkb.pvantho.id.vn
```
- Nhập email của bạn (dùng để nhận thông báo gia hạn chứng chỉ).
- Chọn `Y` để đồng ý điều khoản.
- Chọn tự động chuyển hướng HTTP sang HTTPS (`Redirect`).

Sau khi hoàn tất, kiểm tra tự động gia hạn SSL:
```bash
sudo certbot renew --dry-run
```

🎉 **Bây giờ bạn có thể truy cập website an toàn tại:**  
👉 **https://tkb.pvantho.id.vn**

---

## 9. Cấu hình Google Workspace Sign-In (@pdu.edu.vn)
Để kích hoạt tính năng **Đăng nhập 1-Click bằng tài khoản Google Doanh nghiệp PDU** không cần mật khẩu với cửa sổ chuẩn Google:
1. Truy cập [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials).
2. Tạo dự án mới hoặc chọn dự án PDU.
3. Chọn **Create Credentials** -> **OAuth Client ID** -> Loại **Web Application**.
4. Tại mục **Authorized JavaScript origins**, thêm:
   - `https://tkb.pvantho.id.vn`
5. Copy **Client ID** (dạng `xxxxx.apps.googleusercontent.com`).
6. Thêm vào file `.env` trên server:
   ```env
   VITE_GOOGLE_CLIENT_ID="<Client_ID_của_bạn>"
   ```
7. Chạy lại lệnh build và restart:
   ```bash
   npm run build && pm2 reload pdu-academic
   ```

---

## 10. Lệnh Cập Nhật Ứng Dụng Tự Động (1-Click Update)

Mỗi khi bạn có code mới đẩy lên GitHub, trên server bạn chỉ cần chạy file `deploy.sh` có sẵn:
```bash
cd /var/www/tkb-pdu
chmod +x deploy.sh
./deploy.sh
```

Hoặc chạy thủ công các bước:
```bash
cd /var/www/tkb-pdu
git pull origin main
npm install
npm run build
pm2 reload pdu-academic
```

---

## 🛠️ CÁC LỆNH HỮU ÍCH KHI QUẢN TRỊ SERVER
- **Xem logs hệ thống theo thời gian thực:** `pm2 logs pdu-academic`
- **Khởi động lại ứng dụng:** `pm2 restart pdu-academic`
- **Xem mức tiêu thụ RAM/CPU:** `pm2 monit`
- **Khởi động lại Nginx:** `sudo systemctl restart nginx`
- **Xem log lỗi Nginx:** `sudo tail -f /var/log/nginx/error.log`
