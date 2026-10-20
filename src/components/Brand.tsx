import Link from "next/link";
import Starburst from "@/components/Starburst";
export default function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link
      href="/"
      className={`brand ${inverse ? "brand-inverse" : ""}`}
      aria-label="Ledger home"
    >
      <span className="brand-icon" aria-hidden="true">
        <Starburst />
      </span>
      ledger
    </Link>
  );
}
