import React from "react";
import Link from "next/link";

interface LogoProps {
  variant?: "default" | "white" | "dark";
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
  href?: string;
}

const Logo: React.FC<LogoProps> = ({
  variant = "default",
  size = "md",
  showText = true,
  className = "",
  href = "/",
}) => {
  const sizeConfig = {
    sm: { icon: 24, text: "text-base", container: "h-8" },
    md: { icon: 32, text: "text-xl", container: "h-10" },
    lg: { icon: 40, text: "text-2xl", container: "h-12" },
    xl: { icon: 56, text: "text-4xl", container: "h-16" },
  };

  const colorConfig = {
    default: {
      primary: "#0779FF",
      secondary: "#1399FF",
      text: "#0779FF",
      iconBg: "#E3F2FF",
    },
    white: {
      primary: "#FFFFFF",
      secondary: "#F0F0F0",
      text: "#FFFFFF",
      iconBg: "rgba(255, 255, 255, 0.2)",
    },
    dark: {
      primary: "#1A1A1A",
      secondary: "#333333",
      text: "#1A1A1A",
      iconBg: "#F5F5F5",
    },
  };

  const currentSize = sizeConfig[size];
  const currentColor = colorConfig[variant];
  const iconSize = currentSize.icon;

  const logoContent = (
    <div
      className={`flex items-center gap-2 ${currentSize.container} ${className}`}
    >
      {/* Icon: Warung (Toko) dengan efek modern */}
      <div
        className="relative flex items-center justify-center rounded-lg transition-transform hover:scale-105"
        style={{
          width: iconSize,
          height: iconSize,
          backgroundColor: currentColor.iconBg,
        }}
      >
        <svg
          width={iconSize * 0.7}
          height={iconSize * 0.7}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Atap Warung */}
          <path
            d="M3 10L12 3L21 10V11H3V10Z"
            fill={currentColor.primary}
            opacity="0.9"
          />
          {/* Badan Warung */}
          <path
            d="M5 11H19V21H5V11Z"
            fill={currentColor.secondary}
            opacity="0.8"
          />
          {/* Pintu */}
          <path d="M9 15H11V21H9V15Z" fill={currentColor.iconBg} />
          {/* Jendela Kiri */}
          <path d="M6 13H8V15H6V13Z" fill={currentColor.iconBg} />
          {/* Jendela Kanan */}
          <path d="M16 13H18V15H16V13Z" fill={currentColor.iconBg} />
          {/* Detail Atap (Garis) */}
          <path
            d="M3 10L12 3L21 10"
            stroke={currentColor.primary}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>

      {/* Text Logo */}
      {showText && (
        <div className="flex flex-col leading-tight">
          <span
            className={`font-bold ${currentSize.text} tracking-tight`}
            style={{ color: currentColor.text }}
          >
            Warung<span style={{ color: currentColor.primary }}>pedia</span>
          </span>
          {size === "lg" || size === "xl" ? (
            <span
              className="text-xs font-medium opacity-75"
              style={{ color: currentColor.text }}
            >
              Marketplace Terpercaya
            </span>
          ) : null}
        </div>
      )}
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

export default Logo;
