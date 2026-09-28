import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-xs transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 disabled:pointer-events-none disabled:opacity-50 cursor-pointer shadow-sm',
  {
    variants: {
      variant: {
        default:
          'bg-emerald-600 text-white hover:bg-emerald-500 border border-emerald-500 shadow-md',
        destructive:
          'bg-rose-950 text-rose-200 border border-rose-800 hover:bg-rose-900',
        outline:
          'border border-zinc-700 bg-zinc-950 text-zinc-300 hover:bg-zinc-800 hover:text-white',
        secondary:
          'bg-zinc-800 text-zinc-200 hover:bg-zinc-700 border border-zinc-700',
        ghost:
          'hover:bg-zinc-800 hover:text-zinc-100 text-zinc-400',
        link:
          'text-cyan-400 underline-offset-4 hover:underline',
        cyan:
          'bg-cyan-600 text-white hover:bg-cyan-500 border border-cyan-500 shadow-md',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-lg px-6 text-sm',
        icon: 'h-9 w-9 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
