import { getPointStatus } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PointBadgeProps {
  points: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function PointBadge({ points, className, size = 'md' }: PointBadgeProps) {
  const statusInfo = getPointStatus(points);
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2 font-bold',
  };

  return (
    <Badge 
      variant="outline" 
      className={cn(
        statusInfo.bgColor, 
        statusInfo.textColor,
        'border-transparent font-medium shadow-sm whitespace-nowrap',
        statusInfo.status === 'critical' ? 'animate-pulse ring-2 ring-red-500' : '',
        sizeClasses[size],
        className
      )}
    >
      {points} Poin - {statusInfo.label}
    </Badge>
  );
}
