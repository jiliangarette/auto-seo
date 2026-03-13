import React from "react"
import { cn } from "@/lib/utils"

interface MagicCardProps {
  children?: React.ReactNode
  className?: string
  gradientSize?: number
  gradientFrom?: string
  gradientTo?: string
  gradientColor?: string
  gradientOpacity?: number
  mode?: "gradient" | "orb"
  [key: string]: any
}

export function MagicCard({
  children,
  className,
  ...props
}: MagicCardProps) {
  return (
    <div
      className={cn(
        "group relative isolate overflow-hidden rounded-xl border border-border/50 bg-card transition-shadow duration-300 hover:shadow-lg hover:shadow-primary/5",
        className
      )}
    >
      <div className="relative z-10">{children}</div>
    </div>
  )
}
