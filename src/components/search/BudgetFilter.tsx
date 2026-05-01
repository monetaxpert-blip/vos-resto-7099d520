import { Slider } from '@/components/ui/slider';
import { Wallet } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { formatFCFA } from '@/lib/format';

interface BudgetFilterProps {
  /** Current budget max (null = no filter) */
  value: number | null;
  /** Soft slider ceiling (user can also type any amount) */
  sliderMax?: number;
  onChange: (value: number | null) => void;
}

const QUICK = [3000, 5000, 10000, 20000, 50000];

const BudgetFilter = ({ value, sliderMax = 50000, onChange }: BudgetFilterProps) => {
  const sliderValue = Math.min(value ?? 0, sliderMax);
  const active = value !== null && value > 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
          <Wallet size={12} /> Budget max
        </p>
        {active && (
          <button onClick={() => onChange(null)} className="text-[10px] text-primary font-semibold">
            Réinitialiser
          </button>
        )}
      </div>
      <div className="rounded-2xl bg-secondary/60 p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="Ex. 5000"
            value={value ?? ''}
            onChange={(e) => {
              const v = e.target.value;
              if (!v) return onChange(null);
              const n = parseInt(v, 10);
              onChange(isNaN(n) || n <= 0 ? null : n);
            }}
            className="h-10 text-sm font-semibold bg-background"
          />
          <span className="text-xs font-medium text-muted-foreground">FCFA</span>
        </div>

        <Slider
          value={[sliderValue]}
          min={0}
          max={sliderMax}
          step={500}
          onValueChange={(v) => onChange(v[0] === 0 ? null : v[0])}
        />
        <div className="flex items-center justify-between text-[10px] text-muted-foreground font-medium">
          <span>Tous prix</span>
          <span>≥ {formatFCFA(sliderMax)}</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {QUICK.map((amount) => (
            <button
              key={amount}
              onClick={() => onChange(amount)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                value === amount
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-foreground hover:bg-primary/10'
              }`}
            >
              ≤ {formatFCFA(amount)}
            </button>
          ))}
        </div>

        {active && (
          <p className="text-xs font-semibold text-primary">
            Affiche les restos avec un budget moyen ≤ {formatFCFA(value!)}
          </p>
        )}
      </div>
    </div>
  );
};

export default BudgetFilter;
