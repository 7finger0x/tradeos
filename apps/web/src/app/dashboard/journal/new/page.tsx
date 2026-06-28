import { TradeForm } from "@/components/journal/trade-form";
import Link from "next/link";

export default function NewTradePage() {
  return (
    <>
      <div className="page-header">
        <h1>Log trade</h1>
        <Link href="/dashboard/journal" className="muted">
          ← Back
        </Link>
      </div>
      <TradeForm />
    </>
  );
}
