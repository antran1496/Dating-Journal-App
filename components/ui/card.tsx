import React, { forwardRef } from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
  hoverable?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', glass = false, hoverable = false, children, ...rest }, ref) => {
    return (
      <div
        ref={ref}
        className={`rounded-[var(--radius-lg)] border border-border bg-surface text-text shadow-[var(--shadow-card)] transition-all duration-250 ease-in-out
          ${glass ? 'bg-white/70 dark:bg-black/40 backdrop-blur-md' : ''}
          ${hoverable ? 'hover:-translate-y-1 hover:shadow-[var(--shadow-elevated)]' : ''}
          ${className}
        `}
        {...rest}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';

export const CardHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = '', ...rest }, ref) => (
    <div ref={ref} className={`flex flex-col space-y-1.5 p-6 ${className}`} {...rest} />
  )
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className = '', ...rest }, ref) => (
    <h3 ref={ref} className={`text-xl font-heading font-semibold leading-none tracking-tight ${className}`} {...rest} />
  )
);
CardTitle.displayName = 'CardTitle';

export const CardBody = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = '', ...rest }, ref) => (
    <div ref={ref} className={`p-6 pt-0 ${className}`} {...rest} />
  )
);
CardBody.displayName = 'CardBody';

export const CardFooter = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = '', ...rest }, ref) => (
    <div ref={ref} className={`flex items-center p-6 pt-0 ${className}`} {...rest} />
  )
);
CardFooter.displayName = 'CardFooter';
