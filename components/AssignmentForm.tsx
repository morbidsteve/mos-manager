"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { DialogFooter } from "@/components/ui/dialog"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface Unit {
  id: number
  mcc: string
  name: string
}

interface BIC {
  id: number
  bic: string
  description: string
  payGrade: string
  unit: {
    id: number
    mcc: string
    name: string
  }
}

interface Marine {
  id: number
  edipi: string
  lastName: string
  firstName: string
  middleInitial?: string
  payGrade: string
  pmos: string
  clearance?: string
  poly?: string
  trained?: boolean
  projectedSchoolhouse?: string
}

interface Assignment {
  id: number
  marineId: number
  unitId: number
  bicId: number
  dctb: string
  djcu: string
  ocd: string | null
  tourLength: number
  plannedEndDate: string
}

interface AssignmentFormProps {
  marine: Marine | null
  assignment?: Assignment
  onSuccess: () => void
  onCancel: () => void
}

export default function AssignmentForm({ marine, assignment, onSuccess, onCancel }: AssignmentFormProps) {
  const [marines, setMarines] = useState<Marine[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [allBICs, setAllBICs] = useState<BIC[]>([])
  const [filteredBICs, setFilteredBICs] = useState<BIC[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedMarine, setSelectedMarine] = useState<Marine | null>(marine)
  const [assignments, setAssignments] = useState<Assignment[]>([]) // Added assignments state

  const [formData, setFormData] = useState({
    marineId: assignment?.marineId?.toString() || marine?.id?.toString() || "",
    unitId: assignment?.unitId?.toString() || "",
    bicId: assignment?.bicId?.toString() || "",
    dctb: assignment?.dctb ? new Date(assignment.dctb) : new Date(),
    djcu: assignment?.djcu ? new Date(assignment.djcu) : new Date(),
    ocd: assignment?.ocd ? new Date(assignment.ocd) : null,
    tourLength: assignment?.tourLength?.toString() || "24",
    dependentsAuthorized: false,
    povShipmentAuthorized: false,
    householdGoodsAuthorized: false,
    temporaryDutyEnRoute: false,
    tdyLocation: "",
    tdyStartDate: null as Date | null,
    tdyEndDate: null as Date | null,
    remarks: "",
  })

  useEffect(() => {
    async function fetchData() {
      try {
        const [marinesResponse, unitsResponse, bicsResponse, assignmentsResponse] = await Promise.all([
          fetch("/api/marines/list"),
          fetch("/api/units/list"),
          fetch("/api/bics/list"),
          fetch("/api/assignments/list"),
        ])

        if (!marinesResponse.ok) throw new Error("Failed to fetch Marines")
        if (!unitsResponse.ok) throw new Error("Failed to fetch Units")
        if (!bicsResponse.ok) throw new Error("Failed to fetch BICs")
        if (!assignmentsResponse.ok) throw new Error("Failed to fetch Assignments")

        const [marinesData, unitsData, bicsData, assignmentsData] = await Promise.all([
          marinesResponse.json(),
          unitsResponse.json(),
          bicsResponse.json(),
          assignmentsResponse.json(),
        ])

        setMarines(marinesData)
        setUnits(unitsData)
        setAllBICs(bicsData)
        setAssignments(assignmentsData)

        // If we're editing an assignment, set the filtered BICs based on the unit
        if (assignment) {
          const unitBics = bicsData.filter((bic) => bic.unit.id === assignment.unitId)
          setFilteredBICs(unitBics)
        } else {
          setFilteredBICs(bicsData)
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : "Failed to load data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [assignment])

  // Update filtered BICs when unit changes
  useEffect(() => {
    if (formData.unitId) {
      const selectedUnitId = Number(formData.unitId)
      const filteredBICs = allBICs.filter((bic) => bic.unit.id === selectedUnitId)
      setFilteredBICs(filteredBICs)

      // Only clear BIC selection if it's not valid for the new unit AND we're not in edit mode
      if (!assignment && !filteredBICs.some((bic) => bic.id.toString() === formData.bicId)) {
        setFormData((prev) => ({ ...prev, bicId: "" }))
      }
    }
  }, [formData.unitId, allBICs, formData.bicId, assignment])

  // Pre-fill marine data when selected
  useEffect(() => {
    if (selectedMarine && !assignment) {
      // Only pre-fill if we're not editing an existing assignment
      const currentAssignment = assignments.find((a) => a.marineId === selectedMarine.id)
      if (currentAssignment) {
        setFormData((prev) => ({
          ...prev,
          marineId: selectedMarine.id.toString(),
          // Pre-fill other relevant data from current assignment if needed
        }))
      }
    }
  }, [selectedMarine, assignment, assignments])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      // Create or update the assignment
      const assignmentResponse = await fetch(assignment ? `/api/assignments/${assignment.id}` : "/api/assignments", {
        method: assignment ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          id: assignment?.id,
          marineId: selectedMarine?.id || Number(formData.marineId),
          unitId: Number(formData.unitId),
          bicId: Number(formData.bicId),
          tourLength: Number(formData.tourLength),
        }),
      })

      if (!assignmentResponse.ok) {
        const data = await assignmentResponse.json()
        throw new Error(data.error || "Failed to save assignment")
      }

      const assignmentData = await assignmentResponse.json()

      // Create corresponding orders
      const ordersResponse = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          marineId: selectedMarine?.id || Number(formData.marineId),
          unitId: Number(formData.unitId),
          assignmentId: assignmentData.id,
          type: "PCS",
          status: "DRAFTED",
          reportNoLaterThan: formData.dctb,
          detachNoLaterThan: formData.dctb,
          proceedDate: formData.dctb,
          travelDays: 4,
          dependentsAuthorized: formData.dependentsAuthorized,
          povShipmentAuthorized: formData.povShipmentAuthorized,
          householdGoodsAuthorized: formData.householdGoodsAuthorized,
          temporaryDutyEnRoute: formData.temporaryDutyEnRoute,
          tdyLocation: formData.tdyLocation,
          tdyStartDate: formData.tdyStartDate,
          tdyEndDate: formData.tdyEndDate,
          remarks: formData.remarks,
        }),
      })

      if (!ordersResponse.ok) {
        const data = await ordersResponse.json()
        throw new Error(data.error || "Failed to create orders")
      }

      onSuccess()
    } catch (error) {
      console.error("Error:", error)
      setError(error instanceof Error ? error.message : "Failed to save assignment")
    }
  }

  if (isLoading) return <div>Loading...</div>
  if (error) return <div className="text-red-500">{error}</div>

  return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-4">
          {!marine && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Marine *</label>
                <Select
                    value={formData.marineId}
                    onValueChange={(value) => {
                      setFormData((prev) => ({ ...prev, marineId: value }))
                      setSelectedMarine(marines.find((m) => m.id.toString() === value) || null)
                    }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Marine" />
                  </SelectTrigger>
                  <SelectContent>
                    {marines.map((marine) => (
                        <SelectItem key={marine.id} value={marine.id.toString()}>
                          {marine.lastName}, {marine.firstName} ({marine.payGrade})
                        </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
          )}

          {(selectedMarine || marine) && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Selected Marine</label>
                  <div className="p-2 border rounded-md bg-muted">
                    {selectedMarine?.lastName || marine?.lastName}, {selectedMarine?.firstName || marine?.firstName} (
                    {selectedMarine?.payGrade || marine?.payGrade})
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Unit *</label>
                  <Select
                      value={formData.unitId}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, unitId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((unit) => (
                          <SelectItem key={unit.id} value={unit.id.toString()}>
                            {unit.mcc} - {unit.name}
                          </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">BIC *</label>
                  <Select
                      value={formData.bicId}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, bicId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select BIC" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredBICs.map((bic) => (
                          <SelectItem key={bic.id} value={bic.id.toString()}>
                            {bic.bic} - {bic.description} ({bic.payGrade})
                          </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">DCTB *</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                                "w-full justify-start text-left font-normal",
                                !formData.dctb && "text-muted-foreground",
                            )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.dctb ? format(formData.dctb, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={formData.dctb}
                            onSelect={(date) => date && setFormData((prev) => ({ ...prev, dctb: date }))}
                            initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tour Length (months) *</label>
                    <Select
                        value={formData.tourLength}
                        onValueChange={(value) => setFormData((prev) => ({ ...prev, tourLength: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Tour Length" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="24">24 months</SelectItem>
                        <SelectItem value="36">36 months</SelectItem>
                        <SelectItem value="48">48 months</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Orders Details</h3>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                          id="dependentsAuthorized"
                          checked={formData.dependentsAuthorized}
                          onCheckedChange={(checked) =>
                              setFormData((prev) => ({ ...prev, dependentsAuthorized: checked === true }))
                          }
                      />
                      <label htmlFor="dependentsAuthorized">Dependents Authorized</label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                          id="povShipmentAuthorized"
                          checked={formData.povShipmentAuthorized}
                          onCheckedChange={(checked) =>
                              setFormData((prev) => ({ ...prev, povShipmentAuthorized: checked === true }))
                          }
                      />
                      <label htmlFor="povShipmentAuthorized">POV Shipment Authorized</label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                          id="householdGoodsAuthorized"
                          checked={formData.householdGoodsAuthorized}
                          onCheckedChange={(checked) =>
                              setFormData((prev) => ({ ...prev, householdGoodsAuthorized: checked === true }))
                          }
                      />
                      <label htmlFor="householdGoodsAuthorized">Household Goods Authorized</label>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                            id="temporaryDutyEnRoute"
                            checked={formData.temporaryDutyEnRoute}
                            onCheckedChange={(checked) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  temporaryDutyEnRoute: checked === true,
                                  tdyLocation: checked === true ? prev.tdyLocation : "",
                                  tdyStartDate: checked === true ? prev.tdyStartDate : null,
                                  tdyEndDate: checked === true ? prev.tdyEndDate : null,
                                }))
                            }
                        />
                        <label htmlFor="temporaryDutyEnRoute">Temporary Duty En Route</label>
                      </div>

                      {formData.temporaryDutyEnRoute && (
                          <div className="ml-6 space-y-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium">TDY Location</label>
                              <Input
                                  value={formData.tdyLocation}
                                  onChange={(e) => setFormData((prev) => ({ ...prev, tdyLocation: e.target.value }))}
                                  placeholder="Enter TDY location"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium">TDY Start Date</label>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !formData.tdyStartDate && "text-muted-foreground",
                                        )}
                                    >
                                      <CalendarIcon className="mr-2 h-4 w-4" />
                                      {formData.tdyStartDate ? (
                                          format(formData.tdyStartDate, "PPP")
                                      ) : (
                                          <span>Pick a date</span>
                                      )}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={formData.tdyStartDate || undefined}
                                        onSelect={(date) => setFormData((prev) => ({ ...prev, tdyStartDate: date }))}
                                        initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                              </div>

                              <div className="space-y-2">
                                <label className="text-sm font-medium">TDY End Date</label>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !formData.tdyEndDate && "text-muted-foreground",
                                        )}
                                    >
                                      <CalendarIcon className="mr-2 h-4 w-4" />
                                      {formData.tdyEndDate ? format(formData.tdyEndDate, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={formData.tdyEndDate || undefined}
                                        onSelect={(date) => setFormData((prev) => ({ ...prev, tdyEndDate: date }))}
                                        initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                              </div>
                            </div>
                          </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">{assignment ? "Update" : "Create"} Assignment</Button>
        </DialogFooter>
      </form>
  )
}

