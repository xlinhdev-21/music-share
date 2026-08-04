# My Music — trang web nghe nhạc riêng của bạn

Trang web gồm:
- **`/`** — trang công khai, ai có link cũng vào nghe được nhạc bạn đã upload.
- **`/upload`** — trang riêng để bạn thêm bài hát (cần mật khẩu).

## Bước 1: Tạo project Supabase (miễn phí, dùng để lưu file nhạc + thông tin)

1. Vào https://supabase.com → **Sign up** → **New project**.
2. Đặt tên project tuỳ ý, chọn mật khẩu database, chọn khu vực gần bạn (Singapore).
3. Đợi ~2 phút để project khởi tạo xong.

### Tạo bucket lưu file nhạc
1. Vào mục **Storage** ở sidebar → **New bucket**.
2. Đặt tên bucket là `songs` (đúng chữ này).
3. Bật **Public bucket** (để link nhạc có thể phát trực tiếp).

### Tạo bảng lưu thông tin bài hát
1. Vào mục **SQL Editor** → **New query**, dán đoạn sau rồi bấm **Run**:

```sql
create table songs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text,
  url text not null,
  created_at timestamp with time zone default now()
);
```

### Lấy API keys
1. Vào **Project Settings** (icon bánh răng) → **API**.
2. Copy **Project URL** và **service_role key** (không phải `anon` key) — hai giá trị này bạn sẽ cần ở Bước 3.

## Bước 2: Cài đặt project ở máy bạn (để test thử)

Yêu cầu: đã cài [Node.js](https://nodejs.org) (bản 18 trở lên).

```bash
cd music-share
npm install
cp .env.local.example .env.local
```

Mở file `.env.local` vừa tạo, điền:
```
SUPABASE_URL=... (Project URL từ Supabase)
SUPABASE_SERVICE_ROLE_KEY=... (service_role key từ Supabase)
UPLOAD_PASSWORD=... (tự đặt mật khẩu để bảo vệ trang /upload)
```

Chạy thử:
```bash
npm run dev
```
Mở http://localhost:3000 để xem trang nghe nhạc, và http://localhost:3000/upload để thử upload.

## Bước 3: Đưa trang web lên internet (miễn phí, dùng Vercel)

1. Đưa code lên GitHub: tạo repo mới, push toàn bộ thư mục `music-share` lên.
2. Vào https://vercel.com → đăng nhập bằng GitHub → **Add New Project** → chọn repo vừa tạo.
3. Trong phần **Environment Variables**, thêm 3 biến giống hệt file `.env.local` ở trên (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `UPLOAD_PASSWORD`).
4. Bấm **Deploy**. Sau ~1-2 phút, Vercel cho bạn một link dạng `https://ten-du-an.vercel.app`.

## Bước 4: Sử dụng

- Vào `https://ten-du-an.vercel.app/upload`, nhập mật khẩu bạn đã đặt, upload bài hát của bạn.
- Chia sẻ link `https://ten-du-an.vercel.app` (trang chủ, **không phải** `/upload`) cho bạn bè — họ sẽ thấy và nghe được toàn bộ bài hát bạn đã upload, không cần đăng nhập.

## Lưu ý

- Vì trang `/` là công khai, bất kỳ ai biết link đều nghe được **tất cả** bài hát bạn upload — không có tính năng chọn bài để share riêng lẻ. Nếu sau này bạn cần việc đó (mỗi bài một link riêng, hoặc phân quyền người nghe), nói mình biết để mở rộng thêm.
- Gói miễn phí của Supabase cho khoảng 1GB lưu trữ file — đủ cho vài trăm bài hát chất lượng thường.
- Giữ mật khẩu upload bí mật; chỉ mình bạn nên biết trang `/upload`.
