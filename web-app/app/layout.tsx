import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Insta-Cli-Tiktok",
  description: "TikTok Automation Dashboard",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className="dark">
      <body className={inter.className}>
        <div className="flex h-screen bg-tiktok-black text-white overflow-hidden">
          {children}
        </div>
      </body>
    </html>
  )
}
