import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { Header } from "@/components/header"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
    title: "MOS Management System",
    description: "Marine Corps MOS Management System",
}

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
        <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">{children}</main>
        </div>
        </body>
        </html>
    )
}

