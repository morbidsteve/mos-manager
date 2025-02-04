"use client"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Pencil, Trash2 } from "lucide-react"

interface Unit {
    id: number
    mcc: string
    name: string
    notes?: string | null
}

export default function UnitList() {
    const [units, setUnits] = useState<Unit[]>([])
    const [editingUnit, setEditingUnit] = useState<Unit | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    async function fetchUnits() {
        try {
            const response = await fetch("/api/units")
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }
            const data = await response.json()
            setUnits(data)
        } catch (error) {
            setError(error instanceof Error ? error.message : "An unexpected error occurred.")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchUnits()
    }, [])

    async function deleteUnit(id: number) {
        if (confirm("Are you sure you want to delete this Unit?")) {
            const response = await fetch(`/api/units/${id}`, {
                method: "DELETE",
            })
            if (response.ok) {
                fetchUnits()
            } else {
                console.error("Failed to delete unit")
            }
        }
    }

    async function updateUnit(unit: Unit) {
        const response = await fetch(`/api/units/${unit.id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(unit),
        })
        if (response.ok) {
            fetchUnits()
            setEditingUnit(null)
        } else {
            console.error("Failed to update unit")
        }
    }

    async function addUnit(unit: Omit<Unit, "id">) {
        const response = await fetch("/api/units", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(unit),
        })
        if (response.ok) {
            fetchUnits()
        } else {
            console.error("Failed to add unit")
        }
    }

    if (isLoading) return <div>Loading...</div>
    if (error) return <div>Error: {error}</div>

    return (
        <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Unit List</h2>
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>MCC</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {units.map((unit) => (
                        <TableRow key={unit.id}>
                            <TableCell>{unit.mcc}</TableCell>
                            <TableCell>{unit.name}</TableCell>
                            <TableCell>{unit.notes || "-"}</TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" size="icon" className="h-8 w-8">
                                                <Pencil className="h-4 w-4" />
                                                <span className="sr-only">Edit</span>
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Edit Unit</DialogTitle>
                                            </DialogHeader>
                                            <form
                                                onSubmit={(e) => {
                                                    e.preventDefault()
                                                    if (editingUnit) {
                                                        updateUnit(editingUnit)
                                                    }
                                                }}
                                                className="space-y-4"
                                            >
                                                <Input
                                                    value={editingUnit?.mcc || ""}
                                                    onChange={(e) => setEditingUnit((prev) => (prev ? { ...prev, mcc: e.target.value } : null))}
                                                    placeholder="MCC"
                                                />
                                                <Input
                                                    value={editingUnit?.name || ""}
                                                    onChange={(e) => setEditingUnit((prev) => (prev ? { ...prev, name: e.target.value } : null))}
                                                    placeholder="Name"
                                                />
                                                <Textarea
                                                    value={editingUnit?.notes || ""}
                                                    onChange={(e) => setEditingUnit((prev) => (prev ? { ...prev, notes: e.target.value } : null))}
                                                    placeholder="Notes"
                                                    className="min-h-[100px]"
                                                />
                                                <Button type="submit">Update Unit</Button>
                                            </form>
                                        </DialogContent>
                                    </Dialog>
                                    <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => deleteUnit(unit.id)}>
                                        <Trash2 className="h-4 w-4" />
                                        <span className="sr-only">Delete</span>
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}

