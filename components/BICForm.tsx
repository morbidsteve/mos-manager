"use client"

import { useState, useEffect } from "react"

interface Unit {
    id: number
    mcc: string
    name: string
}

export default function BICForm() {
    const [formData, setFormData] = useState({
        bic: "",
        description: "",
        payGrade: "",
        unitId: "",
    })
    const [units, setUnits] = useState<Unit[]>([])

    useEffect(() => {
        async function fetchUnits() {
            const response = await fetch("/api/units/list")
            if (response.ok) {
                const unitsData = await response.json()
                setUnits(unitsData)
            } else {
                console.error("Failed to fetch Units data")
            }
        }

        fetchUnits()
    }, [])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData((prevState) => ({
            ...prevState,
            [name]: value,
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const response = await fetch("/api/bics", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            })
            if (response.ok) {
                alert("BIC data submitted successfully!")
                setFormData({
                    bic: "",
                    description: "",
                    payGrade: "",
                    unitId: "",
                })
            } else {
                alert("Error submitting BIC data")
            }
        } catch (error) {
            console.error("Error:", error)
            alert("Error submitting BIC data")
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="bic" className="block mb-1">
                    BIC
                </label>
                <input
                    type="text"
                    id="bic"
                    name="bic"
                    value={formData.bic}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border rounded"
                />
            </div>
            <div>
                <label htmlFor="description" className="block mb-1">
                    Description
                </label>
                <input
                    type="text"
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border rounded"
                />
            </div>
            <div>
                <label htmlFor="payGrade" className="block mb-1">
                    Pay Grade
                </label>
                <input
                    type="text"
                    id="payGrade"
                    name="payGrade"
                    value={formData.payGrade}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border rounded"
                />
            </div>
            <div>
                <label htmlFor="unitId" className="block mb-1">
                    Unit
                </label>
                <select
                    id="unitId"
                    name="unitId"
                    value={formData.unitId}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border rounded"
                >
                    <option value="">Select a Unit</option>
                    {units.map((unit) => (
                        <option key={unit.id} value={unit.id}>
                            {unit.mcc} - {unit.name}
                        </option>
                    ))}
                </select>
            </div>
            <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">
                Submit BIC Data
            </button>
        </form>
    )
}

