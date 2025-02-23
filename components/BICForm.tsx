"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pencil, Trash2 } from "lucide-react"

interface Unit {
    id: number
    mcc: string
    name: string
}

interface BIC {
    id: number
    bic: string
    description: string
    payGrade: string
    unitId: number
    unit: {
        id: number
        mcc: string
        name: string
    }
}

const payGrades = [
    "E1",
    "E2",
    "E3",
    "E4",
    "E5",
    "E6",
    "E7",
    "E8",
    "E9",
    "W1",
    "W2",
    "W3",
    "W4",
    "W5",
    "O1",
    "O2",
    "O3",
    "O4",
    "O5",
    "O6",
]

export default function BICList() {
    const [bics, setBICs] = useState<BIC[]>([])
    const [units, setUnits] = useState<Unit[]>([])
    const [isAddingBIC, setIsAddingBIC] = useState(false)
    const [editingBIC, setEditingBIC] = useState<BIC | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchBICs()
        fetchUnits()
    }, [])

    async function fetchBICs() {
        try {
            const response = await fetch("/api/bics")
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
            const data = await response.json()
            setBICs(data)
        } catch (error) {
            setError(error instanceof Error ? error.message : "Failed to fetch BICs")
        } finally {
            setIsLoading(false)
        }
    }

    async function fetchUnits() {
        try {
            const response = await fetch("/api/units")
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
            const data = await response.json()
            setUnits(data)
        } catch (error) {
            console.error("Failed to fetch units:", error)
        }
    }

    async function handleSubmit(formData: Partial<BIC>) {
        try {
            const response = await fetch("/api/bics", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            })

            if (!response.ok) throw new Error("Failed to create BIC")

            await fetchBICs()
            setIsAddingBIC(false)
        } catch (error) {
            console.error("Error creating BIC:", error)
            setError(error instanceof Error ? error.message : "Failed to create BIC")
        }
    }

    async function handleUpdate(bic: BIC) {
        try {
            const response = await fetch(`/api/bics/${bic.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(bic),
            })

            if (!response.ok) throw new Error("Failed to update BIC")

            await fetchBICs()
            setEditingBIC(null)
        } catch (error) {
            console.error("Error updating BIC:", error)
            setError(error instanceof Error ? error.message : "Failed to update BIC")
        }
    }

    async function handleDelete(id: number) {
        if (!confirm("Are you sure you want to delete this BIC?")) return

        try {
            const response = await fetch(`/api/bics/${id}`, {
                method: "DELETE",
            })

            if (!response.ok) throw new Error("Failed to delete BIC")

            await fetchBICs()
        } catch (error) {
            console.error("Error deleting BIC:", error)
            setError(error instanceof Error ? error.message : "Failed to delete BIC")
        }
    }

    const BICForm = ({
                         bic,
                         onSubmit,
                         onCancel,
                     }: {
        bic: Partial<BIC>
        onSubmit: (bic: Partial<BIC>) => void
        onCancel: () => void
    }) => {
        const [formData, setFormData] = useState(bic)

        return (
            <form
                onSubmit={(e) => {
                    e.preventDefault()
                    onSubmit(formData)
                }}
                className="space-y-4"
            >
                <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                        <label htmlFor="bic" className="text-sm font-medium">
                            BIC *
                        </label>
                        <Input
                            id="bic"
                            value={formData.bic || ""}
                            onChange={(e) => setFormData((prev) => ({ ...prev, bic: e.target.value }))}
                            placeholder="Enter BIC"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="description" className="text-sm font-medium">
                            Description *
                        </label>
                        <Input
                            id="description"
                            value={formData.description || ""}
                            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                            placeholder="Enter description"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="payGrade" className="text-sm font-medium">
                            Pay Grade *
                        </label>
                        <Select
                            value={formData.payGrade}
                            onValueChange={(value) => setFormData((prev) => ({ ...prev, payGrade: value }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select Pay Grade" />
                            </SelectTrigger>
                            <SelectContent>
                                {payGrades.map((grade) => (
                                    <SelectItem key={grade} value={grade}>
                                        {grade}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="unitId" className="text-sm font-medium">
                            Unit *
                        </label>
                        <Select
                            value={formData.unitId?.toString()}
                            onValueChange={(value) => setFormData((prev) => ({ ...prev, unitId: Number.parseInt(value) }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select Unit" />
                            </SelectTrigger>
                            <SelectContent>
                                {units.map((unit) => (
                                    <SelectItem key={unit.id} value={unit.id.toString()}>
                                        {unit.mcc} - {unit.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button type="submit">{bic.id ? "Update BIC" : "Add BIC"}</Button>
                </div>
            </form>
        )
    }

    if (isLoading) return <div>Loading...</div>
    if (error) return <div className="text-red-500">Error: {error}</div>

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">BICs</h2>
                <Button onClick={() => setIsAddingBIC(true)}>Add BIC</Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>BIC</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Pay Grade</TableHead>
                            <TableHead>Unit</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {bics.map((bic) => (
                            <TableRow key={bic.id}>
                                <TableCell>{bic.bic}</TableCell>
                                <TableCell>{bic.description}</TableCell>
                                <TableCell>{bic.payGrade}</TableCell>
                                <TableCell>
                                    {bic.unit.mcc} - {bic.unit.name}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center justify-end gap-2">
                                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setEditingBIC(bic)}>
                                            <Pencil className="h-4 w-4" />
                                            <span className="sr-only">Edit</span>
                                        </Button>
                                        <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDelete(bic.id)}>
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

            {/* Add BIC Dialog */}
            <Dialog open={isAddingBIC} onOpenChange={setIsAddingBIC}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New BIC</DialogTitle>
                        <DialogDescription>
                            Enter the details for the new BIC. Required fields are marked with an asterisk (*).
                        </DialogDescription>
                    </DialogHeader>
                    <BICForm bic={{}} onSubmit={handleSubmit} onCancel={() => setIsAddingBIC(false)} />
                </DialogContent>
            </Dialog>

            {/* Edit BIC Dialog */}
            {editingBIC && (
                <Dialog open={!!editingBIC} onOpenChange={(open) => !open && setEditingBIC(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit BIC</DialogTitle>
                            <DialogDescription>
                                Update the information for this BIC. Required fields are marked with an asterisk (*).
                            </DialogDescription>
                        </DialogHeader>
                        <BICForm bic={editingBIC} onSubmit={handleUpdate} onCancel={() => setEditingBIC(null)} />
                    </DialogContent>
                </Dialog>
            )}
        </div>
    )
}

