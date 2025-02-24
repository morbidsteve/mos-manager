"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { format } from "date-fns"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pencil, Trash2, FileText, Plus, ArrowUpDown, ArrowUp, ArrowDown, X, Filter } from "lucide-react"
import MarineDetails from "./MarineDetails"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import AssignmentForm from "./AssignmentForm"
import OrdersForm from "./OrdersForm"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Marine {
    id: number
    edipi: string
    lastName: string
    firstName: string
    middleInitial?: string
    payGrade: string
    pmos: string
    dateOfBirth?: Date
    dor: Date
    afadbd: Date
    trained?: boolean
    cmf?: string
    projectedSchoolhouse?: string
    dctb?: Date
    djcu?: Date
    ocd?: Date
    sedd?: Date
    clearance?: string
    poly?: string
    tourLength?: number
    linealNumber?: number
    ldoFy?: number
}

interface AssignmentMarine {
    id: number
    edipi: string
    lastName: string
    firstName: string
    middleInitial?: string
    payGrade: string
}

interface MarineListProps {
    initialMarines: Marine[]
    isLoading: boolean
    onSuccess: () => Promise<void>
}

interface FilterState {
    pmos: string[]
    payGrade: string[]
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

const clearanceLevels = ["Secret", "Top Secret", "TS/SCI"]
const polyTypes = ["CI", "Full Scope"]

export default function MarineList({ initialMarines, isLoading, onSuccess }: MarineListProps) {
    const [marines, setMarines] = useState<Marine[]>(initialMarines)
    const [editingMarine, setEditingMarine] = useState<Marine | null>(null)
    const [isAddingMarine, setIsAddingMarine] = useState(false)
    const [isViewingDetails, setIsViewingDetails] = useState(false)
    const [selectedMarineId, setSelectedMarineId] = useState<number | null>(null)
    const [assigningMarine, setAssigningMarine] = useState<AssignmentMarine | null>(null)
    const [addingOrdersFor, setAddingOrdersFor] = useState<AssignmentMarine | null>(null)
    const [filters, setFilters] = useState<FilterState>({
        pmos: [],
        payGrade: [],
    })

    const [sortConfig, setSortConfig] = useState<{
        key: string
        direction: "asc" | "desc" | null
    }>({
        key: "lastName",
        direction: "asc",
    })

    // Get unique values for filters
    const uniquePMOS = Array.from(new Set(marines.map((m) => m.pmos)))
        .filter(Boolean)
        .sort()
    const uniquePayGrades = Array.from(new Set(marines.map((m) => m.payGrade)))
        .filter(Boolean)
        .sort()

    const handleSort = (key: string) => {
        setSortConfig((current) => {
            if (current.key === key) {
                if (current.direction === "asc") {
                    return { key, direction: "desc" }
                }
                if (current.direction === "desc") {
                    return { key: "lastName", direction: "asc" }
                }
            }
            return { key, direction: "asc" }
        })
    }

    useEffect(() => {
        console.log("MarineList received initialMarines:", initialMarines)
        setMarines(initialMarines)
    }, [initialMarines])

    useEffect(() => {
        console.log("MarineList component mounted")
        return () => console.log("MarineList component unmounted")
    }, [])

    useEffect(() => {
        console.log("isAddingMarine state changed:", isAddingMarine)
    }, [isAddingMarine])

    // Filter and sort marines
    const filteredAndSortedMarines = [...marines]
        .filter((marine) => {
            const pmosMatch = filters.pmos.length === 0 || filters.pmos.includes(marine.pmos || "")
            const payGradeMatch = filters.payGrade.length === 0 || filters.payGrade.includes(marine.payGrade || "")
            return pmosMatch && payGradeMatch
        })
        .sort((a, b) => {
            if (sortConfig.direction === null) {
                return 0
            }

            const aValue = a[sortConfig.key as keyof typeof a]
            const bValue = b[sortConfig.key as keyof typeof b]

            if (aValue === null || aValue === undefined) return 1
            if (bValue === null || bValue === undefined) return -1

            const modifier = sortConfig.direction === "asc" ? 1 : -1

            if (typeof aValue === "string" && typeof bValue === "string") {
                return aValue.localeCompare(bValue) * modifier
            }

            if (aValue < bValue) return -1 * modifier
            if (aValue > bValue) return 1 * modifier
            return 0
        })

    const clearFilter = (type: keyof FilterState) => {
        setFilters((prev) => ({ ...prev, [type]: [] }))
    }

    const clearAllFilters = () => {
        setFilters({ pmos: [], payGrade: [] })
    }

    const handleViewDetails = (marineId: number) => {
        setSelectedMarineId(marineId)
        setIsViewingDetails(true)
    }

    const handleCloseDetails = () => {
        setIsViewingDetails(false)
        setSelectedMarineId(null)
    }

    async function deleteMarine(id: number) {
        if (confirm("Are you sure you want to delete this Marine?")) {
            try {
                const response = await fetch(`/api/marines/${id}`, {
                    method: "DELETE",
                })
                if (!response.ok) {
                    throw new Error("Failed to delete marine")
                }
                await onSuccess()
            } catch (error) {
                console.error("Failed to delete marine:", error)
            }
        }
    }

    async function updateMarine(marine: Partial<Marine>) {
        if (!marine.id) {
            console.error("Cannot update marine: No ID provided")
            return
        }

        try {
            const response = await fetch(`/api/marines/${marine.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(marine),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || "Failed to update marine")
            }

            const updatedMarine = await response.json()
            await onSuccess() // Refresh the list after successful update
            setEditingMarine(null)
        } catch (error) {
            console.error("Failed to update marine:", error)
            // You might want to show an error toast or message to the user here
        }
    }

    async function addMarine(marine: Partial<Marine>) {
        try {
            // Clean up the data before submission
            const cleanedData = {
                ...marine,
                // Convert empty strings to null for optional fields
                dateOfBirth: marine.dateOfBirth ? new Date(marine.dateOfBirth).toISOString() : null,
                middleInitial: marine.middleInitial || null,
                cmf: marine.cmf || null,
                projectedSchoolhouse: marine.projectedSchoolhouse || null,
                clearance: marine.clearance || null,
                poly: marine.poly || null,
                // Convert string numbers to actual numbers or null
                tourLength: marine.tourLength ? Number.parseInt(marine.tourLength.toString()) : null,
                linealNumber: marine.linealNumber ? Number.parseInt(marine.linealNumber.toString()) : null,
                ldoFy: marine.ldoFy ? Number.parseInt(marine.ldoFy.toString()) : null,
                // Convert date strings to ISO format
                dor: new Date(marine.dor as string).toISOString(),
                afadbd: new Date(marine.afadbd as string).toISOString(),
                dctb: marine.dctb ? new Date(marine.dctb).toISOString() : null,
                djcu: marine.djcu ? new Date(marine.djcu).toISOString() : null,
                ocd: marine.ocd ? new Date(marine.ocd).toISOString() : null,
                sedd: marine.sedd ? new Date(marine.sedd).toISOString() : null,
            }

            console.log("Submitting cleaned marine data:", cleanedData)
            const response = await fetch("/api/marines", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(cleanedData),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || "Failed to add marine")
            }

            await onSuccess()
            setIsAddingMarine(false)
        } catch (error) {
            console.error("Failed to add marine:", error)
            alert(error instanceof Error ? error.message : "Failed to add marine")
        }
    }

    const MarineForm = ({
                            marine,
                            onSubmit,
                            onCancel,
                        }: {
        marine: Partial<Marine>
        onSubmit: (marine: Partial<Marine>) => void
        onCancel: () => void
    }) => {
        console.log("MarineForm rendered with props:", { marine })
        const [formData, setFormData] = useState({
            id: marine.id, // Add this line to include the ID
            edipi: marine.edipi || "",
            lastName: marine.lastName || "",
            firstName: marine.firstName || "",
            middleInitial: marine.middleInitial || "",
            payGrade: marine.payGrade || "",
            pmos: marine.pmos || "",
            dateOfBirth: marine.dateOfBirth ? format(new Date(marine.dateOfBirth), "yyyy-MM-dd") : "",
            dor: marine.dor ? format(new Date(marine.dor), "yyyy-MM-dd") : "",
            afadbd: marine.afadbd ? format(new Date(marine.afadbd), "yyyy-MM-dd") : "",
            trained: marine.trained || false,
            cmf: marine.cmf || "",
            projectedSchoolhouse: marine.projectedSchoolhouse || "",
            clearance: marine.clearance || "",
            poly: marine.poly || "",
            tourLength: marine.tourLength?.toString() || "",
            linealNumber: marine.linealNumber?.toString() || "",
        })

        // Update the handleSubmit function to only send changed fields
        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault()
            console.log("Form submitted with data:", formData)
            if (!formData.id) {
                console.error("No marine ID provided for update")
                return
            }

            // Track which fields actually changed
            const changedFields = Object.entries(formData).reduce(
                (acc, [key, value]) => {
                    if (marine[key as keyof typeof marine] !== value) {
                        acc[key] = value
                    }
                    return acc
                },
                {} as Record<string, any>,
            )

            // Only format dates that actually changed
            const formattedData = {
                id: formData.id,
                ...changedFields,
                ...(changedFields.dateOfBirth && {
                    dateOfBirth: `${changedFields.dateOfBirth}T00:00:00.000Z`,
                }),
                ...(changedFields.dor && {
                    dor: `${changedFields.dor}T00:00:00.000Z`,
                }),
                ...(changedFields.afadbd && {
                    afadbd: `${changedFields.afadbd}T00:00:00.000Z`,
                }),
                ...(changedFields.tourLength && {
                    tourLength: Number.parseInt(changedFields.tourLength as string),
                }),
                ...(changedFields.linealNumber && {
                    linealNumber: Number.parseInt(changedFields.linealNumber as string),
                }),
            }

            onSubmit(formattedData)
        }

        return (
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Personal Information */}
                    <div className="space-y-4">
                        <h3 className="font-semibold">Personal Information</h3>
                        <Input
                            name="edipi"
                            value={formData.edipi}
                            onChange={(e) => setFormData((prev) => ({ ...prev, edipi: e.target.value }))}
                            placeholder="EDIPI"
                            required
                        />
                        <Input
                            name="lastName"
                            value={formData.lastName}
                            onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
                            placeholder="Last Name"
                            required
                        />
                        <Input
                            name="firstName"
                            value={formData.firstName}
                            onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
                            placeholder="First Name"
                            required
                        />
                        <Input
                            name="middleInitial"
                            value={formData.middleInitial}
                            onChange={(e) => setFormData((prev) => ({ ...prev, middleInitial: e.target.value }))}
                            placeholder="Middle Initial"
                            maxLength={1}
                        />
                    </div>

                    {/* Military Information */}
                    <div className="space-y-4">
                        <h3 className="font-semibold">Military Information</h3>
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

                        <Input
                            name="pmos"
                            value={formData.pmos}
                            onChange={(e) => setFormData((prev) => ({ ...prev, pmos: e.target.value }))}
                            placeholder="PMOS"
                        />

                        <div className="space-y-2">
                            <label className="text-sm">Date of Rank</label>
                            <Input
                                type="date"
                                name="dor"
                                value={formData.dor}
                                onChange={(e) => setFormData((prev) => ({ ...prev, dor: e.target.value }))}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm">AFADBD</label>
                            <Input
                                type="date"
                                name="afadbd"
                                value={formData.afadbd}
                                onChange={(e) => setFormData((prev) => ({ ...prev, afadbd: e.target.value }))}
                            />
                        </div>
                    </div>

                    {/* Training & Qualifications */}
                    <div className="space-y-4">
                        <h3 className="font-semibold">Training & Qualifications</h3>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="trained"
                                checked={formData.trained}
                                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, trained: checked === true }))}
                            />
                            <label htmlFor="trained">Trained</label>
                        </div>

                        <Select
                            value={formData.clearance}
                            onValueChange={(value) => setFormData((prev) => ({ ...prev, clearance: value }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select Clearance Level" />
                            </SelectTrigger>
                            <SelectContent>
                                {clearanceLevels.map((level) => (
                                    <SelectItem key={level} value={level}>
                                        {level}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={formData.poly} onValueChange={(value) => setFormData((prev) => ({ ...prev, poly: value }))}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Poly Type" />
                            </SelectTrigger>
                            <SelectContent>
                                {polyTypes.map((type) => (
                                    <SelectItem key={type} value={type}>
                                        {type}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Input
                            name="projectedSchoolhouse"
                            value={formData.projectedSchoolhouse}
                            onChange={(e) => setFormData((prev) => ({ ...prev, projectedSchoolhouse: e.target.value }))}
                            placeholder="Projected Schoolhouse"
                        />
                    </div>

                    {/* Additional Information */}
                    <div className="space-y-4">
                        <h3 className="font-semibold">Additional Information</h3>
                        <Input
                            type="number"
                            name="tourLength"
                            value={formData.tourLength}
                            onChange={(e) => setFormData((prev) => ({ ...prev, tourLength: e.target.value }))}
                            placeholder="Tour Length (months)"
                        />

                        <Input
                            type="number"
                            name="linealNumber"
                            value={formData.linealNumber}
                            onChange={(e) => setFormData((prev) => ({ ...prev, linealNumber: e.target.value }))}
                            placeholder="Lineal Number"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button type="submit">{marine.id ? "Update Marine" : "Add Marine"}</Button>
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

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold">Marines</h2>
                    {(filters.pmos.length > 0 || filters.payGrade.length > 0) && (
                        <div className="flex flex-wrap gap-2 items-center">
                            <span className="text-sm text-muted-foreground">Active filters:</span>
                            {filters.pmos.map((pmos) => (
                                <Badge key={pmos} variant="secondary" className="flex items-center gap-1">
                                    PMOS: {pmos}
                                    <X
                                        className="h-3 w-3 cursor-pointer"
                                        onClick={() =>
                                            setFilters((prev) => ({
                                                ...prev,
                                                pmos: prev.pmos.filter((p) => p !== pmos),
                                            }))
                                        }
                                    />
                                </Badge>
                            ))}
                            {filters.payGrade.map((grade) => (
                                <Badge key={grade} variant="secondary" className="flex items-center gap-1">
                                    Pay Grade: {grade}
                                    <X
                                        className="h-3 w-3 cursor-pointer"
                                        onClick={() =>
                                            setFilters((prev) => ({
                                                ...prev,
                                                payGrade: prev.payGrade.filter((p) => p !== grade),
                                            }))
                                        }
                                    />
                                </Badge>
                            ))}
                            <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-7 px-2 text-sm">
                                Clear all
                            </Button>
                        </div>
                    )}
                </div>
                <Button
                    onClick={() => {
                        console.log("Add Marine button clicked, current isAddingMarine state:", isAddingMarine)
                        setIsAddingMarine(true)
                        console.log("Setting isAddingMarine to true")
                    }}
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Marine
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("edipi")}>
                                <div className="flex items-center gap-1">
                                    EDIPI
                                    {sortConfig.key === "edipi" &&
                                        (sortConfig.direction === "asc" ? (
                                            <ArrowUp className="h-4 w-4" />
                                        ) : (
                                            <ArrowDown className="h-4 w-4" />
                                        ))}
                                    {sortConfig.key !== "edipi" && <ArrowUpDown className="h-4 w-4" />}
                                </div>
                            </TableHead>
                            <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("lastName")}>
                                <div className="flex items-center gap-1">
                                    Last Name
                                    {sortConfig.key === "lastName" &&
                                        (sortConfig.direction === "asc" ? (
                                            <ArrowUp className="h-4 w-4" />
                                        ) : (
                                            <ArrowDown className="h-4 w-4" />
                                        ))}
                                    {sortConfig.key !== "lastName" && <ArrowUpDown className="h-4 w-4" />}
                                </div>
                            </TableHead>
                            <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("firstName")}>
                                <div className="flex items-center gap-1">
                                    First Name
                                    {sortConfig.key === "firstName" &&
                                        (sortConfig.direction === "asc" ? (
                                            <ArrowUp className="h-4 w-4" />
                                        ) : (
                                            <ArrowDown className="h-4 w-4" />
                                        ))}
                                    {sortConfig.key !== "firstName" && <ArrowUpDown className="h-4 w-4" />}
                                </div>
                            </TableHead>
                            <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("middleInitial")}>
                                <div className="flex items-center gap-1">
                                    MI
                                    {sortConfig.key === "middleInitial" &&
                                        (sortConfig.direction === "asc" ? (
                                            <ArrowUp className="h-4 w-4" />
                                        ) : (
                                            <ArrowDown className="h-4 w-4" />
                                        ))}
                                    {sortConfig.key !== "middleInitial" && <ArrowUpDown className="h-4 w-4" />}
                                </div>
                            </TableHead>
                            <TableHead>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="-ml-3 h-8 data-[state=open]:bg-accent">
                                            <div className="flex items-center gap-1">
                                                Pay Grade
                                                <Filter className="h-4 w-4" />
                                                {filters.payGrade.length > 0 && (
                                                    <Badge variant="secondary" className="ml-1 h-6">
                                                        {filters.payGrade.length}
                                                    </Badge>
                                                )}
                                            </div>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-[150px]">
                                        {uniquePayGrades.map((grade) => (
                                            <DropdownMenuCheckboxItem
                                                key={grade}
                                                checked={filters.payGrade.includes(grade)}
                                                onCheckedChange={(checked) => {
                                                    setFilters((prev) => ({
                                                        ...prev,
                                                        payGrade: checked ? [...prev.payGrade, grade] : prev.payGrade.filter((g) => g !== grade),
                                                    }))
                                                }}
                                            >
                                                {grade}
                                            </DropdownMenuCheckboxItem>
                                        ))}
                                        {filters.payGrade.length > 0 && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="w-full justify-start font-normal"
                                                onClick={() => clearFilter("payGrade")}
                                            >
                                                Clear filters
                                            </Button>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableHead>
                            <TableHead>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="-ml-3 h-8 data-[state=open]:bg-accent">
                                            <div className="flex items-center gap-1">
                                                PMOS
                                                <Filter className="h-4 w-4" />
                                                {filters.pmos.length > 0 && (
                                                    <Badge variant="secondary" className="ml-1 h-6">
                                                        {filters.pmos.length}
                                                    </Badge>
                                                )}
                                            </div>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-[150px]">
                                        {uniquePMOS.map((pmos) => (
                                            <DropdownMenuCheckboxItem
                                                key={pmos}
                                                checked={filters.pmos.includes(pmos)}
                                                onCheckedChange={(checked) => {
                                                    setFilters((prev) => ({
                                                        ...prev,
                                                        pmos: checked ? [...prev.pmos, pmos] : prev.pmos.filter((p) => p !== pmos),
                                                    }))
                                                }}
                                            >
                                                {pmos}
                                            </DropdownMenuCheckboxItem>
                                        ))}
                                        {filters.pmos.length > 0 && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="w-full justify-start font-normal"
                                                onClick={() => clearFilter("pmos")}
                                            >
                                                Clear filters
                                            </Button>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredAndSortedMarines.map((marine) => (
                            <TableRow key={marine.id}>
                                <TableCell>{marine.edipi}</TableCell>
                                <TableCell>{marine.lastName}</TableCell>
                                <TableCell>{marine.firstName}</TableCell>
                                <TableCell>{marine.middleInitial}</TableCell>
                                <TableCell>{marine.payGrade}</TableCell>
                                <TableCell>{marine.pmos}</TableCell>
                                <TableCell>
                                    <div className="flex items-center justify-end gap-2">
                                        <Button variant="outline" size="sm" onClick={() => handleViewDetails(marine.id)}>
                                            View Details
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => setAddingOrdersFor(marine)}
                                        >
                                            <FileText className="h-4 w-4" />
                                            <span className="sr-only">Add Orders</span>
                                        </Button>
                                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setEditingMarine(marine)}>
                                            <Pencil className="h-4 w-4" />
                                            <span className="sr-only">Edit</span>
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => deleteMarine(marine.id)}
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

            {/* Add Marine Dialog */}
            <Dialog
                open={isAddingMarine}
                onOpenChange={(open) => {
                    console.log("Dialog onOpenChange called with value:", open)
                    setIsAddingMarine(open)
                }}
            >
                <DialogContent className="sm:max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Add New Marine</DialogTitle>
                        <DialogDescription>
                            Enter the details for the new Marine. Required fields are marked with an asterisk (*).
                        </DialogDescription>
                    </DialogHeader>
                    <MarineForm marine={{}} onSubmit={addMarine} onCancel={() => setIsAddingMarine(false)} />
                </DialogContent>
            </Dialog>

            {/* Edit Marine Dialog */}
            {editingMarine && (
                <Dialog open={!!editingMarine} onOpenChange={(open) => !open && setEditingMarine(null)}>
                    <DialogContent className="sm:max-w-4xl">
                        <DialogHeader>
                            <DialogTitle>Edit Marine</DialogTitle>
                            <DialogDescription>
                                Update the information for this Marine. Required fields are marked with an asterisk (*).
                            </DialogDescription>
                        </DialogHeader>
                        <MarineForm marine={editingMarine} onSubmit={updateMarine} onCancel={() => setEditingMarine(null)} />
                    </DialogContent>
                </Dialog>
            )}

            {/* View Details Dialog */}
            {isViewingDetails && selectedMarineId && (
                <Dialog open={isViewingDetails} onOpenChange={handleCloseDetails}>
                    <DialogContent className="max-w-[1000px] h-[85vh] p-0 flex flex-col overflow-hidden">
                        <DialogHeader className="p-6 flex-none">
                            <DialogTitle>Marine Details</DialogTitle>
                            <DialogDescription>View detailed information about this Marine.</DialogDescription>
                        </DialogHeader>
                        <ScrollArea className="flex-1 w-full">
                            <div className="p-6">
                                <MarineDetails marineId={selectedMarineId} onClose={handleCloseDetails} />
                            </div>
                        </ScrollArea>
                    </DialogContent>
                </Dialog>
            )}

            {/* Assignment Dialog */}
            {assigningMarine && (
                <Dialog open={!!assigningMarine} onOpenChange={(open) => !open && setAssigningMarine(null)}>
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>Assign Marine</DialogTitle>
                            <DialogDescription>
                                Create a new assignment for {assigningMarine.lastName}, {assigningMarine.firstName}
                            </DialogDescription>
                        </DialogHeader>
                        <AssignmentForm
                            marine={assigningMarine}
                            onSuccess={() => setAssigningMarine(null)}
                            onCancel={() => setAssigningMarine(null)}
                        />
                    </DialogContent>
                </Dialog>
            )}

            {/* Orders Dialog */}
            {addingOrdersFor && (
                <Dialog open={!!addingOrdersFor} onOpenChange={(open) => !open && setAddingOrdersFor(null)}>
                    <DialogContent className="sm:max-w-[800px]">
                        <DialogHeader>
                            <DialogTitle>Add Orders</DialogTitle>
                            <DialogDescription>
                                Create new orders for {addingOrdersFor.lastName}, {addingOrdersFor.firstName}
                            </DialogDescription>
                        </DialogHeader>
                        <OrdersForm
                            marine={addingOrdersFor}
                            onSuccess={() => {
                                setAddingOrdersFor(null)
                                // Refresh assignments if needed
                            }}
                            onCancel={() => setAddingOrdersFor(null)}
                        />
                    </DialogContent>
                </Dialog>
            )}
        </div>
    )
}

