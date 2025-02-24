"use client"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Filter, Search, X, Plus } from "lucide-react"
import AssignmentForm from "@/components/AssignmentForm"
import { format, isFuture, isPast, isWithinInterval } from "date-fns"

interface Assignment {
    id: number
    marine: {
        id: number
        lastName: string
        firstName: string
        middleInitial?: string
        payGrade: string
        pmos: string
    }
    unit: {
        id: number
        name: string
        mcc: string
    }
    bic: {
        id: number
        bic: string
        description: string
        payGrade: string
    }
    dctb: string
    djcu: string
    ocd?: string | null
    plannedEndDate: string
    tourLength: number
}

interface FilterState {
    pmos: string[]
    payGrade: string[]
    unit: string[]
}

export default function AssignmentList() {
    const [assignments, setAssignments] = useState<Assignment[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [filters, setFilters] = useState<FilterState>({
        pmos: [],
        payGrade: [],
        unit: [],
    })
    const [isCreatingAssignment, setIsCreatingAssignment] = useState(false)
    const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null)
    const [activeTab, setActiveTab] = useState("current")

    useEffect(() => {
        fetchAssignments()
    }, [])

    const fetchAssignments = async () => {
        try {
            setLoading(true)
            const response = await fetch("/api/assignments")
            if (!response.ok) throw new Error("Failed to fetch assignments")
            const data = await response.json()
            setAssignments(data)
        } catch (error) {
            console.error("Error fetching assignments:", error)
            setError(error instanceof Error ? error.message : "Failed to fetch assignments")
        } finally {
            setLoading(false)
        }
    }

    // Filter assignments based on temporal status
    const categorizeAssignments = (assignments: Assignment[]) => {
        const now = new Date()
        return {
            past: assignments.filter((a) => isPast(new Date(a.plannedEndDate))),
            current: assignments.filter((a) =>
                isWithinInterval(now, {
                    start: new Date(a.dctb),
                    end: new Date(a.plannedEndDate),
                }),
            ),
            future: assignments.filter((a) => isFuture(new Date(a.dctb))),
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
    const filterAssignments = (assignments: Assignment[]) => {
        return assignments.filter((assignment) => {
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
    }

    const categorizedAssignments = categorizeAssignments(assignments)
    const filteredAssignments = {
        past: filterAssignments(categorizedAssignments.past),
        current: filterAssignments(categorizedAssignments.current),
        future: filterAssignments(categorizedAssignments.future),
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    if (error) {
        return <div className="text-red-500">{error}</div>
    }

    const renderAssignmentTable = (assignments: Assignment[]) => (
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
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TableHead>
                    <TableHead>BIC</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {assignments.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                            No assignments found
                        </TableCell>
                    </TableRow>
                ) : (
                    assignments.map((assignment) => (
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
                                <div className="space-y-1">
                                    <div className="text-sm">DCTB: {format(new Date(assignment.dctb), "dd MMM yyyy")}</div>
                                    <div className="text-sm">End: {format(new Date(assignment.plannedEndDate), "dd MMM yyyy")}</div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <Button variant="outline" size="sm" onClick={() => setEditingAssignment(assignment)}>
                                    Edit
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
    )

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Assignments</h2>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search assignments..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                    <Button onClick={() => setIsCreatingAssignment(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Assignment
                    </Button>
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

            <Tabs defaultValue="current" value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="current">
                        Current Assignments
                        <Badge variant="secondary" className="ml-2">
                            {filteredAssignments.current.length}
                        </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="future">
                        Future Assignments
                        <Badge variant="secondary" className="ml-2">
                            {filteredAssignments.future.length}
                        </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="past">
                        Past Assignments
                        <Badge variant="secondary" className="ml-2">
                            {filteredAssignments.past.length}
                        </Badge>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="current" className="border rounded-lg">
                    {renderAssignmentTable(filteredAssignments.current)}
                </TabsContent>

                <TabsContent value="future" className="border rounded-lg">
                    {renderAssignmentTable(filteredAssignments.future)}
                </TabsContent>

                <TabsContent value="past" className="border rounded-lg">
                    {renderAssignmentTable(filteredAssignments.past)}
                </TabsContent>
            </Tabs>

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

