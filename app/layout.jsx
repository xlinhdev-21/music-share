import "./globals.css";

export const metadata = {
  title: "Mixtape",
  description: "Nghe những bài hát tôi đã upload",
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body>
        <div className="app-shell">
          <aside className="sidebar">
            <div className="brand">
              <div className="brand-mark" />
              <span className="brand-name">Mixtape</span>
            </div>
            <nav>
              <a className="nav-link active" href="/">
                Trang chủ
              </a>
            </nav>
            <div className="sidebar-footer">
              <a className="nav-link" href="/upload">
                + Thêm bài hát
              </a>
            </div>
          </aside>
          <div>{children}</div>
        </div>
      </body>
    </html>
  );
}