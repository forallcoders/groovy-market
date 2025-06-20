import React from "react";
import { ButtonHTMLAttributes } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { cva } from "class-variance-authority";

type ButtonVariant = "primary" | "secondary" | "tertiary";

interface GradientButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: React.ReactNode;
}

export function GradientButton({
  variant = 'primary',
  children,
  className,
  ...props
}: GradientButtonProps) {
  const buttonVariants = cva(
    'px-8 py-3 text-xl text-black font-bold rounded-[10px] shadow text-shadow [text-shadow:_1px_1px_white] 3xl:[text-shadow:_3px_3px_white] hover:scale-105 transition-transform duration-300 ease-in-out cursor-pointer',
    {
      variants: {
        variant: {
          primary: 'bg-[#FF3399] hover:bg-[#FF3399]',
          secondary: 'bg-[#FFFF67] hover:bg-[#FFFF67]',
          tertiary: 'bg-[#66CCFF] hover:bg-[#66CCFF]'
        },
      },
      defaultVariants: {
        variant: 'primary'
      },
    }
  );
  return (
    <Button
      className={cn(
        buttonVariants({ variant, className })
      )}
      {...props}
    >
      {children}
    </Button>
  );
}