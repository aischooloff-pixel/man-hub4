import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Logo({ className, size = 'md' }: LogoProps) {
  const sizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="relative flex h-8 w-8 items-center justify-center">
        <div className="absolute inset-0 rounded-lg bg-foreground" />
        <span className="relative z-10 font-heading text-sm font-bold text-background">
          M
        </span>
      </div>
      <span className={cn('font-heading font-semibold tracking-tight', sizes[size])}>
        ManHub
      </span>
    </div>
  );
}
