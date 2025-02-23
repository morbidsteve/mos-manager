"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
}

interface OrdersFormProps {
    marine: Marine
    onSuccess: () => void
    onCancel: () => void
}

const orderTypes = ["PCS", "PCA", "TEMINS", "TAD"]

export default function OrdersForm({ marine, onSuccess, onCancel }: OrdersFormProps) {
    const [units, setUnits] = useState<Unit[]>([])
    const [allBICs, setAllBICs] = useState<BIC[]>([])
    const [filteredBICs, setFilteredBICs] = useState<BIC[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        marineId: marine.id.toString(),
        orderNumber: "",
        unitId: "",
        type: "PCS",
        status: "DRAFTED",
        issuedDate: new Date(),
        reportNoLaterThan: new Date(),
        detachNoEarlierThan: new Date(),
        detachNoLaterThan: new Date(),
        proceedDate: new Date(),
        travelDays: 4,
        temporaryDutyEnRoute: false,
        tdyLocation: "",
        tdyStartDate: null as Date | null,
        tdyEndDate: null as Date | null,
        dependentsAuthorized: false,
        povShipmentAuthorized: false,
        householdGoodsAuthorized: false,
        remarks: "",
    })

    useEffect(() => {
        async function fetchData() {
            try {
                const [unitsResponse, bicsResponse] = await Promise.all([fetch("/api/units/list"), fetch("/api/bics/list")])

                if (!unitsResponse.ok) throw new Error("Failed to fetch Units")
                if (!bicsResponse.ok) throw new Error("Failed to fetch BICs")

                const [unitsData, bicsData] = await Promise.all([unitsResponse.json(), bicsResponse.json()])

                setUnits(unitsData)
                setAllBICs(bicsData)
                setFilteredBICs(bicsData)
            } catch (error) {
                setError(error instanceof Error ? error.message : "Failed to load data")
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [])

    useEffect(() => {
        if (formData.unitId) {
            const selectedUnitId = Number(formData.unitId)
            const filteredBICs = allBICs.filter((bic) => bic.unit.id === selectedUnitId)
            setFilteredBICs(filteredBICs)
        }
    }, [formData.unitId, allBICs])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        try {
            const response = await fetch("/api/orders", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...formData,
                    marineId: Number(formData.marineId),
                    unitId: Number(formData.unitId),
                    travelDays: Number(formData.travelDays),
                }),
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || "Failed to create orders")
            }

            onSuccess()
        } catch (error) {
            setError(error instanceof Error ? error.message : "Failed to create orders")
        }
    }

    if (isLoading) return <div>Loading...</div>
    if (error) return <div className="text-red-500">{error}</div>

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
                {/* Marine Information */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">Marine</label>
                    <div className="p-2 border rounded-md bg-muted">
                        {marine.lastName}, {marine.firstName} {marine.middleInitial} ({marine.payGrade})
                    </div>
                </div>

                {/* Order Number */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">Order Number *</label>
                    <Input
                        required
                        value={formData.orderNumber}
                        onChange={(e) => setFormData((prev) => ({ ...prev, orderNumber: e.target.value }))}
                        placeholder="Enter order number"
                    />
                </div>

                {/* Unit Selection */}
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

                {/* Order Type */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">Order Type *</label>
                    <Select value={formData.type} onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value }))}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Order Type" />
                        </SelectTrigger>
                        <SelectContent>
                            {orderTypes.map((type) => (
                                <SelectItem key={type} value={type}>
                                    {type}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Dates Section */}
                <div className="col-span-2 grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Issue Date *</label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !formData.issuedDate && "text-muted-foreground",
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {formData.issuedDate ? format(formData.issuedDate, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={formData.issuedDate}
                                    onSelect={(date) => date && setFormData((prev) => ({ ...prev, issuedDate: date }))}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Report No Later Than *</label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !formData.reportNoLaterThan && "text-muted-foreground",
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {formData.reportNoLaterThan ? format(formData.reportNoLaterThan, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={formData.reportNoLaterThan}
                                    onSelect={(date) => date && setFormData((prev) => ({ ...prev, reportNoLaterThan: date }))}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Detach No Earlier Than</label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !formData.detachNoEarlierThan && "text-muted-foreground",
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {formData.detachNoEarlierThan ? (
                                        format(formData.detachNoEarlierThan, "PPP")
                                    ) : (
                                        <span>Pick a date</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={formData.detachNoEarlierThan}
                                    onSelect={(date) => date && setFormData((prev) => ({ ...prev, detachNoEarlierThan: date }))}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Detach No Later Than *</label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !formData.detachNoLaterThan && "text-muted-foreground",
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {formData.detachNoLaterThan ? format(formData.detachNoLaterThan, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={formData.detachNoLaterThan}
                                    onSelect={(date) => date && setFormData((prev) => ({ ...prev, detachNoLaterThan: date }))}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                {/* Travel Information */}
                <div className="col-span-2 space-y-6">
                    <h3 className="font-semibold">Travel Information</h3>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Proceed Date *</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !formData.proceedDate && "text-muted-foreground",
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {formData.proceedDate ? format(formData.proceedDate, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={formData.proceedDate}
                                        onSelect={(date) => date && setFormData((prev) => ({ ...prev, proceedDate: date }))}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Travel Days *</label>
                            <Input
                                type="number"
                                min="0"
                                required
                                value={formData.travelDays}
                                onChange={(e) => setFormData((prev) => ({ ...prev, travelDays: Number(e.target.value) }))}
                            />
                        </div>
                    </div>

                    {/* TDY Information */}
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
                            <label htmlFor="temporaryDutyEnRoute" className="text-sm font-medium">
                                Temporary Duty En Route
                            </label>
                        </div>

                        {formData.temporaryDutyEnRoute && (
                            <div className="grid grid-cols-2 gap-4 pl-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">TDY Location</label>
                                    <Input
                                        value={formData.tdyLocation}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, tdyLocation: e.target.value }))}
                                        placeholder="Enter TDY location"
                                    />
                                </div>

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
                                                {formData.tdyStartDate ? format(formData.tdyStartDate, "PPP") : <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={formData.tdyStartDate || undefined}
                                                onSelect={(date) => date && setFormData((prev) => ({ ...prev, tdyStartDate: date }))}
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
                                                onSelect={(date) => date && setFormData((prev) => ({ ...prev, tdyEndDate: date }))}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Authorizations */}
                    <div className="space-y-4">
                        <h4 className="font-medium">Authorizations</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="dependentsAuthorized"
                                    checked={formData.dependentsAuthorized}
                                    onCheckedChange={(checked) =>
                                        setFormData((prev) => ({ ...prev, dependentsAuthorized: checked === true }))
                                    }
                                />
                                <label htmlFor="dependentsAuthorized" className="text-sm">
                                    Dependents Authorized
                                </label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="povShipmentAuthorized"
                                    checked={formData.povShipmentAuthorized}
                                    onCheckedChange={(checked) =>
                                        setFormData((prev) => ({ ...prev, povShipmentAuthorized: checked === true }))
                                    }
                                />
                                <label htmlFor="povShipmentAuthorized" className="text-sm">
                                    POV Shipment Authorized
                                </label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="householdGoodsAuthorized"
                                    checked={formData.householdGoodsAuthorized}
                                    onCheckedChange={(checked) =>
                                        setFormData((prev) => ({ ...prev, householdGoodsAuthorized: checked === true }))
                                    }
                                />
                                <label htmlFor="householdGoodsAuthorized" className="text-sm">
                                    Household Goods Authorized
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Remarks */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Remarks</label>
                        <Textarea
                            value={formData.remarks}
                            onChange={(e) => setFormData((prev) => ({ ...prev, remarks: e.target.value }))}
                            placeholder="Enter any additional remarks or special instructions..."
                            className="min-h-[100px]"
                        />
                    </div>
                </div>
            </div>

            {error && <div className="text-red-500 text-sm">{error}</div>}

            <DialogFooter>
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit">Create Orders</Button>
            </DialogFooter>
        </form>
    )
}

