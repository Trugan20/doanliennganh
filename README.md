# 🦷 MIRAI – ỨNG DỤNG QUẢN LÝ VÀ CHĂM SÓC SỨC KHỎE RĂNG MIỆNG

## 1. Giới thiệu dự án

**MIRAI Dental Care** là ứng dụng quản lý và chăm sóc sức khỏe răng miệng, được xây dựng nhằm hỗ trợ bệnh nhân, bác sĩ và quản trị viên trong quá trình quản lý và sử dụng dịch vụ nha khoa.

Hệ thống cung cấp giao diện trực quan, hỗ trợ quản lý thông tin bệnh nhân, bác sĩ, lịch hẹn, hồ sơ bệnh án và các dịch vụ nha khoa. Ngoài ra, ứng dụng tích hợp các chức năng hỗ trợ giao tiếp và tư vấn sức khỏe răng miệng.

## 2. Công nghệ sử dụng

### Frontend
- ReactJS – Xây dựng giao diện người dùng.
- TypeScript – Kiểm soát kiểu dữ liệu.
- Vite – Công cụ phát triển và đóng gói ứng dụng.
- Tailwind CSS – Thiết kế giao diện.
- Axios – Gửi yêu cầu đến Backend.
- React Router DOM – Quản lý điều hướng.
- Chart.js – Hiển thị biểu đồ thống kê.
- Socket.IO Client – Hỗ trợ giao tiếp thời gian thực.

### Backend
- Node.js – Môi trường chạy JavaScript.
- Express.js – Xây dựng RESTful API.
- MongoDB – Hệ quản trị cơ sở dữ liệu.
- Mongoose – Kết nối và thao tác với MongoDB.
- JWT – Xác thực người dùng.
- Bcrypt – Mã hóa mật khẩu.
- Socket.IO – Hỗ trợ giao tiếp thời gian thực.
- Multer – Xử lý tải tệp lên máy chủ.

## 3. Chức năng chính

### 3.1. Bệnh nhân
- Đăng ký, đăng nhập và quản lý tài khoản.
- Cập nhật thông tin cá nhân.
- Xem danh sách bác sĩ và dịch vụ nha khoa.
- Đặt lịch khám và theo dõi trạng thái lịch hẹn.
- Xem lịch sử khám và hồ sơ bệnh án.
- Theo dõi thông tin chăm sóc sức khỏe răng miệng.
- Trao đổi tin nhắn với bác sĩ.
- Gửi hình ảnh trong cuộc trò chuyện.
- Sử dụng chức năng hỗ trợ tư vấn sức khỏe răng miệng.

### 3.2. Bác sĩ
- Quản lý thông tin cá nhân.
- Xem danh sách bệnh nhân.
- Theo dõi và quản lý lịch hẹn.
- Cập nhật trạng thái lịch khám.
- Tạo và cập nhật hồ sơ bệnh án.
- Theo dõi thông tin sức khỏe răng miệng của bệnh nhân.
- Trao đổi tin nhắn với bệnh nhân.

### 3.3. Quản trị viên
- Quản lý tài khoản người dùng.
- Quản lý thông tin bệnh nhân và bác sĩ.
- Quản lý lịch hẹn khám.
- Quản lý dịch vụ nha khoa.
- Quản lý hồ sơ và dữ liệu liên quan.
- Theo dõi tình hình hoạt động của hệ thống.
- Quản lý thông tin và dữ liệu phục vụ hoạt động phòng khám.

## 4. Cấu trúc thư mục

```text
doanliennganh-main/
│
├── backend/
│   ├── src/
│   │   ├── config/          # Cấu hình hệ thống và database
│   │   ├── controllers/     # Xử lý nghiệp vụ
│   │   ├── jobs/            # Các tác vụ tự động
│   │   ├── middleware/      # Middleware xác thực và bảo mật
│   │   ├── models/          # Các mô hình dữ liệu MongoDB
│   │   ├── routes/          # Định nghĩa API
│   │   ├── services/        # Các dịch vụ xử lý
│   │   ├── socket/          # Xử lý Socket.IO
│   │   └── utils/           # Các hàm tiện ích
│   │
│   ├── uploads/             # Dữ liệu tệp tải lên
│   ├── server.js            # Điểm khởi chạy Backend
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── assets/          # Hình ảnh và tài nguyên
│   │   ├── components/      # Các thành phần giao diện
│   │   ├── pages/           # Các trang chức năng
│   │   ├── services/        # Kết nối API
│   │   └── ...              # Các thành phần khác
│   │
│   ├── public/
│   ├── index.html
│   └── package.json
│
└── README.md
```

## 5. Yêu cầu môi trường

Trước khi cài đặt dự án, cần chuẩn bị:

- Node.js (khuyến nghị phiên bản 18 trở lên).
- npm.
- MongoDB (MongoDB Local hoặc MongoDB Atlas).
- Git (nếu tải source code từ GitHub).
- Trình duyệt Google Chrome hoặc Microsoft Edge.

## 6. Hướng dẫn cài đặt và chạy dự án

### Bước 1: Tải source code

```bash
git clone https://github.com/Trugan20/doanliennganh
```

Di chuyển vào thư mục dự án:

```bash
cd doanliennganh-main
```

### Bước 2: Cài đặt và chạy Backend

Mở Terminal tại thư mục dự án:

```bash
cd backend
```

Cài đặt các thư viện:

```bash
npm install
```

Tạo file `.env` trong thư mục `backend` và cấu hình:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/vinamec_dental

# JWT
JWT_SECRET=your_super_secret_key_min_32_chars
JWT_EXPIRES_IN=7d

# File Upload
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760

# AI Chatbot (Optional)
OPENAI_API_KEY=sk-your-openai-key

# CORS
FRONTEND_URL=http://localhost:5173
```

Lưu ý:
- Có thể thay đổi `MONGODB_URI` theo địa chỉ MongoDB đang sử dụng.
- Cần cấu hình các thông tin bí mật khác nếu chức năng tương ứng yêu cầu.
- Không chia sẻ file `.env` chứa thông tin bảo mật lên GitHub.

Khởi chạy Backend:

```bash
npm run dev
```

Backend mặc định chạy tại:

```text
http://localhost:5000
```

### Bước 3: Cài đặt và chạy Frontend

Mở một Terminal mới tại thư mục gốc dự án:

```bash
cd frontend
```

Cài đặt các thư viện:

```bash
npm install
```

Khởi chạy Frontend:

```bash
npm run dev
```

Frontend mặc định chạy tại:

```text
http://localhost:5173
```

Mở trình duyệt và truy cập địa chỉ trên để sử dụng ứng dụng.

### Bước 4: Kiểm tra kết nối

Sau khi khởi chạy cả hai phần:

- Kiểm tra Backend đã kết nối thành công với MongoDB.
- Kiểm tra Frontend truy cập được giao diện.
- Kiểm tra chức năng đăng nhập và kết nối API.
- Kiểm tra các chức năng quản lý và cập nhật dữ liệu.

## 7. Một số lệnh thường dùng

### Backend

```bash
npm install
npm run dev
npm start
```

### Frontend

```bash
npm install
npm run dev
npm run build
npm run preview
npm run lint
```
## 8. Kiến trúc hệ thống

Hệ thống được xây dựng theo mô hình Client – Server:

```text
          FRONTEND
       ReactJS + Vite
              |
              | HTTP / REST API
              |
          BACKEND
       Node.js + Express
              |
        --------------
        |            |
     MongoDB      Socket.IO
   (Database)   (Real-time)
```

Frontend chịu trách nhiệm hiển thị giao diện và tương tác với người dùng. Backend tiếp nhận yêu cầu, xử lý nghiệp vụ và truy xuất dữ liệu từ MongoDB.

## 9. Thành viên thực hiện

**Đồ án liên ngành – Ứng dụng quản lý và chăm sóc sức khỏe răng miệng MIRAI**
Các thành viên thực hiện:

Lữ Trung Anh

Đỗ Quỳnh Chi

Đỗ Vân Khánh
- Đơn vị: Trường Đại học Phenikaa.
- Ngành học: Công nghệ thông tin.
- Học phần: Đồ án liên ngành.

## 11. Định hướng phát triển

- Tiếp tục hoàn thiện giao diện và trải nghiệm người dùng.
- Nâng cao khả năng bảo mật dữ liệu.
- Hoàn thiện các chức năng quản lý và chăm sóc bệnh nhân.
- Phát triển thêm các tính năng hỗ trợ ứng dụng AI trong chăm sóc sức khỏe răng miệng.
- Tối ưu hiệu năng và khả năng mở rộng hệ thống.

---

**MIRAI Dental Care – Đồng hành cùng sức khỏe nụ cười của bạn!** 🦷
