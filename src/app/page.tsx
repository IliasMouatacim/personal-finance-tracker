import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-white px-4">
      <div className="text-center max-w-2xl">
        <div className="text-6xl mb-6">💰</div>
        <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">
          Personal Finance Tracker
        </h1>
        <p className="mt-6 text-lg leading-8 text-gray-600">
          Take control of your money. Track income and expenses, visualize your spending habits with real-time charts, and export your data anytime.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/register"
            className="rounded-lg bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Get Started — It&apos;s Free
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-gray-300 px-6 py-3 text-base font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Sign In
          </Link>
        </div>
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
          {[
            { icon: '🔐', title: 'Secure Auth', desc: 'JWT-based authentication keeps your data private.' },
            { icon: '📊', title: 'Live Charts', desc: 'Pie and bar charts update instantly as you add transactions.' },
            { icon: '⬇', title: 'CSV Export', desc: 'Download your full transaction history as a CSV file.' },
          ].map((f) => (
            <div key={f.title} className="rounded-xl bg-white border border-gray-200 shadow-sm p-5">
              <div className="text-3xl mb-2">{f.icon}</div>
              <h3 className="font-semibold text-gray-900">{f.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

