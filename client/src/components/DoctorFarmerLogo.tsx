import { Link } from "wouter";

export function DoctorFarmerLogo({ className = "h-11 w-auto", clickable = true }: { className?: string; clickable?: boolean }) {
  const content = (
    <svg 
      viewBox="0 0 210 82" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={`${className} cursor-pointer transition-opacity hover:opacity-90`}
      aria-label="Doctor Farmer"
    >
      {/* Иконка-крест: пропорциональные закругленные капсулы */}
      <g transform="translate(2, 4)">
        {/* Вертикальная синяя капсула */}
        <rect x="22" y="0" width="30" height="74" rx="15" fill="#003399" />
        
        {/* Горизонтальная зеленая капсула */}
        <rect x="0" y="22" width="74" height="30" rx="15" fill="#4B9B12" />

        {/* Центральный белый квадрат для пересечения */}
        <rect x="22" y="22" width="30" height="30" fill="#FFFFFF" />
      </g>

      {/* Текст Doctor Farmer */}
      <text x="94" y="34" fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" fontSize="28" fontWeight="700" fill="#4B9B12" letterSpacing="-0.3">
        Doctor
      </text>
      <text x="94" y="67" fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" fontSize="28" fontWeight="700" fill="#003399" letterSpacing="-0.3">
        Farmer
      </text>
    </svg>
  );

  if (!clickable) return content;

  return (
    <Link href="/">
      <div className="inline-flex items-center">{content}</div>
    </Link>
  );
}
