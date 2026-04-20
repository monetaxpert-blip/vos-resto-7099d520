import { CreditCard } from 'lucide-react';

/** Visual-only payment methods row. NO real payments wired. */
const PaymentMethodsRow = () => {
  return (
    <div className="flex items-center justify-center gap-3 py-3">
      {/* Wave */}
      <div className="h-9 px-3 rounded-lg bg-[#1DC8FF] flex items-center justify-center shadow-sm">
        <span className="text-white font-extrabold tracking-tight text-sm">Wave</span>
      </div>
      {/* Orange Money */}
      <div className="h-9 px-3 rounded-lg bg-black flex items-center gap-1 shadow-sm">
        <span className="w-2.5 h-2.5 rounded-sm bg-[#FF7900]" />
        <span className="text-white font-bold text-xs leading-none">Orange<br/>Money</span>
      </div>
      {/* Visa */}
      <div className="h-9 px-3 rounded-lg bg-white border border-border flex items-center justify-center shadow-sm">
        <span className="text-[#1A1F71] font-extrabold italic tracking-wider text-sm">VISA</span>
      </div>
      {/* Generic card */}
      <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
        <CreditCard size={16} className="text-muted-foreground" />
      </div>
    </div>
  );
};

export default PaymentMethodsRow;
