import { VariantProps } from "class-variance-authority";
import { buttonVariants } from "./Button.variants";

export type ButtonVariants = VariantProps<typeof buttonVariants>;

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  ButtonVariants {
  asChild?: boolean;
}