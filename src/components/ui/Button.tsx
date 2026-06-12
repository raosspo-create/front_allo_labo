import {
  forwardRef,
  type ButtonHTMLAttributes,
} from 'react';

const variants = {
  primary:
    'bg-teal-600 text-white shadow-sm shadow-teal-900/10 hover:bg-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:opacity-50',
  secondary:
    'border border-slate-300 bg-white text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-50',
} as const;

export type ButtonVariant = keyof typeof variants;

export const buttonBaseClass =
  'inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition';

export function buttonClassName(variant: ButtonVariant = 'primary'): string {
  return `${buttonBaseClass} ${variants[variant]}`;
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export const Button = forwardRef<HTMLButtonElement, Props>(
  ({ className = '', variant = 'primary', type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={`${buttonClassName(variant)} ${className}`.trim()}
      {...props}
    />
  ),
);
Button.displayName = 'Button';
