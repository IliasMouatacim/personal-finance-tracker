import RegisterForm from '@/components/RegisterForm';

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-500/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-400/20 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md space-y-8 glass-panel p-10 relative z-10 animate-fade-in-up">
        <div>
          <h2 className="mt-2 text-center text-4xl font-extrabold text-gray-900 tracking-tight">
            Create an account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 font-medium">
            Join today to start tracking your financial journey.
          </p>
        </div>
        <RegisterForm />
      </div>
    </div>
  );
}
