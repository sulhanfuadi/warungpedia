import Logo from "@/components/ui/Logo";
import Link from "next/link";

interface FooterProps {
  /**
   * Variant tampilan footer:
   * - "full": Footer lengkap dengan logo, tagline, dan kontak (untuk halaman publik)
   * - "compact": Footer ringkas dengan logo dan copyright (untuk dashboard)
   * - "minimal": Footer paling sederhana, hanya copyright (untuk halaman modal/form)
   */
  variant?: "full" | "compact" | "minimal";
  /**
   * Tambahkan class tambahan jika diperlukan
   */
  className?: string;
}

export default function Footer({
  variant = "compact",
  className = "",
}: FooterProps) {
  const baseClasses = "bg-[#1a1a1a] border-t border-[#2f2f2f] py-6 px-4";

  // Full variant - untuk halaman publik seperti homepage, product detail
  if (variant === "full") {
    return (
      <footer className={`${baseClasses} py-8 ${className}`}>
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            {/* Left side - Logo & Tagline */}
            <div className="text-center md:text-left">
              <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                <Logo size="sm" variant="white" showText={true} href="/" />
              </div>
              <p className="text-gray-400 text-sm">
                Katalog Produk Marketplace UMKM Indonesia
              </p>
            </div>

            {/* Right side - Copyright & Contact */}
            <div className="text-gray-400 text-sm text-center md:text-right">
              <p>
                © {new Date().getFullYear()} Warungpedia. All rights reserved.
              </p>
              <p className="mt-1">
                Butuh bantuan?{" "}
                <Link
                  href="mailto:support@warungpedia.id"
                  className="text-[#0779FF] hover:underline transition"
                >
                  support@warungpedia.id
                </Link>
              </p>
            </div>
          </div>
        </div>
      </footer>
    );
  }

  // Minimal variant - untuk halaman modal/form seperti login
  if (variant === "minimal") {
    return (
      <footer className={`${baseClasses} py-4 ${className}`}>
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
            <Logo size="sm" variant="white" showText={false} />
            <span>© {new Date().getFullYear()} Warungpedia</span>
          </div>
        </div>
      </footer>
    );
  }

  // Default: Compact variant - untuk dashboard admin & penjual
  return (
    <footer className={`${baseClasses} mt-auto ${className}`}>
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <Logo size="sm" variant="white" showText={true} href="/" />
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} Warungpedia. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
