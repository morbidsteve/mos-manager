"use client"

import { useEffect, useState } from "react"
import type { Marine } from "@prisma/client"

type MarineWithAssignments = Marine & {
    assignments: Array<{
        unit: { name: string; mcc: string }
        bic: { bic: string; description: string }
    }>
}

export default function MarinesPage() {
    const [marines, setMarines] = useState<MarineWithAssignments[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchMarines() {
            try {
                setLoading(true)
                setError(null)
                const res = await fetch("/api/marines")
                if (!res.ok) throw new Error(`Error: ${res.statusText}`)
                const data = await res.json()
                setMarines(data)
            } catch (err) {
                console.error("Error fetching marines:", err)
                setError(err instanceof Error ? err.message : "Failed to fetch marines")
            } finally {
                setLoading(false)
            }
        }

        fetchMarines()
    }, [])

    async function handleDelete(id: number) {
        if (!confirm("Are you sure you want to delete this marine?")) return

        try {
            const res = await fetch("/api/marines", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ id }),
            })

            if (!res.ok) throw new Error("Failed to delete marine")

            setMarines(marines.filter((marine) => marine.id !== id))
        } catch (err) {
            console.error("Error deleting marine:", err)
            alert("Failed to delete marine")
        }
    }

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
                <h2 className="text-2xl font-bold">Marines</h2>
                <button className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md">
                    Add Marine
                </button>
            </div>

            <div className="rounded-md border">
                <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted">
                    <tr>
                        <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                        >
                            Name
                        </th>
                        <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                        >
                            EDIPI
                        </th>
                        <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                        >
                            Pay Grade
                        </th>
                        <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                        >
                            PMOS
                        </th>
                        <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                        >
                            Current Assignment
                        </th>
                        <th scope="col" className="relative px-6 py-3">
                            <span className="sr-only">Actions</span>
                        </th>
                    </tr>
                    </thead>
                    <tbody className="bg-background divide-y divide-border">
                    {marines.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="px-6 py-4 text-center text-muted-foreground">
                                No marines found
                            </td>
                        </tr>
                    ) : (
                        marines.map((marine) => (
                            <tr key={marine.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {marine.lastName}, {marine.firstName} {marine.middleInitial || ""}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">{marine.edipi}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{marine.payGrade}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{marine.pmos}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {marine.assignments?.[0] ? (
                                        <>
                                            {marine.assignments[0].unit.name} ({marine.assignments[0].bic.bic})
                                        </>
                                    ) : (
                                        <span className="text-muted-foreground">No current assignment</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button className="text-primary hover:text-primary/80 mr-4">Edit</button>
                                    <button onClick={() => handleDelete(marine.id)} className="text-red-600 hover:text-red-900">
                                        Delete
                                    </button>
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

