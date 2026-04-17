import { Slider } from '@/components/ui/slider';
import { formatFCFA } from '@/lib/format';

interface BudgetFilterProps {
  min: number;
  max: number;
  bounds: [number, number];
  onChange: (range: [number, number]) => void;
}

const BudgetFilter = ({ min, max, bounds, onChange }: BudgetFilterProps) => {
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
        Budget
      </p>
      <div className="rounded-2xl bg-secondary/60 p-4">
        <div className="flex items-baseline justify-between mb-3">
          <span className="text-sm font-semibold text-foreground">
            Entre {formatFCFA(min)} et {formatFCFA(max)}
          </span>
        </div>
        <Slider
          value={[min, max]}
          min={bounds[0]}
          max={bounds[1]}
          step={500}
          minStepsBetweenThumbs={1}
          onValueChange={(v) => onChange([v[0], v[1]] as [number, number])}
          className="mt-1"
        />
        <div className="flex justify-between mt-2 text-[10px] text-muted-foreground font-medium">
          <span>{formatFCFA(bounds[0])}</span>
          <span>{formatFCFA(bounds[1])}</span>
        </div>
      </div>
    </div>
  );
};

export default BudgetFilter;
