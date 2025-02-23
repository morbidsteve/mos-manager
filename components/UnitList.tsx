"use client"

import { useEffect, useState, useCallback } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { Pencil, Trash2, Plus } from "lucide-react"

interface Unit {
    id: number
    mcc: string
    name: string
    notes?: string | null
}

interface UnitListProps {
    initialUnits: Unit[]
    isLoading: boolean
    onSuccess: () => Promise<void>
}

export default function UnitList({ initialUnits, isLoading, onSuccess }: UnitListProps) {
    const [units, setUnits] = useState<Unit[]>(initialUnits)
    const [editingUnit, setEditingUnit] = useState<Unit | null>(null)
    const [isAddingUnit, setIsAddingUnit] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchUnits = useCallback(async () => {
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
        }
    }, [])

    useEffect(() => {
        console.log("UnitList received initialUnits:", initialUnits)
        setUnits(initialUnits)
    }, [initialUnits])

    async function deleteUnit(id: number) {
        if (confirm("Are you sure you want to delete this Unit?")) {
            const response = await fetch(`/api/units/${id}`, {
                method: "DELETE",
            })
            if (response.ok) {
                await onSuccess()
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
            await onSuccess()
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
            await onSuccess()
            setIsAddingUnit(false)
        } else {
            console.error("Failed to add unit")
        }
    }

    const UnitForm = ({
                          unit,
                          onSubmit,
                          onCancel,
                      }: {
        unit: Partial<Unit>
        onSubmit: (unit: Partial<Unit>) => void
        onCancel: () => void
    }) => {
        const [formData, setFormData] = useState(unit)

        return (
            <form
                onSubmit={(e) => {
                    e.preventDefault()
                    onSubmit(formData)
                }}
                className="space-y-4"
            >
                <div className="space-y-4">
                    <div>
                        <label htmlFor="mcc" className="text-sm font-medium">
                            MCC *
                        </label>
                        <Input
                            id="mcc"
                            value={formData.mcc || ""}
                            onChange={(e) => setFormData((prev) => ({ ...prev, mcc: e.target.value }))}
                            placeholder="Enter MCC"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="name" className="text-sm font-medium">
                            Name *
                        </label>
                        <Input
                            id="name"
                            value={formData.name || ""}
                            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                            placeholder="Enter unit name"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="notes" className="text-sm font-medium">
                            Notes
                        </label>
                        <Textarea
                            id="notes"
                            value={formData.notes || ""}
                            onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                            placeholder="Enter any additional notes..."
                            className="min-h-[100px]"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button type="submit">{unit.id ? "Update Unit" : "Add Unit"}</Button>
                </DialogFooter>
            </form>
        )
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }
    if (error) return <div className="text-red-500">Error: {error}</div>

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Units</h2>
                <Button onClick={() => setIsAddingUnit(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Unit
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>MCC</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Notes</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {units.map((unit) => (
                            <TableRow key={unit.id}>
                                <TableCell>{unit.mcc}</TableCell>
                                <TableCell>{unit.name}</TableCell>
                                <TableCell>{unit.notes || "-"}</TableCell>
                                <TableCell>
                                    <div className="flex items-center justify-end gap-2">
                                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setEditingUnit(unit)}>
                                            <Pencil className="h-4 w-4" />
                                            <span className="sr-only">Edit</span>
                                        </Button>
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

            {/* Add Unit Dialog */}
            <Dialog open={isAddingUnit} onOpenChange={setIsAddingUnit}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Unit</DialogTitle>
                        <DialogDescription>
                            Enter the details for the new unit. Required fields are marked with an asterisk (*).
                        </DialogDescription>
                    </DialogHeader>
                    <UnitForm unit={{}} onSubmit={addUnit} onCancel={() => setIsAddingUnit(false)} />
                </DialogContent>
            </Dialog>

            {/* Edit Unit Dialog */}
            {editingUnit && (
                <Dialog open={!!editingUnit} onOpenChange={(open) => !open && setEditingUnit(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Unit</DialogTitle>
                            <DialogDescription>
                                Update the information for this unit. Required fields are marked with an asterisk (*).
                            </DialogDescription>
                        </DialogHeader>
                        <UnitForm unit={editingUnit} onSubmit={updateUnit} onCancel={() => setEditingUnit(null)} />
                    </DialogContent>
                </Dialog>
            )}
        </div>
    )
}

