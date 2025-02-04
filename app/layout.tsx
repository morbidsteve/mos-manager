import "./globals.css"
import { Inter } from "next/font/google"
import type React from "react"
import { MainNav } from "../components/MainNav"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
    title: "MOS Management System",
    description: "Management system for MOS 1710",
}

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
        <body className={inter.className}>
        <header className="border-b">
            <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                <h1 className="text-2xl font-bold">MOS Management</h1>
                <MainNav />
            </div>
        </header>
        <main>{children}</main>
        </body>
        </html>
    )
}

