import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const checkboxVariants = cva(
  'peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground transition-colors',
  {
    variants: {
      variant: {
        default: '',
        error: 'border-destructive focus-visible:ring-destructive data-[state=checked]:bg-destructive',
      },
      size: {
        sm: 'h-3 w-3',
        md: 'h-4 w-4',
        lg: 'h-5 w-5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'>,
    VariantProps<typeof checkboxVariants> {
  error?: boolean;
  indeterminate?: boolean;
  label?: string;
  helperText?: string;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, variant, size, error, indeterminate, label, helperText, checked, id, ...props }, ref) => {
    const checkboxRef = React.useRef<HTMLInputElement>(null);
    const generatedId = React.useId();
    const inputId = id || generatedId;

    // Handle indeterminate state
    React.useEffect(() => {
      const checkbox = checkboxRef.current;
      if (checkbox) {
        checkbox.indeterminate = !!indeterminate;
      }
    }, [indeterminate]);

    // Determine the data-state for styling
    const dataState = indeterminate ? 'indeterminate' : checked ? 'checked' : 'unchecked';

    const checkboxVariant = error ? 'error' : variant;

    const CheckboxInput = (
      <div className="relative">
        <input
          type="checkbox"
          ref={node => {
            if (checkboxRef.current !== node) {
              (checkboxRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
            }
            if (typeof ref === 'function') {
              ref(node);
            } else if (ref) {
              (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
            }
          }}
          id={inputId}
          className={cn(
            checkboxVariants({ variant: checkboxVariant, size }),
            'absolute inset-0 opacity-0 cursor-pointer',
            className
          )}
          data-state={dataState}
          checked={checked}
          onKeyDown={e => {
            if (e.key === ' ' || e.key === 'Enter') {
              e.preventDefault();
              if (!props.disabled) {
                e.currentTarget.click();
              }
            }
            props.onKeyDown?.(e);
          }}
          {...props}
        />
        <div
          className={cn(
            checkboxVariants({ variant: checkboxVariant, size }),
            'flex items-center justify-center cursor-pointer',
            checked && 'bg-primary text-primary-foreground',
            indeterminate && 'bg-primary text-primary-foreground',
            error && checked && 'bg-destructive text-destructive-foreground',
            error && indeterminate && 'bg-destructive text-destructive-foreground',
            props.disabled && 'cursor-not-allowed'
          )}
          onClick={e => {
            if (!props.disabled) {
              e.preventDefault();
              e.stopPropagation();
              const checkbox = checkboxRef.current;
              if (checkbox) {
                checkbox.click();
                checkbox.focus();
              }
            }
          }}
        >
          {checked && !indeterminate && (
            <svg className="h-3 w-3 fill-current" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
              <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
            </svg>
          )}
          {indeterminate && (
            <svg className="h-3 w-3 fill-current" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8z" />
            </svg>
          )}
        </div>
      </div>
    );

    if (label) {
      return (
        <div className="space-y-1">
          <label
            htmlFor={inputId}
            className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            {CheckboxInput}
            <span>{label}</span>
          </label>
          {helperText && (
            <p className={cn('text-xs ml-6', error ? 'text-destructive' : 'text-muted-foreground')}>{helperText}</p>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-1">
        {CheckboxInput}
        {helperText && (
          <p className={cn('text-xs', error ? 'text-destructive' : 'text-muted-foreground')}>{helperText}</p>
        )}
      </div>
    );
  }
);
Checkbox.displayName = 'Checkbox';

export { Checkbox, checkboxVariants };
