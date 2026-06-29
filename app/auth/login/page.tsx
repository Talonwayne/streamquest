import { Suspense } from "react";
import { LoginForm } from "@/components/login-form";
import { Skeleton } from "@/components/ui/skeleton";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-4 py-12">
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
