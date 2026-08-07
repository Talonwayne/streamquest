import { Suspense } from "react";
import { NewRequestForm } from "@/components/new-request-form";

export default function NewRequestPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <Suspense fallback={<p className="text-zinc-500">Loading form…</p>}>
        <NewRequestForm />
      </Suspense>
    </div>
  );
}
