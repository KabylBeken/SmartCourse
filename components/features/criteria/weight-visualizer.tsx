"use client"

import { Card } from "@/components/ui/card"
import type { GradingCriteria } from "@/lib/types"

interface WeightVisualizerProps {
  criteria: GradingCriteria[]
}

export function WeightVisualizer({ criteria }: WeightVisualizerProps) {
  const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0)
  const totalPoints = criteria.reduce((sum, c) => sum + c.max_score, 0)

  const colors = [
    "bg-blue-500",
    "bg-teal-500",
    "bg-purple-500",
    "bg-orange-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-green-500",
  ]

  return (
    <Card className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold">Weight Distribution</h3>
        <div className="text-sm text-muted-foreground">
          Total: {totalPoints} pts | {totalWeight.toFixed(1)}x weight
        </div>
      </div>

      <div className="mb-4 flex h-4 w-full overflow-hidden rounded-full bg-muted">
        {criteria.map((criterion, index) => {
          const percentage = totalWeight > 0 ? (criterion.weight / totalWeight) * 100 : 0
          return (
            <div
              key={criterion.id}
              className={`${colors[index % colors.length]} transition-all`}
              style={{ width: `${percentage}%` }}
              title={`${criterion.name}: ${percentage.toFixed(1)}%`}
            />
          )
        })}
      </div>

      <div className="space-y-2">
        {criteria.map((criterion, index) => {
          const percentage = totalWeight > 0 ? (criterion.weight / totalWeight) * 100 : 0
          return (
            <div key={criterion.id} className="flex items-center gap-3 text-sm">
              <div className={`h-3 w-3 rounded-full ${colors[index % colors.length]}`} />
              <span className="flex-1 truncate">{criterion.name}</span>
              <span className="text-muted-foreground">{percentage.toFixed(1)}%</span>
              <span className="font-medium">{criterion.max_score} pts</span>
            </div>
          )
        })}
      </div>

      {Math.abs(totalWeight - criteria.length) > 0.5 && (
        <div className="mt-4 rounded-md bg-[var(--evaluation-warning)]/10 p-3 text-sm text-[var(--evaluation-warning)]">
          Tip: For balanced grading, total weight ({totalWeight.toFixed(1)}) should be close to the number of criteria (
          {criteria.length}).
        </div>
      )}
    </Card>
  )
}
