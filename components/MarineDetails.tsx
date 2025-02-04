"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"

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

export default function MarineDetails({ marineId }: { marineId: number }) {
    const [marine, setMarine] = useState<Marine | null>(null)
    const [marineHistory, setMarineHistory] = useState<MarineHistory[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function fetchData() {
            setIsLoading(true)
            try {
                const [marineResponse, historyResponse] = await Promise.all([
                    fetch(`/api/marines/${marineId}`),
                    fetch(`/api/marines/${marineId}/history`),
                ])

                if (marineResponse.ok && historyResponse.ok) {
                    const [marineData, historyData] = await Promise.all([marineResponse.json(), historyResponse.json()])
                    setMarine(marineData)
                    setMarineHistory(historyData)
                } else {
                    console.error("Failed to fetch Marine data or history")
                }
            } catch (error) {
                console.error("Error fetching data:", error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [marineId])

    if (isLoading) {
        return <LoadingSkeleton />
    }

    if (!marine) {
        return <div>Error loading marine details</div>
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

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>{`${marine.lastName}, ${marine.firstName} ${marine.middleInitial || ""}`}</CardTitle>
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

