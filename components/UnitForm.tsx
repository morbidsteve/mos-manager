"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export default function UnitForm() {
  const [formData, setFormData] = useState({
    mcc: "",
    name: "",
    notes: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/units", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })
      if (response.ok) {
        alert("Unit data submitted successfully!")
        setFormData({
          mcc: "",
          name: "",
          notes: "",
        })
      } else {
        alert("Error submitting Unit data")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Error submitting Unit data")
    }
  }

  return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="mcc" className="block mb-1">
            MCC
          </label>
          <Input
              type="text"
              id="mcc"
              name="mcc"
              value={formData.mcc}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded"
          />
        </div>
        <div>
          <label htmlFor="name" className="block mb-1">
            Name
          </label>
          <Input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded"
          />
        </div>
        <div>
          <label htmlFor="notes" className="block mb-1">
            Notes
          </label>
          <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded min-h-[100px]"
              placeholder="Enter any additional notes about this unit..."
          />
        </div>
        <Button type="submit" className="w-full">
          Submit Unit Data
        </Button>
      </form>
  )
}

