import React from "react"
import { format } from "date-fns"

interface FormData {
  id: string
  dor?: string | null
  afadbd?: string | null
  dateOfBirth?: string | null
  tourLength?: string | null
  linealNumber?: string | null
  [key: string]: any
}

interface Marine {
  id: string
  dor?: Date | null
  afadbd?: Date | null
  dateOfBirth?: Date | null
  tourLength?: number | null
  linealNumber?: number | null
  [key: string]: any
}

interface MarineFormProps {
  marine: Marine
  onSubmit: (data: any) => void
}

const MarineForm: React.FC<MarineFormProps> = ({ marine, onSubmit }) => {
  const [formData, setFormData] = React.useState<FormData>({
    id: marine.id,
    dor: marine.dor ? format(marine.dor, "yyyy-MM-dd") : null,
    afadbd: marine.afadbd ? format(marine.afadbd, "yyyy-MM-dd") : null,
    dateOfBirth: marine.dateOfBirth ? format(marine.dateOfBirth, "yyyy-MM-dd") : null,
    tourLength: marine.tourLength ? marine.tourLength.toString() : null,
    linealNumber: marine.linealNumber ? marine.linealNumber.toString() : null,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Form submitted with data:", formData)
    if (!formData.id) {
      console.error("No marine ID provided for update")
      return
    }

    // Track which fields were actually modified by the user
    const changedFields = Object.entries(formData).reduce(
        (acc, [key, value]) => {
          // Only include fields that were explicitly changed and are different from original
          const originalValue = marine[key as keyof typeof marine]
          const formattedOriginal =
              originalValue instanceof Date ? format(originalValue, "yyyy-MM-dd") : originalValue?.toString() || ""

          if (formattedOriginal !== value?.toString()) {
            // For dates, ensure we're sending proper ISO strings
            if (key === "dor" || key === "afadbd" || key === "dateOfBirth") {
              acc[key] = value ? `${value}T00:00:00.000Z` : null
            } else if (key === "tourLength" || key === "linealNumber") {
              acc[key] = value ? Number.parseInt(value as string) : null
            } else {
              acc[key] = value
            }
          }
          return acc
        },
        {} as Record<string, any>,
    )

    // Only send the ID and changed fields
    const updateData = {
      id: formData.id,
      ...changedFields,
    }

    console.log("Sending update with changed fields only:", updateData)
    onSubmit(updateData)
  }

  return (
      <form onSubmit={handleSubmit}>
        <input type="hidden" name="id" value={formData.id} />

        <div>
          <label htmlFor="dor">Date of Rank:</label>
          <input type="date" id="dor" name="dor" value={formData.dor || ""} onChange={handleChange} />
        </div>

        <div>
          <label htmlFor="afadbd">AFADBD:</label>
          <input type="date" id="afadbd" name="afadbd" value={formData.afadbd || ""} onChange={handleChange} />
        </div>

        <div>
          <label htmlFor="dateOfBirth">Date of Birth:</label>
          <input
              type="date"
              id="dateOfBirth"
              name="dateOfBirth"
              value={formData.dateOfBirth || ""}
              onChange={handleChange}
          />
        </div>

        <div>
          <label htmlFor="tourLength">Tour Length:</label>
          <input
              type="number"
              id="tourLength"
              name="tourLength"
              value={formData.tourLength || ""}
              onChange={handleChange}
          />
        </div>

        <div>
          <label htmlFor="linealNumber">Lineal Number:</label>
          <input
              type="number"
              id="linealNumber"
              name="linealNumber"
              value={formData.linealNumber || ""}
              onChange={handleChange}
          />
        </div>

        <button type="submit">Update Marine</button>
      </form>
  )
}

export default MarineForm

