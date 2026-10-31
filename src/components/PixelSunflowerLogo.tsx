import React from 'react';

interface PixelSunflowerLogoProps {
  className?: string;
}

/**
 * Basic 16x16 pixelated sunflower logo for Loamy.
 * Uses crisp 1x1 pixel coordinates with shapeRendering="crispEdges"
 * for authentic pixel-art geometry at any scale.
 */
export const PixelSunflowerLogo: React.FC<PixelSunflowerLogoProps> = ({
  className = 'w-8 h-8'
}) => {
  return (
    <svg
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      role="img"
      aria-label="Loamy pixelated sunflower logo"
      data-testid="loamy-pixel-sunflower-logo"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer & inner golden-yellow pixel petals */}
      {/* Top petals */}
      <rect x="6" y="1" width="1" height="1" fill="#FACC15" />
      <rect x="7" y="0" width="2" height="2" fill="#FDE047" />
      <rect x="9" y="1" width="1" height="1" fill="#FACC15" />

      {/* Upper-left & upper-right diagonal petals */}
      <rect x="4" y="2" width="2" height="2" fill="#EAB308" />
      <rect x="6" y="2" width="4" height="1" fill="#FACC15" />
      <rect x="10" y="2" width="2" height="2" fill="#EAB308" />

      {/* Left & right horizontal petals */}
      <rect x="2" y="4" width="2" height="2" fill="#FACC15" />
      <rect x="1" y="5" width="2" height="2" fill="#FDE047" />
      <rect x="2" y="7" width="2" height="2" fill="#EAB308" />
      <rect x="3" y="4" width="1" height="4" fill="#FACC15" />

      <rect x="12" y="4" width="2" height="2" fill="#FACC15" />
      <rect x="13" y="5" width="2" height="2" fill="#FDE047" />
      <rect x="12" y="7" width="2" height="2" fill="#EAB308" />
      <rect x="12" y="4" width="1" height="4" fill="#FACC15" />

      {/* Lower-left & lower-right diagonal petals */}
      <rect x="4" y="8" width="2" height="2" fill="#EAB308" />
      <rect x="10" y="8" width="2" height="2" fill="#EAB308" />

      {/* Bottom petals */}
      <rect x="6" y="9" width="4" height="1" fill="#FACC15" />
      <rect x="6" y="10" width="1" height="1" fill="#EAB308" />
      <rect x="7" y="10" width="2" height="2" fill="#FACC15" />
      <rect x="9" y="10" width="1" height="1" fill="#EAB308" />

      {/* Sunflower seed disc center (4x6 core with checkered pixel texture) */}
      <rect x="5" y="4" width="6" height="4" fill="#451A03" />
      <rect x="6" y="3" width="4" height="6" fill="#451A03" />
      {/* Seed highlights */}
      <rect x="6" y="4" width="1" height="1" fill="#92400E" />
      <rect x="8" y="4" width="1" height="1" fill="#78350F" />
      <rect x="7" y="5" width="1" height="1" fill="#92400E" />
      <rect x="9" y="5" width="1" height="1" fill="#92400E" />
      <rect x="6" y="6" width="1" height="1" fill="#78350F" />
      <rect x="8" y="6" width="1" height="1" fill="#92400E" />
      <rect x="7" y="7" width="1" height="1" fill="#78350F" />
      <rect x="9" y="7" width="1" height="1" fill="#78350F" />

      {/* Pixel green stem & leaves */}
      <rect x="7" y="12" width="2" height="4" fill="#15803D" />
      <rect x="7" y="12" width="1" height="4" fill="#16A34A" />
      {/* Left pixel leaf */}
      <rect x="4" y="12" width="2" height="1" fill="#22C55E" />
      <rect x="5" y="13" width="2" height="1" fill="#16A34A" />
      {/* Right pixel leaf */}
      <rect x="10" y="13" width="2" height="1" fill="#22C55E" />
      <rect x="9" y="14" width="2" height="1" fill="#16A34A" />
    </svg>
  );
};

export default PixelSunflowerLogo;
