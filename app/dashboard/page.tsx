"use client"

import { useEffect } from "react"

import { useState } from "react"

import { MOSHealthDisplay } from "@/components/MOSHealthDisplay"

export default function DashboardPage() {
    const [marines, setMarines] = useState([])

    useEffect(() => {
        // Fetch marines data
        const fetchMarines = async () => {
            const response = await fetch("/api/marines")
            const data = await response.json()
            setMarines(data)
        }

        fetchMarines()
    }, [])

    // Group marines by PMOS
    const marinesByPMOS = marines.reduce((acc, marine) => {
        acc[marine.pmos] = acc[marine.pmos] || []
        acc[marine.pmos].push(marine)
        return acc
    }, {})

    return (
        <div className="container mx-auto py-6">
            <div className="grid gap-6">
                {Object.entries(marinesByPMOS).map(([pmos, marines]) => (
                    <MOSHealthDisplay key={pmos} marines={marines} pmos={pmos} />
                ))}
            </div>
        </div>
    )
}

