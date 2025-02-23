"use client"

import { useEffect, useState, useRef } from "react"
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
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pencil, Trash2, FileText, Plus } from "lucide-react"
import MarineDetails from "./MarineDetails"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import AssignmentForm from "./AssignmentForm"
import OrdersForm from "./OrdersForm"

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
    const dialogRef = useRef<HTMLDivElement>(null)
    const [assigningMarine, setAssigningMarine] = useState<AssignmentMarine | null>(null)
    const [addingOrdersFor, setAddingOrdersFor] = useState<AssignmentMarine | null>(null)

    useEffect(() => {
        console.log("MarineList received initialMarines:", initialMarines)
        setMarines(initialMarines)
    }, [initialMarines])

    async function fetchMarines() {
        const response = await fetch("/api/marines")
        if (response.ok) {
            const data = await response.json()
            setMarines(data.sort((a: Marine, b: Marine) => a.lastName.localeCompare(b.lastName)))
        } else {
            console.error("Failed to fetch marines")
        }
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
            const response = await fetch(`/api/marines/${id}`, {
                method: "DELETE",
            })
            if (response.ok) {
                await onSuccess()
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
            await onSuccess()
            setEditingMarine(null)
        } else {
            console.error("Failed to update marine")
        }
    }

    async function addMarine(marine: Partial<Marine>) {
        const response = await fetch("/api/marines", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(marine),
        })
        if (response.ok) {
            await onSuccess()
            setIsAddingMarine(false)
        } else {
            console.error("Failed to add marine")
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
        const [formData, setFormData] = useState(marine)

        const handleDateChange = (field: string, date: Date | undefined) => {
            setFormData((prev) => {
                const newState = { ...prev, [field]: date }

                // Calculate LDO FY when DOR changes and pay grade is W1
                if (field === "dor" && date && prev.payGrade === "W1") {
                    const ldoYear = new Date(date).getFullYear() + 5
                    newState.ldoFy = ldoYear
                }

                return newState
            })
        }

        return (
            <form
                onSubmit={(e) => {
                    e.preventDefault()
                    onSubmit(formData)
                }}
                className="space-y-6"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Personal Information */}
                    <div className="space-y-4">
                        <h3 className="font-semibold">Personal Information</h3>
                        <Input
                            name="edipi"
                            value={formData.edipi || ""}
                            onChange={(e) => setFormData((prev) => ({ ...prev, edipi: e.target.value }))}
                            placeholder="EDIPI"
                            required
                        />
                        <Input
                            name="lastName"
                            value={formData.lastName || ""}
                            onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
                            placeholder="Last Name"
                            required
                        />
                        <Input
                            name="firstName"
                            value={formData.firstName || ""}
                            onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
                            placeholder="First Name"
                            required
                        />
                        <Input
                            name="middleInitial"
                            value={formData.middleInitial || ""}
                            onChange={(e) => setFormData((prev) => ({ ...prev, middleInitial: e.target.value }))}
                            placeholder="Middle Initial"
                            maxLength={1}
                        />

                        <div className="space-y-2">
                            <label className="text-sm">Date of Birth</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !formData.dateOfBirth && "text-muted-foreground",
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {formData.dateOfBirth ? format(formData.dateOfBirth, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={formData.dateOfBirth}
                                        onSelect={(date) => handleDateChange("dateOfBirth", date)}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    {/* Military Information */}
                    <div className="space-y-4">
                        <h3 className="font-semibold">Military Information</h3>
                        <Select
                            value={formData.payGrade}
                            onValueChange={(value) => {
                                setFormData((prev) => {
                                    const newState = { ...prev, payGrade: value }

                                    // Calculate LDO FY when changing to W1 and DOR exists
                                    if (value === "W1" && prev.dor) {
                                        const ldoYear = new Date(prev.dor).getFullYear() + 5
                                        newState.ldoFy = ldoYear
                                    }

                                    return newState
                                })
                            }}
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
                            value={formData.pmos || ""}
                            onChange={(e) => setFormData((prev) => ({ ...prev, pmos: e.target.value }))}
                            placeholder="PMOS"
                            required
                        />

                        <div className="space-y-2">
                            <label className="text-sm">Date of Rank</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !formData.dor && "text-muted-foreground",
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {formData.dor ? format(formData.dor, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={formData.dor}
                                        onSelect={(date) => handleDateChange("dor", date)}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm">AFADBD</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !formData.afadbd && "text-muted-foreground",
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {formData.afadbd ? format(formData.afadbd, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={formData.afadbd}
                                        onSelect={(date) => handleDateChange("afadbd", date)}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
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

                        <Input
                            name="cmf"
                            value={formData.cmf || ""}
                            onChange={(e) => setFormData((prev) => ({ ...prev, cmf: e.target.value }))}
                            placeholder="CMF"
                        />

                        <Input
                            name="projectedSchoolhouse"
                            value={formData.projectedSchoolhouse || ""}
                            onChange={(e) => setFormData((prev) => ({ ...prev, projectedSchoolhouse: e.target.value }))}
                            placeholder="Projected Schoolhouse"
                        />

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
                    </div>

                    {/* Assignment Information */}
                    <div className="space-y-4">
                        <h3 className="font-semibold">Assignment Information</h3>
                        <div className="space-y-2">
                            <label className="text-sm">DCTB</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !formData.dctb && "text-muted-foreground",
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {formData.dctb ? format(formData.dctb, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={formData.dctb}
                                        onSelect={(date) => handleDateChange("dctb", date)}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm">DJCU</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !formData.djcu && "text-muted-foreground",
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {formData.djcu ? format(formData.djcu, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={formData.djcu}
                                        onSelect={(date) => handleDateChange("djcu", date)}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm">OCD</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !formData.ocd && "text-muted-foreground",
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {formData.ocd ? format(formData.ocd, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={formData.ocd}
                                        onSelect={(date) => handleDateChange("ocd", date)}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm">SEDD</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !formData.sedd && "text-muted-foreground",
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {formData.sedd ? format(formData.sedd, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={formData.sedd}
                                        onSelect={(date) => handleDateChange("sedd", date)}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <Input
                            type="number"
                            name="tourLength"
                            value={formData.tourLength || ""}
                            onChange={(e) => setFormData((prev) => ({ ...prev, tourLength: Number.parseInt(e.target.value) }))}
                            placeholder="Tour Length (months)"
                        />
                    </div>

                    {/* Additional Information */}
                    <div className="space-y-4">
                        <h3 className="font-semibold">Additional Information</h3>
                        <div className="space-y-2">
                            <label htmlFor="linealNumber" className="text-sm">
                                Lineal Number
                            </label>
                            <Input
                                id="linealNumber"
                                type="number"
                                name="linealNumber"
                                value={formData.linealNumber || ""}
                                onChange={(e) => setFormData((prev) => ({ ...prev, linealNumber: Number.parseInt(e.target.value) }))}
                                placeholder="Lineal Number"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="ldoFy" className="text-sm">
                                LDO Fiscal Year
                                <span className="text-muted-foreground ml-2 text-xs">(Auto-calculated: DOR + 5 years for WO1)</span>
                            </label>
                            <Input
                                id="ldoFy"
                                type="number"
                                name="ldoFy"
                                value={formData.ldoFy || ""}
                                readOnly
                                className="bg-muted"
                                placeholder="Automatically calculated for WO1"
                            />
                        </div>
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
                <h2 className="text-2xl font-bold">Marines</h2>
                <Button onClick={() => setIsAddingMarine(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Marine
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>EDIPI</TableHead>
                            <TableHead>Last Name</TableHead>
                            <TableHead>First Name</TableHead>
                            <TableHead>MI</TableHead>
                            <TableHead>Pay Grade</TableHead>
                            <TableHead>PMOS</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
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
            <Dialog open={isAddingMarine} onOpenChange={setIsAddingMarine}>
                <DialogContent className="sm:max-w-4xl w-[90vw] max-h-[90vh] overflow-y-auto">
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
                    <DialogContent className="sm:max-w-4xl w-[90vw] max-h-[90vh] overflow-y-auto">
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
                    <DialogContent className="sm:max-w-[800px] w-[90vw] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Marine Details</DialogTitle>
                        </DialogHeader>
                        <MarineDetails marineId={selectedMarineId} onClose={handleCloseDetails} />
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

