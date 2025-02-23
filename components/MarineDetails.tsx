"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import MarineForm from "./MarineForm" // Reusing the existing Marine form
import { Pencil } from "lucide-react"

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
    const [assignmentHistory, setAssignmentHistory] = useState<AssignmentHistory[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isEditing, setIsEditing] = useState(false)
    const componentRef = useRef<HTMLDivElement>(null)
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
    const timeLeftOnOrders =
        marine?.dctb && marine?.tourLength
            ? calculateTimeLeft(
                marine.dctb,
                new Date(new Date(marine.dctb).setMonth(new Date(marine.dctb).getMonth() + marine.tourLength)).toISOString(),
            )
            : "N/A"

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

    const formatHistoryValue = (value: string): string => {
        try {
            const parsed = JSON.parse(value)
            // If it's a marine object, format it nicely
            if (parsed?.lastName && parsed?.firstName) {
                return `${parsed.lastName}, ${parsed.firstName} ${parsed.middleInitial || ""}`
            }
            // If it's a date, format it
            if (parsed && !isNaN(new Date(parsed).getTime())) {
                return new Date(parsed).toLocaleDateString()
            }
            // If it's a simple value, return as is
            if (typeof parsed !== "object") {
                return String(parsed)
            }
            // For other objects, return a formatted string
            return JSON.stringify(parsed, null, 2)
        } catch {
            // If parsing fails, return the original value
            return value || "N/A"
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
                    <MarineForm marine={marine} onSubmit={handleUpdate} onCancel={() => setIsEditing(false)} />
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <div
            className="space-y-8 bg-background text-foreground overflow-y-auto"
            ref={componentRef}
            style={{ visibility: "visible", opacity: 1 }}
        >
            <Card className="bg-white dark:bg-gray-700">
                <div className="absolute top-2 right-2 flex gap-2">
                    {allowEditing && (
                        <Button
                            onClick={handleEdit}
                            variant="outline"
                            size="sm"
                            className="rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
                        >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                        </Button>
                    )}
                    <button onClick={onClose} className="p-2 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors">
                        <X className="h-4 w-4" />
                        <span className="sr-only">Close</span>
                    </button>
                </div>
                <CardHeader>
                    <CardTitle className="text-xl font-semibold">{`${marine.lastName}, ${marine.firstName} ${marine.middleInitial || ""}`}</CardTitle>
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
                                    <TableHead>Date</TableHead>
                                    <TableHead>Field</TableHead>
                                    <TableHead>Old Value</TableHead>
                                    <TableHead>New Value</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {marineHistory.map((change, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{new Date(change.changedAt).toLocaleString()}</TableCell>
                                        <TableCell>{change.fieldName}</TableCell>
                                        <TableCell>{change.oldValue ? formatHistoryValue(change.oldValue) : "N/A"}</TableCell>
                                        <TableCell>{change.newValue ? formatHistoryValue(change.newValue) : "N/A"}</TableCell>
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
                                    <TableHead>Date</TableHead>
                                    <TableHead>Change Type</TableHead>
                                    <TableHead>BIC</TableHead>
                                    <TableHead>Unit</TableHead>
                                    <TableHead>DCTB</TableHead>
                                    <TableHead>DJCU</TableHead>
                                    <TableHead>OCD</TableHead>
                                    <TableHead>Planned End Date</TableHead>
                                    <TableHead>Tour Length</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {assignmentHistory.map((change) => {
                                    const newValue = parseAssignmentDetails(change.newValue)
                                    const oldValue = change.changeType === "UPDATE" ? parseAssignmentDetails(change.oldValue) : null

                                    return (
                                        <TableRow key={change.id}>
                                            <TableCell>{new Date(change.changedAt).toLocaleString()}</TableCell>
                                            <TableCell>{change.changeType}</TableCell>
                                            <TableCell>
                                                {change.changeType === "UPDATE" ? (
                                                    <>
                                                        <span className="line-through text-red-500">{oldValue?.bic}</span>
                                                        <br />
                                                        <span className="text-green-500">{newValue.bic}</span>
                                                    </>
                                                ) : (
                                                    newValue.bic
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {change.changeType === "UPDATE" ? (
                                                    <>
                                                        <span className="line-through text-red-500">{oldValue?.unitName}</span>
                                                        <br />
                                                        <span className="text-green-500">{newValue.unitName}</span>
                                                    </>
                                                ) : (
                                                    newValue.unitName
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {change.changeType === "UPDATE" ? (
                                                    <>
                                                        <span className="line-through text-red-500">{oldValue?.dctb}</span>
                                                        <br />
                                                        <span className="text-green-500">{newValue.dctb}</span>
                                                    </>
                                                ) : (
                                                    newValue.dctb
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {change.changeType === "UPDATE" ? (
                                                    <>
                                                        <span className="line-through text-red-500">{oldValue?.djcu}</span>
                                                        <br />
                                                        <span className="text-green-500">{newValue.djcu}</span>
                                                    </>
                                                ) : (
                                                    newValue.djcu
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {change.changeType === "UPDATE" ? (
                                                    <>
                                                        <span className="line-through text-red-500">{oldValue?.ocd}</span>
                                                        <br />
                                                        <span className="text-green-500">{newValue.ocd}</span>
                                                    </>
                                                ) : (
                                                    newValue.ocd
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {change.changeType === "UPDATE" ? (
                                                    <>
                                                        <span className="line-through text-red-500">{oldValue?.plannedEndDate}</span>
                                                        <br />
                                                        <span className="text-green-500">{newValue.plannedEndDate}</span>
                                                    </>
                                                ) : (
                                                    newValue.plannedEndDate
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {change.changeType === "UPDATE" ? (
                                                    <>
                                                        <span className="line-through text-red-500">{oldValue?.tourLength}</span>
                                                        <br />
                                                        <span className="text-green-500">{newValue.tourLength}</span>
                                                    </>
                                                ) : (
                                                    newValue.tourLength
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
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
                    <div className="flex-1 overflow-y-auto pr-2">
                        {selectedAssignment && <div>AssignmentTimelineDetails Component Here</div>}
                    </div>
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

