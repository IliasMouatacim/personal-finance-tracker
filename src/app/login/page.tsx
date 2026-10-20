import LoginForm from "@/components/LoginForm";
import AuthShell from "@/components/AuthShell";
export default function Page() {
  return (
    <AuthShell
      title="Welcome back."
      subtitle="Your next good money move starts here."
    >
      <LoginForm />
    </AuthShell>
  );
}
