import React from "react";
import Link from "next/link";

interface LogoMinimalProps {
  variant?: "default" | "white" | "dark";
  size?: number;
  className?: string;
  href?: string;
}

const LogoMinimal: React.FC<LogoMinimalProps> = ({
  variant = "default",
  size = 40,
  className = "",
  href = "/",
}) => {
  const colorConfig = {
    default: {
      primary: "#0779FF",
      secondary: "#1399FF",
      bg: "#E3F2FF",
    },
    white: {
      primary: "#FFFFFF",
      secondary: "#F0F0F0",
      bg: "rgba(255, 255, 255, 0.2)",
    },
    dark: {
      primary: "#1A1A1A",
      secondary: "#333333",
      bg: "#F5F5F5",
    },
  };

  const currentColor = colorConfig[variant];

  const logoContent = (
    <div
      className={`relative flex items-center justify-center rounded-xl shadow-md transition-transform hover:scale-105 ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: currentColor.bg,
      }}
    >
      <svg
        width={size * 0.65}
        height={size * 0.65}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* W + P (Warungpedia Initial) */}
        <path
          d="M4 5L7 18L10 10L13 18L16 5"
          stroke={currentColor.primary}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M18 5V12H20C21 12 22 11 22 10V7C22 6 21 5 20 5H18Z"
          fill={currentColor.secondary}
        />
        <path
          d="M18 13V18"
          stroke={currentColor.primary}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-block">
        {logoContent}
      </Link>
    );
  }

  return logoContent;
};

export default LogoMinimal;
