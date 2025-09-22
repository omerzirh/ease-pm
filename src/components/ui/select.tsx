import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const selectVariants = cva(
  'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
  {
    variants: {
      variant: {
        default: '',
        error: 'border-destructive focus-visible:ring-destructive',
      },
      size: {
        sm: 'h-8 px-2 text-xs',
        md: 'h-9 px-3 py-2',
        lg: 'h-10 px-4 py-2',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'>,
    VariantProps<typeof selectVariants> {
  error?: boolean;
  helperText?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, variant, size, error, helperText, children, ...props }, ref) => {
    const selectVariant = error ? 'error' : variant;

    return (
      <div className="space-y-1">
        <select className={cn(selectVariants({ variant: selectVariant, size, className }))} ref={ref} {...props}>
          {children}
        </select>
        {helperText && (
          <p className={cn('text-xs', error ? 'text-destructive' : 'text-muted-foreground')}>{helperText}</p>
        )}
      </div>
    );
  }
);
Select.displayName = 'Select';

export { Select, selectVariants };
