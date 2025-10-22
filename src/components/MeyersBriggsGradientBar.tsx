interface MeyersBriggsGradientBarProps {
  leftLabel: string;
  rightLabel: string;
  percentage: number;
  leftColor: string;
  rightColor: string;
}

export function MeyersBriggsGradientBar({
  leftLabel,
  rightLabel,
  percentage,
  leftColor,
  rightColor,
}: MeyersBriggsGradientBarProps) {
  const leftPercentage = 100 - percentage;
  const rightPercentage = percentage;

  return (
    <div className="space-y-3">
      {/* Labels with percentages */}
      <div className="flex items-center justify-between text-sm font-medium">
        <div className="flex items-center gap-2">
          <span>{leftLabel}</span>
          <span className="text-muted-foreground">{leftPercentage}%</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{rightPercentage}%</span>
          <span>{rightLabel}</span>
        </div>
      </div>
      
      {/* Gradient bar */}
      <div className="relative h-3 rounded-full overflow-hidden border border-border/50">
        <div 
          className="absolute inset-0 flex"
          style={{
            background: `linear-gradient(to right, ${leftColor} 0%, ${leftColor} ${leftPercentage}%, ${rightColor} ${leftPercentage}%, ${rightColor} 100%)`
          }}
        />
      </div>
    </div>
  );
}
