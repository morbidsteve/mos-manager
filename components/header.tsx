"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"

const navigation = [
    { name: "Marines", href: "/marines" },
    { name: "Assignments", href: "/assignments" },
    { name: "Units", href: "/units" },
    { name: "BICs", href: "/bics" },
    { name: "Timeline", href: "/timeline" },
    { name: "Statistics", href: "/statistics" }, // Added new navigation item
]

export function Header() {
    const pathname = usePathname()

    return (
        <header className="border-b">
            <div className="flex h-16 items-center px-4">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-semibold">MOS Management</h1>
                </div>
                <nav className="flex items-center space-x-6 ml-6">
                    {navigation.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "text-sm font-medium transition-colors hover:text-primary",
                                pathname === item.href ? "text-primary border-b-2 border-primary" : "text-muted-foreground",
                            )}
                        >
                            {item.name}
                        </Link>
                    ))}
                </nav>
            </div>
        </header>
    )
}

