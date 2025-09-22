import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const labelVariants = cva(
  'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
  {
    variants: {
      variant: {
        default: 'text-foreground',
        error: 'text-destructive',
        muted: 'text-muted-foreground',
      },
      size: {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement>, VariantProps<typeof labelVariants> {
  required?: boolean;
  children: React.ReactNode;
}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, variant, size, required, children, ...props }, ref) => {
    return (
      <label ref={ref} className={cn(labelVariants({ variant, size }), 'block mb-1', className)} {...props}>
        {children}
        {required && (
          <span className="text-destructive ml-1" aria-label="required" title="This field is required">
            *
          </span>
        )}
      </label>
    );
  }
);
Label.displayName = 'Label';

export { Label, labelVariants };
