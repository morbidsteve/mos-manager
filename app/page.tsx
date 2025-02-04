"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import MarineForm from "../components/MarineForm"
import UnitForm from "../components/UnitForm"
import AssignmentForm from "../components/AssignmentForm"
import BICForm from "../components/BICForm"
import MarineList from "../components/MarineList"
import UnitList from "../components/UnitList"
import AssignmentList from "../components/AssignmentList"
import BICList from "../components/BICList"
import AssignmentTimeline from "../components/AssignmentTimeline"

export default function Home() {
    const [activeTab, setActiveTab] = useState("marine")

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-4xl font-bold mb-8 text-center">MOS 1710 Management System</h1>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="marine">Marine</TabsTrigger>
                    <TabsTrigger value="unit">Unit</TabsTrigger>
                    <TabsTrigger value="assignment">Assignment</TabsTrigger>
                    <TabsTrigger value="bic">BIC</TabsTrigger>
                    <TabsTrigger value="timeline">Timeline</TabsTrigger>
                </TabsList>
                <TabsContent value="marine">
                    <div className="grid md:grid-cols-2 gap-8">
                        <Card>
                            <CardContent className="pt-6">
                                <h2 className="text-2xl font-bold mb-4">Add New Marine</h2>
                                <MarineForm />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <MarineList />
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
                <TabsContent value="unit">
                    <div className="grid md:grid-cols-2 gap-8">
                        <Card>
                            <CardContent className="pt-6">
                                <h2 className="text-2xl font-bold mb-4">Add New Unit</h2>
                                <UnitForm />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <UnitList />
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
                <TabsContent value="assignment">
                    <div className="grid md:grid-cols-2 gap-8">
                        <Card>
                            <CardContent className="pt-6">
                                <h2 className="text-2xl font-bold mb-4">Add New Assignment</h2>
                                <AssignmentForm />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <AssignmentList />
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
                <TabsContent value="bic">
                    <div className="grid md:grid-cols-2 gap-8">
                        <Card>
                            <CardContent className="pt-6">
                                <h2 className="text-2xl font-bold mb-4">Add New BIC</h2>
                                <BICForm />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <BICList />
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
                <TabsContent value="timeline">
                    <AssignmentTimeline />
                </TabsContent>
            </Tabs>
        </div>
    )
}

