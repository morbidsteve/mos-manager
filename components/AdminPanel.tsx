"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

export default function AdminPanel() {
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isClearing, setIsClearing] = useState(false)

    const handleClearDatabase = async () => {
        setIsClearing(true)
        try {
            const response = await fetch("/api/admin/clear-database", {
                method: "POST",
            })

            if (!response.ok) {
                throw new Error("Failed to clear database")
            }

            alert("Database cleared successfully")
        } catch (error) {
            console.error("Error clearing database:", error)
            alert("Failed to clear database")
        } finally {
            setIsClearing(false)
            setIsDialogOpen(false)
        }
    }

    return (
        <div className="container mx-auto p-6">
            <div className="rounded-lg border p-4">
                <h2 className="text-lg font-semibold mb-4">Database Management</h2>
                <Button variant="destructive" onClick={() => setIsDialogOpen(true)}>
                    Clear Database
                </Button>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Clear Database</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to clear the entire database? This action cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isClearing}>
                                Cancel
                            </Button>
                            <Button variant="destructive" onClick={handleClearDatabase} disabled={isClearing}>
                                {isClearing ? "Clearing..." : "Clear Database"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    )
}

