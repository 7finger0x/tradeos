import { Suspense } from "react";
import LoginForm from "./login-form";

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="page login-page"><p className="muted">Loading…</p></main>}>
      <LoginForm />
    </Suspense>
  );
}
