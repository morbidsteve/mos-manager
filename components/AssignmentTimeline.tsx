"use client"

import { useEffect, useState, useRef } from "react"
import { format, parseISO, addMonths, differenceInMonths } from "date-fns"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { AssignmentTimelineDetails } from "./AssignmentTimelineDetails"

interface Assignment {
    id: number
    dctb: string
    djcu: string
    ocd: string | null
    plannedEndDate: string | null
    tourLength: number
    marine: {
        id: number
        firstName: string
        lastName: string
        middleInitial: string
        payGrade: string
        pmos: string
        clearance?: string
        poly?: string
        trained?: boolean
        projectedSchoolhouse?: string
    }
    unit: {
        id: number
        name: string
        mcc: string
        notes?: string
    }
    bic: {
        id: number
        bic: string
        description: string
        payGrade: string
    }
    orders?: {
        id: number
        orderNumber: string
        type: string
        status: string
        issuedDate: string
        reportNoLaterThan: string
        detachNoEarlierThan: string | null
        detachNoLaterThan: string
        proceedDate: string
        travelDays: number
        temporaryDutyEnRoute: boolean
        tdyLocation?: string
        tdyStartDate?: string
        tdyEndDate?: string
        dependentsAuthorized: boolean
        povShipmentAuthorized: boolean
        householdGoodsAuthorized: boolean
        remarks?: string
    }
}

const MONTHS_TO_SHOW = 48 // Show 4 fiscal years
const MONTH_WIDTH = 100 // Width in pixels for each month
const PAY_GRADES = ["W5", "W4", "W3", "W2", "W1"]
const COLORS = {
    current: "bg-blue-500",
    planned: "bg-green-500",
    gap: "bg-red-200",
}

function getFiscalYear(date: Date): number {
    return date.getMonth() >= 9 ? date.getFullYear() + 1 : date.getFullYear()
}

function getMonthsArray(startDate: Date, months: number) {
    return Array.from({ length: months }, (_, i) => addMonths(startDate, i))
}

function groupAssignmentsByGrade(assignments: Assignment[]) {
    return PAY_GRADES.map((grade) => ({
        grade,
        marines: Array.from(new Set(assignments.filter((a) => a.marine.payGrade === grade).map((a) => a.marine.id))).map(
            (marineId) => ({
                marine: assignments.find((a) => a.marine.id === marineId)?.marine!,
                assignments: assignments.filter((a) => a.marine.id === marineId),
            }),
        ),
    }))
}

export function AssignmentTimeline() {
    const [assignments, setAssignments] = useState<Assignment[]>([])
    const [loading, setLoading] = useState(true)
    const [startDate, setStartDate] = useState(() => {
        const now = new Date()
        // Start from October of the previous year if we're in a new fiscal year
        return now.getMonth() >= 9 ? new Date(now.getFullYear(), 9, 1) : new Date(now.getFullYear() - 1, 9, 1)
    })
    const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
    const scrollContainerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        async function fetchAssignments() {
            try {
                const response = await fetch("/api/assignments")
                if (!response.ok) throw new Error("Failed to fetch assignments")
                const data = await response.json()
                setAssignments(data)
            } catch (error) {
                console.error("Error fetching assignments:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchAssignments()
    }, [])

    const months = getMonthsArray(startDate, MONTHS_TO_SHOW)
    const assignmentsByGrade = groupAssignmentsByGrade(assignments)

    const handleScroll = (direction: "left" | "right") => {
        if (scrollContainerRef.current) {
            const scrollAmount = direction === "left" ? -MONTH_WIDTH * 6 : MONTH_WIDTH * 6
            scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" })
        }
    }

    const handleAssignmentUpdate = (updatedAssignment: Assignment) => {
        setAssignments(assignments.map((a) => (a.id === updatedAssignment.id ? updatedAssignment : a)))
    }

    if (loading) {
        return (
            <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                    <Card key={i} className="p-4">
                        <Skeleton className="h-20 w-full" />
                    </Card>
                ))}
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center sticky top-0 bg-background z-10 py-2">
                <h2 className="text-xl font-semibold">Assignment Timeline</h2>
                <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleScroll("left")}>
                        <ChevronLeft className="h-4 w-4" />
                        <span className="ml-2">Previous 6 Months</span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleScroll("right")}>
                        <span className="mr-2">Next 6 Months</span>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="relative">
                <div
                    ref={scrollContainerRef}
                    className="overflow-x-auto"
                    style={{
                        width: "100%",
                        overflowY: "hidden",
                    }}
                >
                    <div style={{ width: `${MONTH_WIDTH * MONTHS_TO_SHOW}px` }}>
                        {/* Month headers */}
                        <div className="flex border-b sticky top-0 bg-background">
                            <div className="flex-none w-48 border-r bg-background z-10">Pay Grade</div>
                            {months.map((month, index) => {
                                const isNewFY = month.getMonth() === 9 // October
                                return (
                                    <div
                                        key={month.toISOString()}
                                        className={`flex-none text-center ${isNewFY ? "border-l-2 border-primary" : ""}`}
                                        style={{ width: MONTH_WIDTH }}
                                    >
                                        <div className="font-medium">
                                            {isNewFY && <div className="text-xs text-primary">FY{getFiscalYear(month)}</div>}
                                            {format(month, "MMM yyyy")}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Pay grade rows */}
                        {assignmentsByGrade.map(({ grade, marines }) => (
                            <div key={grade} className="flex border-b">
                                <div className="flex-none w-48 p-2 border-r font-medium sticky left-0 bg-background z-10">{grade}</div>
                                <div
                                    className="relative flex-grow"
                                    style={{ height: marines.length ? `${marines.length * 40}px` : "40px" }}
                                >
                                    {marines.map((marineData, marineIndex) => {
                                        return marineData.assignments.map((assignment) => {
                                            const start = parseISO(assignment.dctb)
                                            const end = assignment.plannedEndDate ? parseISO(assignment.plannedEndDate) : addMonths(start, 36)

                                            const startOffset = differenceInMonths(start, startDate)
                                            const duration = differenceInMonths(end, start)

                                            const isPlanned = new Date() < start

                                            return (
                                                <button
                                                    key={assignment.id}
                                                    onClick={() => setSelectedAssignment(assignment)}
                                                    className={`absolute rounded-md p-2 text-xs text-white overflow-hidden hover:ring-2 hover:ring-white hover:ring-opacity-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 transition-shadow ${
                                                        isPlanned ? COLORS.planned : COLORS.current
                                                    }`}
                                                    style={{
                                                        left: `${startOffset * MONTH_WIDTH}px`,
                                                        width: `${duration * MONTH_WIDTH}px`,
                                                        top: `${marineIndex * 40}px`,
                                                        height: "36px",
                                                    }}
                                                >
                                                    <div className="truncate">
                                                        {marineData.marine.lastName}, {marineData.marine.firstName}{" "}
                                                        {marineData.marine.middleInitial}
                                                    </div>
                                                    <div className="truncate text-[10px]">{assignment.unit.name}</div>
                                                </button>
                                            )
                                        })
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex items-center space-x-4 mt-4">
                <div className="flex items-center space-x-2">
                    <div className={`w-4 h-4 rounded ${COLORS.current}`}></div>
                    <span className="text-sm">Current Assignment</span>
                </div>
                <div className="flex items-center space-x-2">
                    <div className={`w-4 h-4 rounded ${COLORS.planned}`}></div>
                    <span className="text-sm">Planned Assignment</span>
                </div>
            </div>

            <Dialog open={!!selectedAssignment} onOpenChange={(open) => !open && setSelectedAssignment(null)}>
                <DialogContent className="max-w-3xl">
                    {selectedAssignment && (
                        <AssignmentTimelineDetails assignment={selectedAssignment} onAssignmentUpdate={handleAssignmentUpdate} />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}

