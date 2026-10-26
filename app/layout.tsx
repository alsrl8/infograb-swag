import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "n8n 스웩 수령 체크",
  description: "가져간 스웩을 체크하고 남은 수량을 함께 확인하세요.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
