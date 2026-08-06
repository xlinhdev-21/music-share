import "./globals.css";
import { FaSpotify } from "react-icons/fa";

export const metadata = {
  title: "Save Music",
  description: "Nghe những bài hát tôi đã upload",
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body>
        <div className="app-shell">
          <aside className="sidebar">
            <a className="brand" href="/">
              <FaSpotify className="brand-logo" />
              <span className="brand-name">Music</span>
            </a>
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
          <div className="dev-credit-badge">Developed by xuanlinhdev.2208</div>
          <div>{children}</div>
        </div>
      </body>
    </html>
  );
}