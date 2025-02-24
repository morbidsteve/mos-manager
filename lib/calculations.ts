import { differenceInDays, addDays, format, addMonths, isWithinInterval } from "date-fns"

export function calculateTimeLeftOnOrders(dctb: Date, yearsOrdered: number): number {
    const today = new Date()
    const timeServed = differenceInDays(today, dctb)
    const totalOrderTime = yearsOrdered * 365.25
    return Number(((totalOrderTime - timeServed) / 365.25).toFixed(2))
}

export function calculateSEDD(dctb: Date, yearsOrdered: number): Date {
    return addDays(dctb, Math.floor(yearsOrdered * 365.25))
}

export function calculate20YearMark(afadbd: Date): Date {
    return addDays(afadbd, Math.floor(20 * 365.25))
}

export function calculate30YearMark(afadbd: Date): Date {
    return addDays(afadbd, Math.floor(30 * 365.25))
}

export function calculateTimeLeftTo20(afadbd: Date): number {
    const today = new Date()
    const mark20 = calculate20YearMark(afadbd)
    return Number((differenceInDays(mark20, today) / 365).toFixed(2))
}

export function calculateTimeLeftToHigh3(high3Date: Date): number {
    const today = new Date()
    return Number((differenceInDays(high3Date, today) / 365).toFixed(2))
}

export function calculateHigh3(startDate: Date, yearsOfService: number): number {
    const today = new Date()
    const high3Date = addDays(startDate, yearsOfService * 365.25)
    return Number((differenceInDays(high3Date, today) / 365).toFixed(2))
}

interface PersonnelCount {
    [payGrade: string]: number
}

export function calculateOnHandPersonnel(marines: any[]): PersonnelCount {
    return marines.reduce((acc: PersonnelCount, marine) => {
        const grade = marine.payGrade
        acc[grade] = (acc[grade] || 0) + 1
        return acc
    }, {})
}

export function calculatePercentFill(onHand: number, authorized: number): number {
    if (authorized === 0) return 0
    return Number(((onHand / authorized) * 100).toFixed(1))
}

export function calculateProjectedMOSHealth(
    currentOnHand: number,
    projectedGains: number,
    authorizedTotal: number,
): number {
    if (authorizedTotal === 0) return 0
    return Number((((currentOnHand + projectedGains) / authorizedTotal) * 100).toFixed(1))
}

export function calculateCurrentMOSHealth(onHand: number, authorizedTotal: number): number {
    if (authorizedTotal === 0) return 0
    return Number(((onHand / authorizedTotal) * 100).toFixed(1))
}

export function formatDate(date: Date): string {
    return format(date, "dd-MMM-yy")
}

interface Assignment {
    id: number
    marineId: number
    marine: {
        payGrade: string
        pmos: string
    }
    dctb: Date
    plannedEndDate: Date
}

interface AuthorizedStrength {
    payGrade: string
    pmos: string
    authorized: number
}

export interface ProjectedHealth {
    date: Date
    total: {
        onHand: number
        authorized: number
        percentFill: number
    }
    byPayGrade: {
        [key: string]: {
            onHand: number
            authorized: number
            percentFill: number
        }
    }
}

export function calculateProjectedHealthForDate(
    date: Date,
    assignments: Assignment[],
    authorizedStrength: AuthorizedStrength[],
): ProjectedHealth {
    // Initialize result structure
    const result: ProjectedHealth = {
        date,
        total: {
            onHand: 0,
            authorized: 0,
            percentFill: 0,
        },
        byPayGrade: {},
    }

    // Initialize pay grade buckets
    const payGrades = ["W1", "W2", "W3", "W4", "W5"]
    payGrades.forEach((grade) => {
        result.byPayGrade[grade] = {
            onHand: 0,
            authorized: authorizedStrength.find((a) => a.payGrade === grade)?.authorized || 0,
            percentFill: 0,
        }
    })

    // Count marines assigned on the given date
    assignments.forEach((assignment) => {
        const isAssignedOnDate = isWithinInterval(date, {
            start: new Date(assignment.dctb),
            end: new Date(assignment.plannedEndDate),
        })

        if (isAssignedOnDate) {
            const grade = assignment.marine.payGrade
            if (result.byPayGrade[grade]) {
                result.byPayGrade[grade].onHand++
            }
        }
    })

    // Calculate percentages for each pay grade
    Object.keys(result.byPayGrade).forEach((grade) => {
        const { onHand, authorized } = result.byPayGrade[grade]
        result.byPayGrade[grade].percentFill = calculatePercentFill(onHand, authorized)

        // Add to totals
        result.total.onHand += onHand
        result.total.authorized += authorized
    })

    // Calculate total percentage
    result.total.percentFill = calculatePercentFill(result.total.onHand, result.total.authorized)

    return result
}

export function generateProjections(
    assignments: Assignment[],
    authorizedStrength: AuthorizedStrength[],
    numberOfIntervals = 8, // Default to 4 years (8 six-month intervals)
): ProjectedHealth[] {
    const projections: ProjectedHealth[] = []
    const today = new Date()

    // Generate projections for each 6-month interval
    for (let i = 0; i < numberOfIntervals; i++) {
        const projectionDate = addMonths(today, i * 6)
        const projection = calculateProjectedHealthForDate(projectionDate, assignments, authorizedStrength)
        projections.push(projection)
    }

    return projections
}

// Helper function to format projection dates
export function formatProjectionDate(date: Date): string {
    return format(date, "MMM yyyy")
}

