"use client"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Pencil, Trash2 } from "lucide-react"

interface BIC {
    id: number
    bic: string
    description: string
    payGrade: string
    unit: {
        id: number
        name: string
        mcc: string
    }
}

export default function BICList() {
    const [bics, setBICs] = useState<BIC[]>([])
    const [editingBIC, setEditingBIC] = useState<BIC | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchBICs = async () => {
        try {
            const response = await fetch("/api/bics")
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }
            const data = await response.json()
            setBICs(data)
        } catch (error) {
            setError(error instanceof Error ? error.message : "An unexpected error occurred.")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchBICs()
    }, []) //Fixed: Added empty dependency array to useEffect

    const deleteBIC = async (id: number) => {
        if (confirm("Are you sure you want to delete this BIC?")) {
            try {
                const response = await fetch(`/api/bics/${id}`, {
                    method: "DELETE",
                })
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`)
                }
                await fetchBICs()
            } catch (error) {
                console.error("Failed to delete BIC:", error)
            }
        }
    }

    const updateBIC = async (bic: BIC) => {
        try {
            const response = await fetch(`/api/bics/${bic.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    bic: bic.bic,
                    description: bic.description,
                    payGrade: bic.payGrade,
                    unitId: bic.unit.id,
                }),
            })
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }
            await fetchBICs()
            setEditingBIC(null)
        } catch (error) {
            console.error("Failed to update BIC:", error)
        }
    }

    if (isLoading) return <div>Loading...</div>
    if (error) return <div>Error: {error}</div>

    return (
        <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">BIC List</h2>
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>BIC</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Pay Grade</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {bics.map((bic) => (
                        <TableRow key={bic.id}>
                            <TableCell>{bic.bic}</TableCell>
                            <TableCell>{bic.description}</TableCell>
                            <TableCell>{bic.payGrade}</TableCell>
                            <TableCell>{`${bic.unit.name} (${bic.unit.mcc})`}</TableCell>
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
                                                <DialogTitle>Edit BIC</DialogTitle>
                                            </DialogHeader>
                                            <form
                                                onSubmit={(e) => {
                                                    e.preventDefault()
                                                    if (editingBIC) {
                                                        updateBIC(editingBIC)
                                                    }
                                                }}
                                                className="space-y-4"
                                            >
                                                <Input
                                                    value={editingBIC?.bic || ""}
                                                    onChange={(e) => setEditingBIC((prev) => (prev ? { ...prev, bic: e.target.value } : null))}
                                                    placeholder="BIC"
                                                />
                                                <Input
                                                    value={editingBIC?.description || ""}
                                                    onChange={(e) =>
                                                        setEditingBIC((prev) => (prev ? { ...prev, description: e.target.value } : null))
                                                    }
                                                    placeholder="Description"
                                                />
                                                <Input
                                                    value={editingBIC?.payGrade || ""}
                                                    onChange={(e) =>
                                                        setEditingBIC((prev) => (prev ? { ...prev, payGrade: e.target.value } : null))
                                                    }
                                                    placeholder="Pay Grade"
                                                />
                                                <Input
                                                    value={editingBIC?.unit.id || ""}
                                                    onChange={(e) =>
                                                        setEditingBIC((prev) =>
                                                            prev ? { ...prev, unit: { ...prev.unit, id: Number(e.target.value) } } : null,
                                                        )
                                                    }
                                                    placeholder="Unit ID"
                                                    type="number"
                                                />
                                                <Button type="submit">Update BIC</Button>
                                            </form>
                                        </DialogContent>
                                    </Dialog>
                                    <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => deleteBIC(bic.id)}>
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



