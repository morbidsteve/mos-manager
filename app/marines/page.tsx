"use client"

import { useEffect, useState } from "react"
import type { Marine } from "@prisma/client"
import MarineList from "@/components/MarineList"

export default function MarinesPage() {
    const [marines, setMarines] = useState<Marine[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        console.log("MarinesPage mounted")
        async function fetchMarines() {
            try {
                console.log("Fetching marines...")
                const response = await fetch("/api/marines")
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
                const data = await response.json()
                console.log("Fetched marines:", data)
                setMarines(data)
            } catch (err) {
                console.error("Error fetching marines:", err)
            } finally {
                setLoading(false)
            }
        }

        fetchMarines()
    }, [])

    const handleSuccess = async () => {
        console.log("handleSuccess called")
        setLoading(true)
        try {
            const response = await fetch("/api/marines")
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
            const data = await response.json()
            console.log("Refreshed marines data:", data)
            setMarines(data)
        } catch (error) {
            console.error("Error reloading marines:", error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="container mx-auto py-6">
            <MarineList initialMarines={marines} isLoading={loading} onSuccess={handleSuccess} />
        </div>
    )
}

