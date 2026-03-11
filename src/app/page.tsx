import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 relative overflow-hidden">
      
      {/* Decorative background blur blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-blue-400/20 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-indigo-500/20 blur-[100px] pointer-events-none" />

      <div className="text-center max-w-4xl glass-panel p-12 md:p-16 animate-fade-in-up md:mt-10 relative z-10 w-full mx-4">
        <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl mb-8 shadow-lg transform transition hover:scale-105">
          <span className="text-5xl">💰</span>
        </div>
        
        <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 sm:text-7xl mb-6 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
          Personal Finance Tracker
        </h1>
        
        <p className="mt-6 text-xl leading-8 text-gray-700 max-w-2xl mx-auto font-medium">
          Take absolute control of your money. Track income, monitor expenses, and visualize your financial health with beautiful, real-time analytics.
        </p>
        
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6">
          <Link
            href="/register"
            className="rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-8 py-4 text-lg font-bold text-white shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Get Started — It&apos;s Free
          </Link>
          <Link
            href="/login"
            className="rounded-xl border-2 border-indigo-100 bg-white/50 backdrop-blur-sm px-8 py-4 text-lg font-bold text-indigo-700 hover:bg-white/80 hover:-translate-y-1 transition-all duration-300"
          >
            Sign In
          </Link>
        </div>
        
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          {[
            { icon: '🔐', title: 'Bank-grade Security', desc: 'Secure JWT authentication ensures your financial data stays completely private.' },
            { icon: '📈', title: 'Dynamic Analytics', desc: 'Interactive charts update instantly as you log new transactions.' },
            { icon: '⬇️', title: 'Seamless Exporting', desc: 'Download your full financial history as a CSV file with one click.' },
          ].map((f, i) => (
            <div 
              key={f.title} 
              className="rounded-2xl bg-white/60 backdrop-blur-md border border-white/40 shadow-xl p-8 hover:bg-white/80 transition-colors duration-300 hover:-translate-y-1"
              style={{ animationDelay: `${i * 150}ms` }}
            >
              <div className="text-4xl mb-4 bg-gradient-to-br from-indigo-100 to-blue-50 w-16 h-16 rounded-xl flex items-center justify-center shadow-sm border border-indigo-50/50">{f.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-base text-gray-600 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

