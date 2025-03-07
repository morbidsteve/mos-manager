"use client"

import { useEffect, useState } from "react"
import type { BIC } from "@prisma/client"

export default function BICsPage() {
    const [bics, setBics] = useState<BIC[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchBICs() {
            try {
                setLoading(true)
                setError(null)
                const res = await fetch("/api/bics")
                if (!res.ok) throw new Error(`Error: ${res.statusText}`)
                const data = await res.json()
                setBics(data)
            } catch (err) {
                console.error("Error fetching BICs:", err)
                setError(err instanceof Error ? err.message : "Failed to fetch BICs")
            } finally {
                setLoading(false)
            }
        }

        fetchBICs()
    }, [])

    if (error) {
        return (
            <div className="p-4">
                <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline">{error}</span>
                </div>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="p-4">
                <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="space-y-3">
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">BICs</h2>
                <button className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md">Add BIC</button>
            </div>

            <div className="rounded-md border">
                <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted">
                    <tr>
                        <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                        >
                            BIC
                        </th>
                        <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                        >
                            Description
                        </th>
                        <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                        >
                            Pay Grade
                        </th>
                        <th scope="col" className="relative px-6 py-3">
                            <span className="sr-only">Actions</span>
                        </th>
                    </tr>
                    </thead>
                    <tbody className="bg-background divide-y divide-border">
                    {bics.length === 0 ? (
                        <tr>
                            <td colSpan={4} className="px-6 py-4 text-center text-muted-foreground">
                                No BICs found
                            </td>
                        </tr>
                    ) : (
                        bics.map((bic) => (
                            <tr key={bic.id}>
                                <td className="px-6 py-4 whitespace-nowrap">{bic.bic}</td>
                                <td className="px-6 py-4">{bic.description}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{bic.payGrade}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button className="text-primary hover:text-primary/80 mr-4">Edit</button>
                                    <button className="text-red-600 hover:text-red-900">Delete</button>
                                </td>
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

