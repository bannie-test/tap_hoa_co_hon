import "./global.css";
import type { Metadata } from "next";
import { Nunito } from "next/font/google";

const outfit = Nunito({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  display: "swap",
  variable: "--font-outfit",
});

export const metadata: Metadata = { title: "Quản lý Tạp hóa Cô Hồng" };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={outfit.variable}>
      <body>{children}</body>
    </html>
  );
}
