import React from "react";

const StackedLogoLockup: React.FC = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 120 80"
      className="w-24 h-16 sm:w-28 sm:h-20 hover:scale-105 transition-transform duration-300"
    >
      <g>
        <g transform="translate(36,8)">
          <image width="48" height="48" href="/Asset-6.svg" />
        </g>
        <g transform="translate(0,60)">
          <text
            x="60"
            y="18"
            textAnchor="middle"
            fontFamily="'Apfel Grotezk', -apple-system, BlinkMacSystemFont, sans-serif"
            fontWeight="500"
            fontSize="18"
            fill="#1976d2"
          >
            whenIwas
          </text>
        </g>
      </g>
    </svg>
  );
};

export default StackedLogoLockup;
