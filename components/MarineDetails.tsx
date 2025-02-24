"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import MarineForm from "./MarineForm" // Reusing the existing Marine form
import { Pencil } from "lucide-react"
import {
    calculateTimeLeftOnOrders,
    calculateSEDD,
    calculate20YearMark,
    calculate30YearMark,
    calculateTimeLeftTo20,
    calculateTimeLeftToHigh3,
    calculateHigh3,
    formatDate,
} from "@/lib/calculations"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format } from "date-fns"

interface Marine {
    id: number
    edipi: string
    lastName: string
    firstName: string
    middleInitial?: string
    payGrade: string
    pmos: string
    dateOfBirth?: string
    dor: string
    afadbd: string
    trained?: boolean
    cmf?: string
    projectedSchoolhouse?: string
    dctb?: string
    djcu?: string
    ocd?: string
    sedd?: string
    clearance?: string
    poly?: string
    tourLength?: number
    linealNumber?: number
    ldoFy?: number
}

interface MarineHistory {
    changedAt: string
    fieldName: string
    oldValue: any
    newValue: any
}

interface Assignment {
    id: number
    bic: { bic: string }
    unit: { name: string }
    dctb: string
    djcu: string
    ocd: string | null
    plannedEndDate: string
    tourLength: number
}

interface AssignmentHistoryResponse {
    past: Assignment[]
    current: Assignment[]
    future: Assignment[]
}

interface AssignmentHistory {
    id: number
    assignmentId: number
    changeType: string
    changedAt: string
    oldValue: string
    newValue: string
}

interface AssignmentDetails {
    bic: string
    unitName: string
    dctb: string
    djcu: string
    ocd: string | null
    plannedEndDate: string
    tourLength: number
}

interface MarineDetailsProps {
    marineId: number
    onClose: () => void
    onUpdate?: (updatedMarine: any) => void
    allowEditing?: boolean
}

export default function MarineDetails({ marineId, onClose, onUpdate, allowEditing = false }: MarineDetailsProps) {
    const [marine, setMarine] = useState<Marine | null>(null)
    const [marineHistory, setMarineHistory] = useState<MarineHistory[]>([])
    const [assignmentHistory, setAssignmentHistory] = useState<AssignmentHistoryResponse>({
        past: [],
        current: [],
        future: [],
    })
    const [isLoading, setIsLoading] = useState(true)
    const [isEditing, setIsEditing] = useState(false)
    const [componentRef] = useState<HTMLDivElement | null>(null)
    const [selectedAssignment, setSelectedAssignment] = useState<AssignmentHistory | null>(null)

    useEffect(() => {
        async function fetchData() {
            setIsLoading(true)
            try {
                const [marineResponse, historyResponse, assignmentHistoryResponse] = await Promise.all([
                    fetch(`/api/marines/${marineId}`),
                    fetch(`/api/marines/${marineId}/history`),
                    fetch(`/api/marines/${marineId}/assignments/history`),
                ])

                if (marineResponse.ok && historyResponse.ok && assignmentHistoryResponse.ok) {
                    const [marineData, historyData, assignmentHistoryData] = await Promise.all([
                        marineResponse.json(),
                        historyResponse.json(),
                        assignmentHistoryResponse.json(),
                    ])

                    setMarine(marineData)
                    setMarineHistory(historyData)
                    // The data is already categorized, so we can use it directly
                    setAssignmentHistory(assignmentHistoryData)
                } else {
                    console.error("Failed to fetch Marine data, history, or assignment history")
                }
            } catch (error) {
                console.error("Error fetching data:", error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [marineId])

    useEffect(() => {
        return () => {}
    }, [])

    // Move these calculations inside the render after null checks
    const calculateTimeLeft = (startDate: string, endDate: string) => {
        const start = new Date(startDate)
        const end = new Date(endDate)
        const diffTime = Math.abs(end.getTime() - start.getTime())
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30))
    }

    const calculateFiscalYear = (date: string) => {
        const d = new Date(date)
        return d.getMonth() >= 9 ? d.getFullYear() + 1 : d.getFullYear()
    }

    // Remove calculations from component level and move them inside the render

    if (isLoading) {
        return <div className="text-center py-4">Loading marine details...</div>
    }

    if (!marine) {
        return <div className="text-center py-4 text-red-500">Error loading marine details</div>
    }

    // Calculate values only after we confirm marine exists
    const timeLeftOnOrders = calculateTimeLeftOnOrders(
        new Date(marine.dctb),
        marine.tourLength / 12, // Convert months to years
    )

    const sedd = calculateSEDD(new Date(marine.dctb), marine.tourLength / 12)
    const mark20 = calculate20YearMark(new Date(marine.afadbd))
    const mark30 = calculate30YearMark(new Date(marine.afadbd))
    const timeLeftTo20 = calculateTimeLeftTo20(new Date(marine.afadbd))
    const high3 = calculateHigh3(new Date(marine.afadbd), 20) // Assuming 20 years for high-3
    const timeLeftToHigh3 = calculateTimeLeftToHigh3(new Date(marine.afadbd))

    const twentyYearMark = new Date(marine.afadbd)
    twentyYearMark.setFullYear(twentyYearMark.getFullYear() + 20)

    const thirtyYearMark = new Date(marine.afadbd)
    thirtyYearMark.setFullYear(thirtyYearMark.getFullYear() + 30)

    const timeLeftTill20 = !isNaN(twentyYearMark.getTime())
        ? calculateTimeLeft(new Date().toISOString(), twentyYearMark.toISOString())
        : "N/A"
    const timeLeftTill30 = !isNaN(thirtyYearMark.getTime())
        ? calculateTimeLeft(new Date().toISOString(), thirtyYearMark.toISOString())
        : "N/A"

    const earliestPromotionFY = calculateFiscalYear(
        new Date(new Date(marine.dor).setFullYear(new Date(marine.dor).getFullYear() + 3)).toISOString(),
    )
    const nextPromotionFY = earliestPromotionFY + 3

    const parseAssignmentDetails = (value: string): AssignmentDetails => {
        try {
            const parsed = JSON.parse(value)
            return {
                bic: parsed?.bic?.bic ?? "N/A",
                unitName: parsed?.unit?.name ?? "N/A",
                dctb: parsed?.dctb ? new Date(parsed.dctb).toLocaleDateString() : "N/A",
                djcu: parsed?.djcu ? new Date(parsed.djcu).toLocaleDateString() : "N/A",
                ocd: parsed?.ocd ? new Date(parsed.ocd).toLocaleDateString() : "N/A",
                plannedEndDate: parsed?.plannedEndDate ? new Date(parsed.plannedEndDate).toLocaleDateString() : "N/A",
                tourLength: parsed?.tourLength ?? 0,
            }
        } catch (error) {
            console.error("Error parsing assignment details:", error)
            return {
                bic: "N/A",
                unitName: "N/A",
                dctb: "N/A",
                djcu: "N/A",
                ocd: "N/A",
                plannedEndDate: "N/A",
                tourLength: 0,
            }
        }
    }

    const formatHistoryValue = (value: string, fieldName: string): JSX.Element => {
        try {
            const parsed = JSON.parse(value)

            // For CREATE action, show all relevant fields in a structured way
            if (fieldName === "CREATE") {
                return (
                    <div className="space-y-2">
                        {Object.entries(parsed)
                            .filter(([key, value]) => value !== null && value !== undefined && key !== "id")
                            .map(([key, value]) => (
                                <div key={key} className="grid grid-cols-2 gap-2 text-sm">
                                    <span className="font-medium">{key}:</span>
                                    <span>
                    {(() => {
                        // Handle different value types
                        if (typeof value === "string") {
                            // Try to parse as date first
                            const date = new Date(value)
                            if (!isNaN(date.getTime()) && value.includes("-")) {
                                return format(date, "dd MMM yyyy")
                            }
                            return value
                        }
                        if (typeof value === "boolean") {
                            return value ? "Yes" : "No"
                        }
                        if (typeof value === "number") {
                            return value.toString()
                        }
                        return JSON.stringify(value)
                    })()}
                  </span>
                                </div>
                            ))}
                    </div>
                )
            }

            // For regular field updates
            if (typeof parsed === "string") {
                // Check if it's a date
                const date = new Date(parsed)
                if (!isNaN(date.getTime()) && parsed.includes("-")) {
                    return <span>{format(date, "dd MMM yyyy")}</span>
                }
                return <span>{parsed}</span>
            }

            // For boolean values
            if (typeof parsed === "boolean") {
                return <span>{parsed ? "Yes" : "No"}</span>
            }

            // For number values
            if (typeof parsed === "number") {
                return <span>{parsed}</span>
            }

            // For objects (like Marine updates)
            if (typeof parsed === "object" && parsed !== null) {
                if (parsed.lastName && parsed.firstName) {
                    return (
                        <span>
              {`${parsed.lastName}, ${parsed.firstName} ${parsed.middleInitial || ""} (${parsed.payGrade || ""})`}
            </span>
                    )
                }

                // For other objects, show key-value pairs
                return (
                    <div className="space-y-1">
                        {Object.entries(parsed)
                            .filter(([_, v]) => v !== null && v !== undefined)
                            .map(([k, v]) => (
                                <div key={k} className="grid grid-cols-2 gap-2 text-sm">
                                    <span className="font-medium">{k}:</span>
                                    <span>
                    {typeof v === "string" && !isNaN(Date.parse(v)) ? format(new Date(v), "dd MMM yyyy") : String(v)}
                  </span>
                                </div>
                            ))}
                    </div>
                )
            }

            return <span>{String(parsed)}</span>
        } catch {
            // If parsing fails, return the original value
            return <span>{value || "N/A"}</span>
        }
    }

    const handleEdit = () => {
        setIsEditing(true)
    }

    const handleUpdate = async (updatedMarineData: any) => {
        try {
            const response = await fetch(`/api/marines/${marineId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(updatedMarineData),
            })

            if (!response.ok) throw new Error("Failed to update marine")

            const updatedMarine = await response.json()
            setMarine(updatedMarine)
            setIsEditing(false)
            onUpdate?.(updatedMarine)
        } catch (error) {
            console.error("Error updating marine:", error)
        }
    }

    const handleAssignmentUpdate = () => {
        // Placeholder for assignment update logic
        console.log("Assignment updated")
    }

    if (isEditing) {
        return (
            <Dialog open={isEditing} onOpenChange={(open) => !open && setIsEditing(false)}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Edit Marine</DialogTitle>
                    </DialogHeader>
                    <MarineForm
                        marine={marine} // Pass the current marine data
                        onSubmit={handleUpdate}
                        onCancel={() => setIsEditing(false)}
                    />
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <div className="space-y-8 bg-background text-foreground" style={{ visibility: "visible", opacity: 1 }}>
            <Card>
                <CardHeader className="relative">
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-xl font-semibold">
                            {`${marine.lastName}, ${marine.firstName} ${marine.middleInitial || ""}`}
                        </CardTitle>
                        {allowEditing && (
                            <Button onClick={handleEdit} variant="outline" size="sm" className="flex items-center gap-2">
                                <Pencil className="h-4 w-4" />
                                Edit Details
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <InfoItem label="EDIPI" value={marine.edipi} />
                        <InfoItem label="Pay Grade" value={marine.payGrade} />
                        <InfoItem label="PMOS" value={marine.pmos} />
                        <InfoItem label="Date of Rank" value={new Date(marine.dor).toLocaleDateString()} />
                        <InfoItem label="AFADBD" value={new Date(marine.afadbd).toLocaleDateString()} />
                        <InfoItem label="DCTB" value={marine.dctb ? new Date(marine.dctb).toLocaleDateString() : "N/A"} />
                        <InfoItem label="DJCU" value={marine.djcu ? new Date(marine.djcu).toLocaleDateString() : "N/A"} />
                        <InfoItem label="OCD" value={marine.ocd ? new Date(marine.ocd).toLocaleDateString() : "N/A"} />
                        <InfoItem label="SEDD" value={marine.sedd ? new Date(marine.sedd).toLocaleDateString() : "N/A"} />
                        <InfoItem label="Time Left on Orders" value={`${timeLeftOnOrders} years`} />
                        <InfoItem label="SEDD" value={formatDate(sedd)} />
                        <InfoItem label="20 Year Mark" value={formatDate(mark20)} />
                        <InfoItem label="30 Year Mark" value={formatDate(mark30)} />
                        <InfoItem label="Time Left to 20" value={`${timeLeftTo20} years`} />
                        <InfoItem label="Time Left to High-3" value={`${timeLeftToHigh3} years`} />
                        <InfoItem label="High-3" value={`${high3} years`} />
                        <InfoItem label="Time left on orders" value={`${timeLeftOnOrders} months`} />
                        <InfoItem label="20 year mark" value={twentyYearMark.toLocaleDateString()} />
                        <InfoItem label="30 year mark" value={thirtyYearMark.toLocaleDateString()} />
                        <InfoItem
                            label="Time left till 20"
                            value={typeof timeLeftTill20 === "number" ? `${timeLeftTill20} months` : timeLeftTill20}
                        />
                        <InfoItem
                            label="Time left till 30"
                            value={typeof timeLeftTill30 === "number" ? `${timeLeftTill30} months` : timeLeftTill30}
                        />
                        <InfoItem label="Earliest promotion FY" value={earliestPromotionFY.toString()} />
                        <InfoItem label="Next promotion FY" value={nextPromotionFY.toString()} />
                        <InfoItem label="Lineal number" value={marine.linealNumber?.toString() || "N/A"} />
                        <InfoItem label="LDO FY" value={marine.ldoFy?.toString() || "N/A"} />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Change History</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Timestamp</TableHead>
                                    <TableHead>Field</TableHead>
                                    <TableHead>Old Value</TableHead>
                                    <TableHead>New Value</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {marineHistory.map((change, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{format(new Date(change.changedAt), "dd MMM yyyy HH:mm")}</TableCell>
                                        <TableCell>{change.fieldName}</TableCell>
                                        <TableCell>
                                            {change.oldValue ? (
                                                formatHistoryValue(change.oldValue, change.fieldName)
                                            ) : (
                                                <span className="text-muted-foreground">N/A</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="whitespace-pre-wrap">
                                            {formatHistoryValue(change.newValue, change.fieldName)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Assignment History</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>BIC</TableHead>
                                    <TableHead>Unit</TableHead>
                                    <TableHead>Tour Length</TableHead>
                                    <TableHead>Join Date</TableHead>
                                    <TableHead>Depart Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {[
                                    ...assignmentHistory.current.map((assignment) => ({ ...assignment, status: "Current" })),
                                    ...assignmentHistory.future.map((assignment) => ({ ...assignment, status: "Future" })),
                                    ...assignmentHistory.past.map((assignment) => ({ ...assignment, status: "Past" })),
                                ].map((assignment) => (
                                    <TableRow key={assignment.id}>
                                        <TableCell>{assignment.status}</TableCell>
                                        <TableCell>{format(new Date(assignment.dctb), "dd MMM yyyy")}</TableCell>
                                        <TableCell>{assignment.bic.bic}</TableCell>
                                        <TableCell>{assignment.unit.name}</TableCell>
                                        <TableCell>{assignment.tourLength} months</TableCell>
                                        <TableCell>{format(new Date(assignment.djcu), "dd MMM yyyy")}</TableCell>
                                        <TableCell>
                                            {assignment.plannedEndDate ? format(new Date(assignment.plannedEndDate), "dd MMM yyyy") : "N/A"}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
            <Dialog open={!!selectedAssignment} onOpenChange={(open) => !open && setSelectedAssignment(null)}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogHeader className="flex-none">
                        <DialogTitle>Marine Details</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="flex-1">
                        <div className="p-6">{selectedAssignment && <div>AssignmentTimelineDetails Component Here</div>}</div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function InfoItem({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <h3 className="font-semibold text-sm">{label}</h3>
            <p className="text-sm text-muted-foreground">{value}</p>
        </div>
    )
}

function LoadingSkeleton() {
    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-[200px]" />
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {Array(18)
                            .fill(0)
                            .map((_, i) => (
                                <div key={i}>
                                    <Skeleton className="h-4 w-20 mb-2" />
                                    <Skeleton className="h-4 w-24" />
                                </div>
                            ))}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-[150px]" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {Array(3)
                            .fill(0)
                            .map((_, i) => (
                                <Skeleton key={i} className="h-12 w-full" />
                            ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

