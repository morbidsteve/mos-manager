"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MOSHealthDisplay } from "@/components/MOSHealthDisplay"
import { MOSHealthProjections } from "@/components/MOSHealthProjections"
import { Skeleton } from "@/components/ui/skeleton"

interface Marine {
    id: number
    payGrade: string
    pmos: string
    // ... other fields
}

export default function StatisticsPage() {
    const [marines, setMarines] = useState<Marine[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchMarines() {
            try {
                const response = await fetch("/api/marines")
                if (!response.ok) throw new Error("Failed to fetch marines")
                const data = await response.json()
                setMarines(data)
            } catch (error) {
                console.error("Error fetching marines:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchMarines()
    }, [])

    // Group marines by PMOS
    const marinesByPMOS = marines.reduce(
        (acc, marine) => {
            if (!marine.pmos) return acc
            acc[marine.pmos] = acc[marine.pmos] || []
            acc[marine.pmos].push(marine)
            return acc
        },
        {} as Record<string, Marine[]>,
    )

    if (loading) {
        return (
            <div className="container mx-auto py-6">
                <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Card key={i}>
                            <CardHeader>
                                <Skeleton className="h-6 w-[200px]" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-[200px] w-full" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-6">
            <Tabs defaultValue="mos-health" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="mos-health">Current MOS Health</TabsTrigger>
                    <TabsTrigger value="projections">Health Projections</TabsTrigger>
                    <TabsTrigger value="personnel">Personnel Statistics</TabsTrigger>
                </TabsList>

                <TabsContent value="mos-health" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>MOS Health Overview</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-6">
                                {Object.entries(marinesByPMOS).map(([pmos, marines]) => (
                                    <MOSHealthDisplay key={pmos} marines={marines} pmos={pmos} />
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="projections">
                    <MOSHealthProjections />
                </TabsContent>

                <TabsContent value="personnel">
                    <Card>
                        <CardHeader>
                            <CardTitle>Personnel Statistics</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {/* We'll implement this in the next iteration */}
                            <p>Personnel statistics coming soon...</p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

