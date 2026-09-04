import { useId } from "react";
import { Link } from "wouter";

type DoctorFarmerLogoProps = {
  className?: string;
  clickable?: boolean;
  monochrome?: boolean;
};

export const monochromeLogoGeometry = {
  icon: { x: 2, y: 4, width: 74, height: 74 },
  cutout: { x: 24, y: 26, width: 30, height: 30 },
} as const;

export function DoctorFarmerLogo({ className = "h-11 w-auto", clickable = true, monochrome = false }: DoctorFarmerLogoProps) {
  const primaryColor = monochrome ? "#F1F4EA" : "#4B9B12";
  const secondaryColor = monochrome ? "#F1F4EA" : "#003399";
  const maskId = `doctor-farmer-logo-mask-${useId().replace(/:/g, "")}`;
  const content = (
    <svg
      viewBox="0 0 210 82"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} cursor-pointer transition-opacity hover:opacity-90`}
      aria-label="Doctor Farmer"
      role="img"
    >
      {monochrome && (
        <defs>
          <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="80" height="82">
            <rect x="0" y="0" width="80" height="82" fill="white" />
            <rect x={monochromeLogoGeometry.cutout.x} y={monochromeLogoGeometry.cutout.y} width={monochromeLogoGeometry.cutout.width} height={monochromeLogoGeometry.cutout.height} fill="black" />
          </mask>
        </defs>
      )}
      <g mask={monochrome ? `url(#${maskId})` : undefined}>
        <rect x="24" y="4" width="30" height="74" rx="15" fill={secondaryColor} />
        <rect x="2" y="26" width="74" height="30" rx="15" fill={primaryColor} />
      </g>
      {!monochrome && <rect x="24" y="26" width="30" height="30" fill="#FFFFFF" />}
      <text x="94" y="34" fontFamily="'Plus Jakarta Sans', 'DM Sans', system-ui, sans-serif" fontSize="28" fontWeight="700" fill={primaryColor} letterSpacing="-0.7">
        Doctor
      </text>
      <text x="94" y="67" fontFamily="'Plus Jakarta Sans', 'DM Sans', system-ui, sans-serif" fontSize="28" fontWeight="700" fill={secondaryColor} letterSpacing="-0.7">
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
