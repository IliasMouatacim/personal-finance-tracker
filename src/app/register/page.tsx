import RegisterForm from "@/components/RegisterForm";
import AuthShell from "@/components/AuthShell";
export default function Page() {
  return (
    <AuthShell
      title="Your fresh start."
      subtitle="A new account. A fresh perspective on your money."
    >
      <RegisterForm />
    </AuthShell>
  );
}
