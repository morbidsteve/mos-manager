"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatProjectionDate, type ProjectedHealth } from "@/lib/calculations"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

export function MOSHealthProjections() {
    const [projections, setProjections] = useState<ProjectedHealth[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchProjections() {
            try {
                const response = await fetch("/api/statistics/projections")
                if (!response.ok) throw new Error("Failed to fetch projections")
                const data = await response.json()
                setProjections(data)
            } catch (error) {
                setError(error instanceof Error ? error.message : "Failed to fetch projections")
            } finally {
                setLoading(false)
            }
        }

        fetchProjections()
    }, [])

    if (loading) return <div>Loading projections...</div>
    if (error) return <div className="text-red-500">Error: {error}</div>

    // Transform data for the chart
    const chartData = projections.map((projection) => ({
        date: formatProjectionDate(new Date(projection.date)),
        total: projection.total.percentFill,
        W5: projection.byPayGrade.W5.percentFill,
        W4: projection.byPayGrade.W4.percentFill,
        W3: projection.byPayGrade.W3.percentFill,
        W2: projection.byPayGrade.W2.percentFill,
        W1: projection.byPayGrade.W1.percentFill,
    }))

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Projected MOS Health</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis domain={[0, 100]} unit="%" />
                            <Tooltip
                                formatter={(value: number) => [`${value.toFixed(1)}%`, ""]}
                                labelFormatter={(label) => `Projection: ${label}`}
                            />
                            <Legend />
                            <Line type="monotone" dataKey="total" name="Total" stroke="#000" strokeWidth={2} dot={{ r: 4 }} />
                            <Line type="monotone" dataKey="W5" name="W5" stroke="#8884d8" />
                            <Line type="monotone" dataKey="W4" name="W4" stroke="#82ca9d" />
                            <Line type="monotone" dataKey="W3" name="W3" stroke="#ffc658" />
                            <Line type="monotone" dataKey="W2" name="W2" stroke="#ff7300" />
                            <Line type="monotone" dataKey="W1" name="W1" stroke="#ff0000" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Detailed breakdown table */}
                <div className="mt-6 overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                        <tr className="border-b">
                            <th className="px-4 py-2 text-left">Date</th>
                            <th className="px-4 py-2 text-right">Total</th>
                            <th className="px-4 py-2 text-right">W5</th>
                            <th className="px-4 py-2 text-right">W4</th>
                            <th className="px-4 py-2 text-right">W3</th>
                            <th className="px-4 py-2 text-right">W2</th>
                            <th className="px-4 py-2 text-right">W1</th>
                        </tr>
                        </thead>
                        <tbody>
                        {projections.map((projection, index) => (
                            <tr key={index} className="border-b">
                                <td className="px-4 py-2">{formatProjectionDate(new Date(projection.date))}</td>
                                <td className="px-4 py-2 text-right">
                                    {projection.total.percentFill.toFixed(1)}%
                                    <br />
                                    <span className="text-sm text-muted-foreground">
                      ({projection.total.onHand}/{projection.total.authorized})
                    </span>
                                </td>
                                {["W5", "W4", "W3", "W2", "W1"].map((grade) => (
                                    <td key={grade} className="px-4 py-2 text-right">
                                        {projection.byPayGrade[grade].percentFill.toFixed(1)}%
                                        <br />
                                        <span className="text-sm text-muted-foreground">
                        ({projection.byPayGrade[grade].onHand}/{projection.byPayGrade[grade].authorized})
                      </span>
                                    </td>
                                ))}
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    )
}

