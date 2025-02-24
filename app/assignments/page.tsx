"use client"

import { useEffect, useState } from "react"
import type { Assignment, Marine, Unit, BIC } from "@prisma/client"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Filter, Search, X } from "lucide-react"
import AssignmentForm from "@/components/AssignmentForm"

type AssignmentWithDetails = Assignment & {
    marine: Marine
    unit: Unit
    bic: BIC
}

interface FilterState {
    pmos: string[]
    payGrade: string[]
    unit: string[]
}

export default function AssignmentsPage() {
    const [assignments, setAssignments] = useState<AssignmentWithDetails[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [filters, setFilters] = useState<FilterState>({
        pmos: [],
        payGrade: [],
        unit: [],
    })
    const [isCreatingAssignment, setIsCreatingAssignment] = useState(false)
    const [editingAssignment, setEditingAssignment] = useState<AssignmentWithDetails | null>(null)

    useEffect(() => {
        fetchAssignments()
    }, [])

    const fetchAssignments = async () => {
        try {
            setLoading(true)
            setError(null)
            const res = await fetch("/api/assignments")
            if (!res.ok) throw new Error(`Error: ${res.statusText}`)
            const data = await res.json()
            setAssignments(data)
        } catch (err) {
            console.error("Error fetching assignments:", err)
            setError(err instanceof Error ? err.message : "Failed to fetch assignments")
        } finally {
            setLoading(false)
        }
    }

    // Get unique values for filters
    const uniquePMOS = Array.from(new Set(assignments.map((a) => a.marine.pmos)))
        .filter(Boolean)
        .sort()
    const uniquePayGrades = Array.from(new Set(assignments.map((a) => a.marine.payGrade)))
        .filter(Boolean)
        .sort()
    const uniqueUnits = Array.from(new Set(assignments.map((a) => a.unit.mcc)))
        .filter(Boolean)
        .sort()

    const clearFilter = (type: keyof FilterState) => {
        setFilters((prev) => ({ ...prev, [type]: [] }))
    }

    const clearAllFilters = () => {
        setFilters({ pmos: [], payGrade: [], unit: [] })
        setSearchQuery("")
    }

    const handleAssignmentSuccess = async () => {
        await fetchAssignments()
        setIsCreatingAssignment(false)
        setEditingAssignment(null)
    }

    // Filter assignments based on search query and filters
    const filteredAssignments = assignments.filter((assignment) => {
        // Apply search filter
        const searchLower = searchQuery.toLowerCase()
        const matchesSearch =
            searchQuery === "" ||
            assignment.marine.lastName.toLowerCase().includes(searchLower) ||
            assignment.marine.firstName.toLowerCase().includes(searchLower) ||
            assignment.unit.name.toLowerCase().includes(searchLower) ||
            assignment.unit.mcc.toLowerCase().includes(searchLower) ||
            assignment.bic.bic.toLowerCase().includes(searchLower)

        // Apply PMOS filter
        const pmosMatch = filters.pmos.length === 0 || filters.pmos.includes(assignment.marine.pmos)

        // Apply Pay Grade filter
        const payGradeMatch = filters.payGrade.length === 0 || filters.payGrade.includes(assignment.marine.payGrade)

        // Apply Unit filter
        const unitMatch = filters.unit.length === 0 || filters.unit.includes(assignment.unit.mcc)

        return matchesSearch && pmosMatch && payGradeMatch && unitMatch
    })

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
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    return (
        <div className="p-4">
            <div className="space-y-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <h2 className="text-2xl font-bold">Assignments</h2>
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1 md:w-[300px]">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search assignments..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                        <Button onClick={() => setIsCreatingAssignment(true)}>Create Assignment</Button>
                    </div>
                </div>

                {/* Active Filters */}
                {(filters.pmos.length > 0 || filters.payGrade.length > 0 || filters.unit.length > 0 || searchQuery) && (
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
                        {filters.unit.map((mcc) => (
                            <Badge key={mcc} variant="secondary" className="flex items-center gap-1">
                                Unit: {mcc}
                                <X
                                    className="h-3 w-3 cursor-pointer"
                                    onClick={() =>
                                        setFilters((prev) => ({
                                            ...prev,
                                            unit: prev.unit.filter((u) => u !== mcc),
                                        }))
                                    }
                                />
                            </Badge>
                        ))}
                        {searchQuery && (
                            <Badge variant="secondary" className="flex items-center gap-1">
                                Search: {searchQuery}
                                <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchQuery("")} />
                            </Badge>
                        )}
                        <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-7 px-2 text-sm">
                            Clear all
                        </Button>
                    </div>
                )}

                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Marine</TableHead>
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
                                <TableHead>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="-ml-3 h-8 data-[state=open]:bg-accent">
                                                <div className="flex items-center gap-1">
                                                    Unit
                                                    <Filter className="h-4 w-4" />
                                                    {filters.unit.length > 0 && (
                                                        <Badge variant="secondary" className="ml-1 h-6">
                                                            {filters.unit.length}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="start" className="w-[150px]">
                                            {uniqueUnits.map((mcc) => (
                                                <DropdownMenuCheckboxItem
                                                    key={mcc}
                                                    checked={filters.unit.includes(mcc)}
                                                    onCheckedChange={(checked) => {
                                                        setFilters((prev) => ({
                                                            ...prev,
                                                            unit: checked ? [...prev.unit, mcc] : prev.unit.filter((u) => u !== mcc),
                                                        }))
                                                    }}
                                                >
                                                    {mcc}
                                                </DropdownMenuCheckboxItem>
                                            ))}
                                            {filters.unit.length > 0 && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="w-full justify-start font-normal"
                                                    onClick={() => clearFilter("unit")}
                                                >
                                                    Clear filters
                                                </Button>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableHead>
                                <TableHead>Unit</TableHead>
                                <TableHead>BIC</TableHead>
                                <TableHead>Dates</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredAssignments.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                                        No assignments found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredAssignments.map((assignment) => (
                                    <TableRow key={assignment.id}>
                                        <TableCell>
                                            {assignment.marine.lastName}, {assignment.marine.firstName}
                                        </TableCell>
                                        <TableCell>{assignment.marine.payGrade}</TableCell>
                                        <TableCell>{assignment.marine.pmos}</TableCell>
                                        <TableCell>
                                            {assignment.unit.name} ({assignment.unit.mcc})
                                        </TableCell>
                                        <TableCell>{assignment.bic.bic}</TableCell>
                                        <TableCell>
                                            {new Date(assignment.dctb).toLocaleDateString()} -{" "}
                                            {new Date(assignment.djcu).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="outline" size="sm" onClick={() => setEditingAssignment(assignment)}>
                                                Edit
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Create Assignment Dialog */}
            <Dialog open={isCreatingAssignment} onOpenChange={setIsCreatingAssignment}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Create New Assignment</DialogTitle>
                        <DialogDescription>
                            Create a new assignment by selecting a marine and filling out the assignment details.
                        </DialogDescription>
                    </DialogHeader>
                    <AssignmentForm
                        marine={null}
                        onSuccess={handleAssignmentSuccess}
                        onCancel={() => setIsCreatingAssignment(false)}
                    />
                </DialogContent>
            </Dialog>

            {/* Edit Assignment Dialog */}
            {editingAssignment && (
                <Dialog open={!!editingAssignment} onOpenChange={(open) => !open && setEditingAssignment(null)}>
                    <DialogContent className="max-w-3xl">
                        <DialogHeader>
                            <DialogTitle>Edit Assignment</DialogTitle>
                            <DialogDescription>
                                Update the assignment details for {editingAssignment.marine.lastName},{" "}
                                {editingAssignment.marine.firstName}
                            </DialogDescription>
                        </DialogHeader>
                        <AssignmentForm
                            marine={editingAssignment.marine}
                            assignment={editingAssignment}
                            onSuccess={handleAssignmentSuccess}
                            onCancel={() => setEditingAssignment(null)}
                        />
                    </DialogContent>
                </Dialog>
            )}
        </div>
    )
}

