import "./globals.css";

export const metadata = {
  title: "My Music",
  description: "Nghe những bài hát tôi đã upload",
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
