"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const navItems = [
    { href: "/", label: "Home" },
    { href: "/admin", label: "Admin" },
]

export function MainNav() {
    const pathname = usePathname()

    return (
        <nav className="flex space-x-4 lg:space-x-6">
            {navItems.map((item) => (
                <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                        "text-sm font-medium transition-colors hover:text-primary",
                        pathname === item.href ? "text-black dark:text-white" : "text-muted-foreground",
                    )}
                >
                    {item.label}
                </Link>
            ))}
        </nav>
    )
}

