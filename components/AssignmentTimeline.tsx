"use client"

import React, { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { ChevronDown, ChevronUp, Info } from "lucide-react"

interface BIC {
    id: number
    bic: string
    description: string
    payGrade: string
    unit: {
        name: string
    }
}

interface Assignment {
    id: number
    marine: {
        lastName: string
        firstName: string
    }
    bic: {
        id: number
        bic: string
    }
    dctb: string
    plannedEndDate: string
}

const payGradeColors: { [key: string]: string } = {
    W5: "bg-purple-100 text-purple-800",
    W4: "bg-indigo-100 text-indigo-800",
    W3: "bg-blue-100 text-blue-800",
    W2: "bg-green-100 text-green-800",
    W1: "bg-yellow-100 text-yellow-800",
}

// Function to determine the color based on assignment date
function getAssignmentColor(dctb: string): string {
    const assignmentDate = new Date(dctb)
    const now = new Date()
    const monthsDiff =
        (now.getFullYear() - assignmentDate.getFullYear()) * 12 + now.getMonth() - assignmentDate.getMonth()

    if (monthsDiff <= 6) return "bg-green-100" // Recent assignments
    if (monthsDiff <= 12) return "bg-blue-100" // Assignments within the last year
    if (monthsDiff <= 24) return "bg-yellow-100" // Assignments within 2 years
    return "bg-gray-100" // Older assignments
}

export default function AssignmentTimeline() {
    const [bics, setBICs] = useState<BIC[]>([])
    const [assignments, setAssignments] = useState<Assignment[]>([])
    const [fiscalYears, setFiscalYears] = useState<{ year: string; periods: string[] }[]>([])
    const [expandedRows, setExpandedRows] = useState<{ [key: string]: boolean }>({})

    useEffect(() => {
        fetchBICs()
        fetchAssignments()
        generateFiscalYears()
    }, [])

    async function fetchBICs() {
        try {
            const response = await fetch("/api/bics")
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
            const data = await response.json()
            const sortedBICs = data.sort((a: BIC, b: BIC) => {
                const gradeOrder = ["W5", "W4", "W3", "W2", "W1"]
                return gradeOrder.indexOf(a.payGrade) - gradeOrder.indexOf(b.payGrade)
            })
            setBICs(sortedBICs)
        } catch (error) {
            console.error("Error fetching BICs:", error)
        }
    }

    async function fetchAssignments() {
        try {
            const response = await fetch("/api/assignments")
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
            const data = await response.json()
            setAssignments(data)
        } catch (error) {
            console.error("Error fetching assignments:", error)
        }
    }

    function generateFiscalYears() {
        const currentYear = new Date().getFullYear()
        const years = Array.from({ length: 5 }, (_, i) => {
            const fy = `FY${currentYear + i}`
            return {
                year: fy,
                periods: [`${fy} Summer (Apr-Sep)`, `${fy} Winter (Oct-Mar)`],
            }
        })
        setFiscalYears(years)
    }

    function getAssignmentForBICInPeriod(bic: BIC, year: string, period: string) {
        const yearNum = Number.parseInt(year.slice(2))
        let startDate, endDate

        if (period.includes("Summer")) {
            startDate = new Date(`${yearNum}-04-01`)
            endDate = new Date(`${yearNum}-09-30`)
        } else {
            startDate = new Date(`${yearNum}-10-01`)
            endDate = new Date(`${yearNum + 1}-03-31`)
        }

        return assignments.find((assignment) => {
            const assignStart = new Date(assignment.dctb)
            const assignEnd = new Date(assignment.plannedEndDate)
            return (
                assignment.bic.id === bic.id &&
                ((assignStart <= endDate && assignStart >= startDate) ||
                    (assignEnd <= endDate && assignEnd >= startDate) ||
                    (assignStart <= startDate && assignEnd >= endDate))
            )
        })
    }

    function toggleRowExpansion(payGrade: string) {
        setExpandedRows((prev) => ({ ...prev, [payGrade]: !prev[payGrade] }))
    }

    return (
        <Card className="mt-6">
            <CardHeader>
                <CardTitle className="text-2xl font-bold">Assignment Timeline</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="relative">
                    <ScrollArea className="h-[calc(100vh-200px)]">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="sticky left-0 bg-white z-20 min-w-[100px]">Pay Grade</TableHead>
                                    <TableHead className="sticky left-[100px] bg-white z-20 min-w-[150px]">BIC</TableHead>
                                    <TableHead className="sticky left-[250px] bg-white z-20 min-w-[200px]">Unit</TableHead>
                                    {fiscalYears.map((fy) => (
                                        <TableHead key={fy.year} className="min-w-[400px] text-center border-l border-gray-200" colSpan={2}>
                                            {fy.year}
                                        </TableHead>
                                    ))}
                                </TableRow>
                                <TableRow>
                                    <TableHead className="sticky left-0 bg-white z-20"></TableHead>
                                    <TableHead className="sticky left-[100px] bg-white z-20"></TableHead>
                                    <TableHead className="sticky left-[250px] bg-white z-20"></TableHead>
                                    {fiscalYears
                                        .flatMap((fy) => fy.periods)
                                        .map((period, index) => (
                                            <TableHead
                                                key={period}
                                                className={`min-w-[200px] text-sm ${
                                                    period.includes("Summer") ? "bg-orange-50 border-l border-gray-200" : "bg-blue-50"
                                                }`}
                                            >
                                                {period.split(" ")[1].replace("(", "").replace(")", "")}
                                            </TableHead>
                                        ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {["W5", "W4", "W3", "W2", "W1"].map((payGrade) => (
                                    <React.Fragment key={payGrade}>
                                        <TableRow className="group">
                                            <TableCell
                                                className="sticky left-0 bg-white z-20 cursor-pointer"
                                                onClick={() => toggleRowExpansion(payGrade)}
                                            >
                                                <div className="flex items-center">
                                                    {expandedRows[payGrade] ? <ChevronUp className="mr-2" /> : <ChevronDown className="mr-2" />}
                                                    <Badge className={payGradeColors[payGrade]}>{payGrade}</Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell className="sticky left-[100px] bg-white z-20"></TableCell>
                                            <TableCell className="sticky left-[250px] bg-white z-20"></TableCell>
                                            {fiscalYears
                                                .flatMap((fy) => fy.periods)
                                                .map((period, index) => (
                                                    <TableCell key={`${payGrade}-${period}-${index}`}></TableCell>
                                                ))}
                                        </TableRow>
                                        {expandedRows[payGrade] &&
                                            bics
                                                .filter((bic) => bic.payGrade === payGrade)
                                                .map((bic) => (
                                                    <TableRow key={bic.id} className="group hover:bg-gray-50">
                                                        <TableCell className="sticky left-0 bg-white z-20 group-hover:bg-gray-50"></TableCell>
                                                        <TableCell className="sticky left-[100px] bg-white z-20 group-hover:bg-gray-50">
                                                            <TooltipProvider>
                                                                <Tooltip>
                                                                    <TooltipTrigger>
                                                                        <div className="flex items-center">
                                                                            {bic.bic}
                                                                            <Info className="ml-1 h-4 w-4 text-gray-400" />
                                                                        </div>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-black dark:text-white p-2 rounded shadow-lg">
                                                                        <p>{bic.description}</p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        </TableCell>
                                                        <TableCell className="sticky left-[250px] bg-white z-20 group-hover:bg-gray-50">
                                                            {bic.unit.name}
                                                        </TableCell>
                                                        {fiscalYears
                                                            .flatMap((fy) => fy.periods)
                                                            .map((period) => {
                                                                const assignment = getAssignmentForBICInPeriod(bic, period.split(" ")[0], period)
                                                                return (
                                                                    <TableCell
                                                                        key={`${bic.id}-${period}`}
                                                                        className={`relative ${
                                                                            period.includes("Summer") ? "bg-orange-50/30" : "bg-blue-50/30"
                                                                        }`}
                                                                    >
                                                                        {assignment && (
                                                                            <div
                                                                                className={`absolute inset-0 ${getAssignmentColor(assignment.dctb)} opacity-50`}
                                                                            ></div>
                                                                        )}
                                                                        <span className="relative z-10">
                                      {assignment && (
                                          <TooltipProvider>
                                              <Tooltip>
                                                  <TooltipTrigger>
                                              <span className="font-medium">
                                                {`${assignment.marine.lastName}, ${assignment.marine.firstName}`}
                                              </span>
                                                  </TooltipTrigger>
                                                  <TooltipContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-black dark:text-white p-2 rounded shadow-lg">
                                                      <p>Assigned: {new Date(assignment.dctb).toLocaleDateString()}</p>
                                                      <p>
                                                          Planned End: {new Date(assignment.plannedEndDate).toLocaleDateString()}
                                                      </p>
                                                  </TooltipContent>
                                              </Tooltip>
                                          </TooltipProvider>
                                      )}
                                    </span>
                                                                    </TableCell>
                                                                )
                                                            })}
                                                    </TableRow>
                                                ))}
                                    </React.Fragment>
                                ))}
                            </TableBody>
                        </Table>
                        <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                </div>
            </CardContent>
        </Card>
    )
}

