"use client"

import type React from "react"

import { format } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
    Building2,
    Calendar,
    Clock,
    FileText,
    Globe,
    GraduationCap,
    MapPin,
    Shield,
    User,
    Users,
    Pencil,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import MarineDetails from "./MarineDetails"
import { useState } from "react"

interface Assignment {
    id: number
    dctb: string
    djcu: string
    ocd: string | null
    plannedEndDate: string | null
    tourLength: number
    marine: {
        id: number
        firstName: string
        lastName: string
        middleInitial: string
        payGrade: string
        pmos: string
        clearance?: string
        poly?: string
        trained?: boolean
        projectedSchoolhouse?: string
    }
    unit: {
        id: number
        name: string
        mcc: string
        notes?: string
    }
    bic: {
        id: number
        bic: string
        description: string
        payGrade: string
    }
    orders?: {
        id: number
        orderNumber: string
        type: string
        status: string
        issuedDate: string
        reportNoLaterThan: string
        detachNoEarlierThan: string | null
        detachNoLaterThan: string
        proceedDate: string
        travelDays: number
        temporaryDutyEnRoute: boolean
        tdyLocation?: string
        tdyStartDate?: string
        tdyEndDate?: string
        dependentsAuthorized: boolean
        povShipmentAuthorized: boolean
        householdGoodsAuthorized: boolean
        remarks?: string
    }
}

interface AssignmentTimelineDetailsProps {
    assignment: Assignment
    onAssignmentUpdate: (updatedAssignment: Assignment) => void
}

interface Marine {
    id: number
    firstName: string
    lastName: string
    middleInitial: string
    payGrade: string
    pmos: string
    clearance?: string
    poly?: string
    trained?: boolean
    projectedSchoolhouse?: string
}

export function AssignmentTimelineDetails({ assignment, onAssignmentUpdate }: AssignmentTimelineDetailsProps) {
    const [showMarineDetails, setShowMarineDetails] = useState(false)
    const [isEditingAssignment, setIsEditingAssignment] = useState(false)
    const [editedAssignment, setEditedAssignment] = useState(assignment)
    const [isEditing, setIsEditing] = useState(false)

    const handleMarineUpdate = async (updatedMarine: Marine) => {
        try {
            const response = await fetch(`/api/marines/${updatedMarine.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(updatedMarine),
            })

            if (!response.ok) throw new Error("Failed to update marine")

            const updatedAssignment = {
                ...assignment,
                marine: updatedMarine,
            }
            onAssignmentUpdate(updatedAssignment)
        } catch (error) {
            console.error("Error updating marine:", error)
        }
    }

    const handleAssignmentUpdate = async (updatedAssignment: Assignment) => {
        try {
            const response = await fetch(`/api/assignments/${assignment.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(updatedAssignment),
            })

            if (!response.ok) throw new Error("Failed to update assignment")

            const updatedAssignmentData = await response.json()
            onAssignmentUpdate(updatedAssignmentData)
            setIsEditingAssignment(false)
        } catch (error) {
            console.error("Error updating assignment:", error)
        }
    }

    // In the AssignmentEditForm component, replace the existing form state with local state
    const AssignmentEditForm = () => {
        const [formData, setFormData] = useState({
            dctb: format(new Date(editedAssignment.dctb), "yyyy-MM-dd"),
            djcu: format(new Date(editedAssignment.djcu), "yyyy-MM-dd"),
            ocd: editedAssignment.ocd ? format(new Date(editedAssignment.ocd), "yyyy-MM-dd") : "",
            tourLength: editedAssignment.tourLength.toString(),
        })

        const handleSubmit = async (e: React.FormEvent) => {
            e.preventDefault()
            const updatedAssignment = {
                ...editedAssignment,
                dctb: formData.dctb,
                djcu: formData.djcu,
                ocd: formData.ocd || null,
                tourLength: Number.parseInt(formData.tourLength) || editedAssignment.tourLength,
            }
            await handleAssignmentUpdate(updatedAssignment)
        }

        return (
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium">DCTB</label>
                        <Input
                            type="date"
                            value={formData.dctb}
                            onChange={(e) => setFormData((prev) => ({ ...prev, dctb: e.target.value }))}
                            className="w-full"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium">DJCU</label>
                        <Input
                            type="date"
                            value={formData.djcu}
                            onChange={(e) => setFormData((prev) => ({ ...prev, djcu: e.target.value }))}
                            className="w-full"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium">OCD</label>
                        <Input
                            type="date"
                            value={formData.ocd}
                            onChange={(e) => setFormData((prev) => ({ ...prev, ocd: e.target.value }))}
                            className="w-full"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Tour Length (months)</label>
                        <Input
                            type="number"
                            value={formData.tourLength}
                            onChange={(e) => setFormData((prev) => ({ ...prev, tourLength: e.target.value }))}
                            className="w-full"
                            min="0"
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsEditingAssignment(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit}>Save Changes</Button>
                </div>
            </div>
        )
    }

    return (
        <>
            <ScrollArea className="h-[80vh] pr-4">
                <div className="space-y-6">
                    {/* Marine Information */}
                    <Card className="relative group">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Marine Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            <div>
                                <div className="flex items-center justify-between">
                                    <h4 className="font-semibold mb-2">
                                        {assignment.marine.lastName}, {assignment.marine.firstName} {assignment.marine.middleInitial}
                                    </h4>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">Pay Grade</p>
                                        <p className="font-medium">{assignment.marine.payGrade}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">PMOS</p>
                                        <p className="font-medium">{assignment.marine.pmos}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Clearance</p>
                                    <p className="font-medium">{assignment.marine.clearance || "N/A"}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Poly</p>
                                    <p className="font-medium">{assignment.marine.poly || "N/A"}</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Shield className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">
                    Training Status:{" "}
                                        <Badge variant={assignment.marine.trained ? "default" : "secondary"}>
                      {assignment.marine.trained ? "Trained" : "Untrained"}
                    </Badge>
                  </span>
                                </div>
                                {assignment.marine.projectedSchoolhouse && (
                                    <div className="flex items-center gap-2">
                                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm">Projected Schoolhouse: {assignment.marine.projectedSchoolhouse}</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Assignment Information */}
                    {isEditing ? (
                        <Card>
                            <CardHeader>
                                <CardTitle>Edit Assignment</CardTitle>
                                <CardDescription>Update the assignment details below</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <AssignmentEditForm />
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <CardTitle className="flex items-center gap-2">
                                        <Building2 className="h-5 w-5" />
                                        Assignment Details
                                    </CardTitle>
                                    <Button variant="outline" size="sm" onClick={() => setIsEditingAssignment(true)}>
                                        <Pencil className="h-4 w-4 mr-2" />
                                        Edit Assignment
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {isEditingAssignment ? (
                                    <AssignmentEditForm />
                                ) : (
                                    <>
                                        <div className="grid gap-4">
                                            <div>
                                                <h4 className="font-semibold mb-2">Unit Information</h4>
                                                <p className="text-lg">{assignment.unit.name}</p>
                                                <p className="text-sm text-muted-foreground">MCC: {assignment.unit.mcc}</p>
                                                {assignment.unit.notes && (
                                                    <p className="text-sm text-muted-foreground mt-2">Notes: {assignment.unit.notes}</p>
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="font-semibold mb-2">BIC Information</h4>
                                                <p className="text-lg">{assignment.bic.bic}</p>
                                                <p className="text-sm text-muted-foreground">Description: {assignment.bic.description}</p>
                                                <p className="text-sm text-muted-foreground">Required Pay Grade: {assignment.bic.payGrade}</p>
                                            </div>
                                        </div>

                                        <Separator />

                                        <div className="grid gap-4">
                                            <h4 className="font-semibold">Dates</h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                                    <div>
                                                        <p className="text-sm font-medium">DCTB</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {format(new Date(assignment.dctb), "dd MMM yyyy")}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                                    <div>
                                                        <p className="text-sm font-medium">DJCU</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {format(new Date(assignment.djcu), "dd MMM yyyy")}
                                                        </p>
                                                    </div>
                                                </div>
                                                {assignment.ocd && (
                                                    <div className="flex items-center gap-2">
                                                        <Globe className="h-4 w-4 text-muted-foreground" />
                                                        <div>
                                                            <p className="text-sm font-medium">OCD</p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {format(new Date(assignment.ocd), "dd MMM yyyy")}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                                {assignment.plannedEndDate && (
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                                        <div>
                                                            <p className="text-sm font-medium">Planned End Date</p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {format(new Date(assignment.plannedEndDate), "dd MMM yyyy")}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Users className="h-4 w-4 text-muted-foreground" />
                                                <p className="text-sm">
                                                    Tour Length: <span className="font-medium">{assignment.tourLength} months</span>
                                                </p>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Orders Information */}
                    {assignment.orders && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    Orders Information
                                </CardTitle>
                                <CardDescription>Order Number: {assignment.orders.orderNumber}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid gap-4">
                                    <div className="flex items-center gap-4">
                                        <Badge>{assignment.orders.type}</Badge>
                                        <Badge variant="outline">{assignment.orders.status}</Badge>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <p className="text-sm text-muted-foreground">Issued Date</p>
                                            <p className="font-medium">{format(new Date(assignment.orders.issuedDate), "dd MMM yyyy")}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm text-muted-foreground">Report NLT</p>
                                            <p className="font-medium">
                                                {format(new Date(assignment.orders.reportNoLaterThan), "dd MMM yyyy")}
                                            </p>
                                        </div>
                                        {assignment.orders.detachNoEarlierThan && (
                                            <div className="space-y-1">
                                                <p className="text-sm text-muted-foreground">Detach NET</p>
                                                <p className="font-medium">
                                                    {format(new Date(assignment.orders.detachNoEarlierThan), "dd MMM yyyy")}
                                                </p>
                                            </div>
                                        )}
                                        <div className="space-y-1">
                                            <p className="text-sm text-muted-foreground">Detach NLT</p>
                                            <p className="font-medium">
                                                {format(new Date(assignment.orders.detachNoLaterThan), "dd MMM yyyy")}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            <p className="text-sm">
                                                Proceed Date:{" "}
                                                <span className="font-medium">
                          {format(new Date(assignment.orders.proceedDate), "dd MMM yyyy")}
                        </span>
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-muted-foreground" />
                                            <p className="text-sm">
                                                Travel Days: <span className="font-medium">{assignment.orders.travelDays}</span>
                                            </p>
                                        </div>
                                    </div>

                                    {assignment.orders.temporaryDutyEnRoute && assignment.orders.tdyLocation && (
                                        <div className="space-y-2">
                                            <h4 className="font-semibold">Temporary Duty En Route</h4>
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                                <p className="text-sm">{assignment.orders.tdyLocation}</p>
                                            </div>
                                            {assignment.orders.tdyStartDate && assignment.orders.tdyEndDate && (
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1">
                                                        <p className="text-sm text-muted-foreground">Start Date</p>
                                                        <p className="text-sm">{format(new Date(assignment.orders.tdyStartDate), "dd MMM yyyy")}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-sm text-muted-foreground">End Date</p>
                                                        <p className="text-sm">{format(new Date(assignment.orders.tdyEndDate), "dd MMM yyyy")}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <h4 className="font-semibold">Authorizations</h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            <Badge variant={assignment.orders.dependentsAuthorized ? "default" : "secondary"}>
                                                {assignment.orders.dependentsAuthorized ? "Dependents Authorized" : "No Dependents"}
                                            </Badge>
                                            <Badge variant={assignment.orders.povShipmentAuthorized ? "default" : "secondary"}>
                                                {assignment.orders.povShipmentAuthorized ? "POV Authorized" : "No POV"}
                                            </Badge>
                                            <Badge variant={assignment.orders.householdGoodsAuthorized ? "default" : "secondary"}>
                                                {assignment.orders.householdGoodsAuthorized ? "HHG Authorized" : "No HHG"}
                                            </Badge>
                                        </div>
                                    </div>

                                    {assignment.orders.remarks && (
                                        <div className="space-y-2">
                                            <h4 className="font-semibold">Remarks</h4>
                                            <p className="text-sm whitespace-pre-wrap">{assignment.orders.remarks}</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </ScrollArea>

            {/* Marine Details Dialog */}
            <Dialog
                open={showMarineDetails}
                onOpenChange={setShowMarineDetails}
                aria-labelledby="marine-details-title"
                aria-describedby="marine-details-description"
            >
                <DialogContent className="max-w-3xl h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle id="marine-details-title">Marine Details</DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto px-6">
                        <MarineDetails
                            marineId={assignment.marine.id}
                            onClose={() => setShowMarineDetails(false)}
                            onUpdate={handleMarineUpdate}
                            allowEditing={true}
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}

