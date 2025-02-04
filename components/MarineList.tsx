"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pencil, Trash2 } from "lucide-react"
import MarineDetails from "./MarineDetails"

interface Marine {
    id: number
    edipi: string
    lastName: string
    firstName: string
    middleInitial?: string
    payGrade: string
    pmos: string
}

export default function MarineList() {
    const [marines, setMarines] = useState<Marine[]>([])
    const [editingMarine, setEditingMarine] = useState<Marine | null>(null)
    const [isAddingMarine, setIsAddingMarine] = useState(false)
    const [isViewingDetails, setIsViewingDetails] = useState(false)
    const [selectedMarineId, setSelectedMarineId] = useState<number | null>(null)

    useEffect(() => {
        fetchMarines()
    }, [])

    async function fetchMarines() {
        const response = await fetch("/api/marines")
        if (response.ok) {
            const data = await response.json()
            setMarines(data.sort((a, b) => a.lastName.localeCompare(b.lastName)))
        } else {
            console.error("Failed to fetch marines")
        }
    }

    const handleViewDetails = (marineId: number) => {
        setSelectedMarineId(marineId)
        setIsViewingDetails(true)
    }

    async function deleteMarine(id: number) {
        if (confirm("Are you sure you want to delete this Marine?")) {
            const response = await fetch(`/api/marines/${id}`, {
                method: "DELETE",
            })
            if (response.ok) {
                fetchMarines()
            } else {
                console.error("Failed to delete marine")
            }
        }
    }

    async function updateMarine(marine: Marine) {
        const response = await fetch(`/api/marines/${marine.id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(marine),
        })
        if (response.ok) {
            fetchMarines()
            setEditingMarine(null)
        } else {
            console.error("Failed to update marine")
        }
    }

    async function addMarine(marine: Marine) {
        const response = await fetch("/api/marines", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(marine),
        })
        if (response.ok) {
            fetchMarines()
            setIsAddingMarine(false)
        } else {
            console.error("Failed to add marine")
        }
    }

    return (
        <div className="mt-6">
            <h2 className="text-2xl font-bold mb-4">Marine List</h2>
            <Button onClick={() => setIsAddingMarine(true)}>Add Marine</Button>
            <Dialog open={isAddingMarine} onOpenChange={setIsAddingMarine}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Marine</DialogTitle>
                    </DialogHeader>
                    <form
                        onSubmit={async (e: React.FormEvent<HTMLFormElement>) => {
                            e.preventDefault()
                            const form = e.currentTarget
                            const edipi = (form.elements.namedItem("edipi") as HTMLInputElement).value
                            const lastName = (form.elements.namedItem("lastName") as HTMLInputElement).value
                            const firstName = (form.elements.namedItem("firstName") as HTMLInputElement).value
                            const middleInitial = (form.elements.namedItem("middleInitial") as HTMLInputElement).value
                            const payGrade = (form.elements.namedItem("payGrade") as HTMLInputElement).value
                            const pmos = (form.elements.namedItem("pmos") as HTMLInputElement).value

                            await addMarine({
                                id: 0,
                                edipi,
                                lastName,
                                firstName,
                                middleInitial: middleInitial || undefined,
                                payGrade,
                                pmos,
                            })
                        }}
                        className="space-y-4"
                    >
                        <Input name="edipi" placeholder="EDIPI" />
                        <Input name="lastName" placeholder="Last Name" />
                        <Input name="firstName" placeholder="First Name" />
                        <Input name="middleInitial" placeholder="Middle Initial" />
                        <Input name="payGrade" placeholder="Pay Grade" />
                        <Input name="pmos" placeholder="PMOS" />
                        <Button type="submit">Add Marine</Button>
                    </form>
                </DialogContent>
            </Dialog>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>EDIPI</TableHead>
                        <TableHead>Last Name</TableHead>
                        <TableHead>First Name</TableHead>
                        <TableHead>MI</TableHead>
                        <TableHead>Pay Grade</TableHead>
                        <TableHead>PMOS</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {marines.map((marine) => (
                        <TableRow key={marine.id}>
                            <TableCell>{marine.edipi}</TableCell>
                            <TableCell>{marine.lastName}</TableCell>
                            <TableCell>{marine.firstName}</TableCell>
                            <TableCell>{marine.middleInitial}</TableCell>
                            <TableCell>{marine.payGrade}</TableCell>
                            <TableCell>{marine.pmos}</TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" onClick={() => handleViewDetails(marine.id)}>
                                        View Details
                                    </Button>
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" size="icon" className="h-8 w-8">
                                                <Pencil className="h-4 w-4" />
                                                <span className="sr-only">Edit</span>
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Edit Marine</DialogTitle>
                                            </DialogHeader>
                                            <form
                                                onSubmit={(e) => {
                                                    e.preventDefault()
                                                    if (editingMarine) {
                                                        updateMarine(editingMarine)
                                                    }
                                                }}
                                                className="space-y-4"
                                            >
                                                <Input
                                                    value={editingMarine?.edipi || ""}
                                                    onChange={(e) =>
                                                        setEditingMarine((prev) => (prev ? { ...prev, edipi: e.target.value } : null))
                                                    }
                                                    placeholder="EDIPI"
                                                />
                                                <Input
                                                    value={editingMarine?.lastName || ""}
                                                    onChange={(e) =>
                                                        setEditingMarine((prev) => (prev ? { ...prev, lastName: e.target.value } : null))
                                                    }
                                                    placeholder="Last Name"
                                                />
                                                <Input
                                                    value={editingMarine?.firstName || ""}
                                                    onChange={(e) =>
                                                        setEditingMarine((prev) => (prev ? { ...prev, firstName: e.target.value } : null))
                                                    }
                                                    placeholder="First Name"
                                                />
                                                <Input
                                                    value={editingMarine?.middleInitial || ""}
                                                    onChange={(e) =>
                                                        setEditingMarine((prev) => (prev ? { ...prev, middleInitial: e.target.value } : null))
                                                    }
                                                    placeholder="Middle Initial"
                                                />
                                                <Input
                                                    value={editingMarine?.payGrade || ""}
                                                    onChange={(e) =>
                                                        setEditingMarine((prev) => (prev ? { ...prev, payGrade: e.target.value } : null))
                                                    }
                                                    placeholder="Pay Grade"
                                                />
                                                <Input
                                                    value={editingMarine?.pmos || ""}
                                                    onChange={(e) =>
                                                        setEditingMarine((prev) => (prev ? { ...prev, pmos: e.target.value } : null))
                                                    }
                                                    placeholder="PMOS"
                                                />
                                                <Button type="submit">Update Marine</Button>
                                            </form>
                                        </DialogContent>
                                    </Dialog>
                                    <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => deleteMarine(marine.id)}>
                                        <Trash2 className="h-4 w-4" />
                                        <span className="sr-only">Delete</span>
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            <Dialog open={isViewingDetails} onOpenChange={setIsViewingDetails}>
                <DialogContent className="sm:max-w-[800px] w-[90vw] bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold mb-4">Marine Details</DialogTitle>
                        <DialogDescription className="text-gray-600 dark:text-gray-300 mb-4">
                            Detailed information for the selected Marine.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedMarineId !== null && (
                        <MarineDetails
                            key={selectedMarineId}
                            marineId={selectedMarineId}
                            setIsViewingDetails={setIsViewingDetails}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}

