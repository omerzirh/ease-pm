import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const textareaVariants = cva(
  "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
  {
    variants: {
      variant: {
        default: "",
        error: "border-destructive focus-visible:ring-destructive",
      },
      resize: {
        none: "resize-none",
        vertical: "resize-y",
        horizontal: "resize-x",
        both: "resize",
      },
    },
    defaultVariants: {
      variant: "default",
      resize: "vertical",
    },
  }
)

export interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "resize">,
    VariantProps<typeof textareaVariants> {
  error?: boolean
  helperText?: string
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant, resize, error, helperText, ...props }, ref) => {
    const textareaVariant = error ? "error" : variant

    return (
      <div className="space-y-1">
        <textarea
          className={cn(textareaVariants({ variant: textareaVariant, resize, className }))}
          ref={ref}
          {...props}
        />
        {helperText && (
          <p
            className={cn(
              "text-xs",
              error ? "text-destructive" : "text-muted-foreground"
            )}
          >
            {helperText}
          </p>
        )}
      </div>
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea, textareaVariants }