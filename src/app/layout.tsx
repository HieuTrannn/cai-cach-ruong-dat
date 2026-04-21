import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Giải Mã Bức Ảnh Lịch Sử",
  description:
    "Game thuyết trình lịch sử: Việc cải cách ruộng đất năm 1953–1956 Đảng ta đã mắc sai lầm như thế nào?",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
