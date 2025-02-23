"use client"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Pencil, Trash2 } from "lucide-react"

interface Assignment {
    id: number
    marine: {
        lastName: string
        firstName: string
    }
    unit: {
        name: string
    }
    bic: {
        bic: string
    }
    dctb: string
    djcu: string
    ocd?: string
}

interface AssignmentListProps {
    initialAssignments: Assignment[]
    isLoading: boolean
    onSuccess: () => Promise<void>
}

export default function AssignmentList({ initialAssignments, isLoading, onSuccess }: AssignmentListProps) {
    const [assignments, setAssignments] = useState<Assignment[]>(initialAssignments)
    const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null)
    const [error, setError] = useState<string | null>(null)

    async function fetchAssignments() {
        try {
            const response = await fetch("/api/assignments")
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }
            const data = await response.json()
            setAssignments(data)
        } catch (error) {
            setError((error as Error).message)
        }
    }

    useEffect(() => {
        console.log("AssignmentList received initialAssignments:", initialAssignments)
        setAssignments(initialAssignments)
    }, [initialAssignments])

    async function deleteAssignment(id: number) {
        if (confirm("Are you sure you want to delete this Assignment?")) {
            const response = await fetch(`/api/assignments/${id}`, {
                method: "DELETE",
            })
            if (response.ok) {
                await onSuccess()
            } else {
                console.error("Failed to delete assignment")
            }
        }
    }

    async function updateAssignment(assignment: Assignment) {
        const response = await fetch(`/api/assignments/${assignment.id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(assignment),
        })
        if (response.ok) {
            await onSuccess()
            setEditingAssignment(null)
        } else {
            console.error("Failed to update assignment")
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="mt-6">
                <h2 className="text-2xl font-bold mb-4">Assignment List</h2>
                <p>Error: {error}</p>
            </div>
        )
    }

    return (
        <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Assignment List</h2>
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Marine</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead>BIC</TableHead>
                        <TableHead>DCTB</TableHead>
                        <TableHead>DJCU</TableHead>
                        <TableHead>OCD</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {assignments.map((assignment) => (
                        <TableRow key={assignment.id}>
                            <TableCell>{`${assignment.marine.lastName}, ${assignment.marine.firstName}`}</TableCell>
                            <TableCell>{assignment.unit.name}</TableCell>
                            <TableCell>{assignment.bic.bic}</TableCell>
                            <TableCell>{assignment.dctb ? new Date(assignment.dctb).toLocaleDateString() : "N/A"}</TableCell>
                            <TableCell>{assignment.djcu ? new Date(assignment.djcu).toLocaleDateString() : "N/A"}</TableCell>
                            <TableCell>{assignment.ocd ? new Date(assignment.ocd).toLocaleDateString() : "N/A"}</TableCell>
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
                                                <DialogTitle>Edit Assignment</DialogTitle>
                                            </DialogHeader>
                                            <form
                                                onSubmit={(e) => {
                                                    e.preventDefault()
                                                    if (editingAssignment) {
                                                        updateAssignment(editingAssignment)
                                                    }
                                                }}
                                                className="space-y-4"
                                            >
                                                <Input
                                                    type="date"
                                                    value={editingAssignment?.dctb?.split("T")[0] || ""}
                                                    onChange={(e) =>
                                                        setEditingAssignment((prev) => (prev ? { ...prev, dctb: e.target.value } : null))
                                                    }
                                                    placeholder="DCTB"
                                                />
                                                <Input
                                                    type="date"
                                                    value={editingAssignment?.djcu?.split("T")[0] || ""}
                                                    onChange={(e) =>
                                                        setEditingAssignment((prev) => (prev ? { ...prev, djcu: e.target.value } : null))
                                                    }
                                                    placeholder="DJCU"
                                                />
                                                <Input
                                                    type="date"
                                                    value={editingAssignment?.ocd?.split("T")[0] || ""}
                                                    onChange={(e) =>
                                                        setEditingAssignment((prev) => (prev ? { ...prev, ocd: e.target.value } : null))
                                                    }
                                                    placeholder="OCD"
                                                />
                                                <Button type="submit">Update Assignment</Button>
                                            </form>
                                        </DialogContent>
                                    </Dialog>
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => deleteAssignment(assignment.id)}
                                    >
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

