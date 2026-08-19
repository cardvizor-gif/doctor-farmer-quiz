export function DoctorFarmerLogo({ className = "h-10 w-auto" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 349 135" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
      aria-label="Doctor Farmer"
    >
      {/* Иконка-крест: вертикальная капсула (синяя), горизонтальная капсула (зеленая), центральный белый квадрат */}
      <g transform="translate(8, 8)">
        {/* Вертикальная синяя капсула */}
        <rect x="28" y="0" width="38" height="115" rx="19" fill="#003399" />
        
        {/* Горизонтальная зеленая капсула */}
        <rect x="0" y="38" width="115" height="38" rx="19" fill="#4B9B12" />

        {/* Центральный белый квадрат для пересечения */}
        <rect x="28" y="38" width="38" height="38" fill="#FFFFFF" />
      </g>

      {/* Текст Doctor Farmer */}
      <text x="142" y="55" fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" fontSize="44" fontWeight="700" fill="#4B9B12" letterSpacing="-0.5">
        Doctor
      </text>
      <text x="142" y="105" fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" fontSize="44" fontWeight="700" fill="#003399" letterSpacing="-0.5">
        Farmer
      </text>
    </svg>
  );
}
