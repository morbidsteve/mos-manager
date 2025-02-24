"use client"

import React from "react"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import {
    calculateOnHandPersonnel,
    calculatePercentFill,
    calculateProjectedMOSHealth,
    calculateCurrentMOSHealth,
} from "@/lib/calculations"

interface MOSHealthDisplayProps {
    marines: any[]
    pmos: string
    initialAuthorized?: { [key: string]: number }
}

const DEFAULT_STRENGTH = {
    W5: 1,
    W4: 1,
    W3: 1,
    W2: 1,
    W1: 1,
}

export function MOSHealthDisplay({ marines, pmos, initialAuthorized = {} }: MOSHealthDisplayProps) {
    const [authorizedStrength, setAuthorizedStrength] = useState(initialAuthorized)
    const [isEditing, setIsEditing] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const { toast } = useToast()

    useEffect(() => {
        if (!isEditing) {
            fetchAuthorizedStrength()
        }
    }, [isEditing])

    const fetchAuthorizedStrength = async () => {
        try {
            console.log("Fetching authorized strength for PMOS:", pmos)
            const response = await fetch(`/api/authorized-strength?pmos=${pmos}`)

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || "Failed to fetch authorized strength")
            }

            const data = await response.json()
            console.log("Received authorized strength:", data)

            if (Object.keys(data).length > 0) {
                setAuthorizedStrength(data)
            } else {
                console.log("No data received, using defaults")
                setAuthorizedStrength(DEFAULT_STRENGTH)
            }
        } catch (error) {
            console.error("Error fetching authorized strength:", error)
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to fetch authorized strength",
                variant: "destructive",
            })
            setAuthorizedStrength(DEFAULT_STRENGTH)
        }
    }

    const onHandPersonnel = calculateOnHandPersonnel(marines)
    const projectedGains = marines.filter((m) => m.projectedGains).length

    const totalAuthorized = Object.values(authorizedStrength).reduce((sum, val) => sum + val, 0)
    const totalOnHand = Object.values(onHandPersonnel).reduce((sum, val) => sum + val, 0)

    const currentHealth = calculateCurrentMOSHealth(totalOnHand, totalAuthorized)
    const projectedHealth = calculateProjectedMOSHealth(totalOnHand, projectedGains, totalAuthorized)

    const handleAuthorizedChange = (payGrade: string, value: string) => {
        setAuthorizedStrength((prev) => ({
            ...prev,
            [payGrade]: Number.parseInt(value) || 0,
        }))
    }

    const saveAuthorizedStrength = async () => {
        setIsLoading(true)
        try {
            console.log("Saving strength:", { pmos, strength: authorizedStrength })

            const response = await fetch("/api/authorized-strength", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    pmos,
                    strength: authorizedStrength,
                }),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || "Failed to save authorized strength")
            }

            const data = await response.json()
            console.log("Save response:", data)

            toast({
                title: "Success",
                description: "Authorized strength updated successfully",
                duration: 3000,
            })

            // Keep editing mode active until user explicitly clicks "Done"
            // setIsEditing(false)
        } catch (error) {
            console.error("Error saving authorized strength:", error)
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to save authorized strength",
                variant: "destructive",
                duration: 3000,
            })
        } finally {
            setIsLoading(false)
        }
    }

    // Update the button click handler to separate saving from editing state
    const handleEditClick = async () => {
        if (isEditing) {
            // If we're currently editing and clicking "Done", save changes
            await saveAuthorizedStrength()
        }
        setIsEditing(!isEditing)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    <span>MOS Health - {pmos}</span>
                    <Button variant="outline" onClick={handleEditClick} disabled={isLoading}>
                        {isLoading ? "Saving..." : isEditing ? "Done" : "Edit Authorized"}
                    </Button>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="grid grid-cols-4 gap-4">
                        <div>Pay Grade</div>
                        <div>On Hand</div>
                        <div>Authorized</div>
                        <div>% Fill</div>
                        {Object.keys(DEFAULT_STRENGTH)
                            .sort((a, b) => {
                                // Extract number from grade (e.g., "W5" -> 5)
                                const numA = Number.parseInt(a.slice(1))
                                const numB = Number.parseInt(b.slice(1))
                                // Sort in descending order
                                return numB - numA
                            })
                            .map((grade) => (
                                <React.Fragment key={grade}>
                                    <div>{grade}</div>
                                    <div>{onHandPersonnel[grade] || 0}</div>
                                    <div>
                                        {isEditing ? (
                                            <Input
                                                type="number"
                                                value={authorizedStrength[grade] || 0}
                                                onChange={(e) => handleAuthorizedChange(grade, e.target.value)}
                                                className="w-20"
                                            />
                                        ) : (
                                            authorizedStrength[grade] || 0
                                        )}
                                    </div>
                                    <div>{calculatePercentFill(onHandPersonnel[grade] || 0, authorizedStrength[grade] || 0)}%</div>
                                </React.Fragment>
                            ))}
                    </div>

                    <div className="pt-4 border-t">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm font-medium">Current MOS Health</p>
                                <p className="text-2xl font-bold">{currentHealth}%</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium">Projected MOS Health</p>
                                <p className="text-2xl font-bold">{projectedHealth}%</p>
                            </div>
                        </div>
                    </div>

                    {isEditing && (
                        <div className="flex justify-end pt-4">
                            <Button onClick={saveAuthorizedStrength} disabled={isLoading}>
                                {isLoading ? "Saving..." : "Save Changes"}
                            </Button>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

