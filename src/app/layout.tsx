// File: src/app/layout.tsx
import type { Metadata } from "next"
import Image from "next/image"
import { Geist, Geist_Mono } from "next/font/google"
import { freightDisplay } from "@/fonts"
import "./globals.css"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

export const metadata: Metadata = {
  title: "whenIwas",
  description: "your safe space",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`
          ${geistSans.variable}
          ${geistMono.variable}
          ${freightDisplay.variable}
          antialiased bg-background text-foreground h-full relative
        `}
      >
        {/* Global logo in the top-left corner */}
        <div className="absolute top-4 left-4 z-10">
          <Image
            src="/logo.svg"
            alt="whenIwas logo"
            width={48}
            height={48}
            priority
          />
        </div>

        {/* Page content */}
        {children}
      </body>
    </html>
  )
}
