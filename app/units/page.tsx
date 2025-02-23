"use client"

import { useEffect, useState } from "react"
import UnitList from "@/components/UnitList"
import type { Unit } from "@prisma/client"

export default function UnitsPage() {
    const [units, setUnits] = useState<Unit[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function fetchUnits() {
            try {
                const response = await fetch("/api/units")
                if (!response.ok) throw new Error("Failed to fetch units")
                const data = await response.json()
                setUnits(data)
            } catch (error) {
                console.error("Error loading units:", error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchUnits()
    }, [])

    const handleSuccess = async () => {
        setIsLoading(true)
        try {
            const response = await fetch("/api/units")
            if (!response.ok) throw new Error("Failed to fetch units")
            const data = await response.json()
            setUnits(data)
        } catch (error) {
            console.error("Error reloading units:", error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="container mx-auto py-6">
            <UnitList initialUnits={units} isLoading={isLoading} onSuccess={handleSuccess} />
        </div>
    )
}

