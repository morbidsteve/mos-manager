"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { X } from "lucide-react"

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

export default function MarineDetails({
                                          marineId,
                                          setIsViewingDetails,
                                      }: { marineId: number; setIsViewingDetails: (value: boolean) => void }) {
    const [marine, setMarine] = useState<Marine | null>(null)
    const [marineHistory, setMarineHistory] = useState<MarineHistory[]>([])
    const [assignmentHistory, setAssignmentHistory] = useState<AssignmentHistory[]>([])
    const [isLoading, setIsLoading] = useState(true)

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
        console.log("MarineDetails mounted with marineId:", marineId)
        return () => {
            console.log("MarineDetails unmounted")
        }
    }, [marineId])

    if (isLoading) {
        return <div className="text-center py-4">Loading marine details...</div>
    }

    if (!marine) {
        return <div className="text-center py-4 text-red-500">Error loading marine details</div>
    }

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

    const timeLeftOnOrders =
        marine.dctb && marine.tourLength
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
        const parsed = JSON.parse(value)
        return {
            bic: parsed.bic.bic,
            unitName: parsed.unit.name,
            dctb: new Date(parsed.dctb).toLocaleDateString(),
            djcu: new Date(parsed.djcu).toLocaleDateString(),
            ocd: parsed.ocd ? new Date(parsed.ocd).toLocaleDateString() : "N/A",
            plannedEndDate: new Date(parsed.plannedEndDate).toLocaleDateString(),
            tourLength: parsed.tourLength,
        }
    }

    return (
        <div className="space-y-8 text-gray-800 dark:text-gray-200">
            <Card className="bg-white dark:bg-gray-700">
                <button
                    onClick={() => setIsViewingDetails(false)}
                    className="absolute top-2 right-2 p-2 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
                >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                </button>
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
                                        <TableCell>{change.oldValue}</TableCell>
                                        <TableCell>{change.newValue}</TableCell>
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

