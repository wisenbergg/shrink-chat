// File: src/components/ui/card.tsx
import React from "react"
import { cn } from "@/lib/utils"

type DivProps = React.HTMLAttributes<HTMLDivElement>

// Primary Card container
export const Card = React.forwardRef<HTMLDivElement, DivProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("bg-card text-card-foreground rounded-xl border shadow-sm", className)}
      {...props}
    />
  )
)
Card.displayName = "Card"

// Header slot
export const CardHeader = React.forwardRef<HTMLDivElement, DivProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("px-6 pb-4 border-b", className)} {...props} />
  )
)
CardHeader.displayName = "CardHeader"

// Content slot (now supports ref)
export const CardContent = React.forwardRef<HTMLDivElement, DivProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("px-6 py-4", className)} {...props} />
  )
)
CardContent.displayName = "CardContent"

// Footer slot
export const CardFooter = React.forwardRef<HTMLDivElement, DivProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("px-6 pt-4 border-t", className)} {...props} />
  )
)
CardFooter.displayName = "CardFooter"

// Title element
export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-lg font-semibold", className)} {...props} />
  )
)
CardTitle.displayName = "CardTitle"
