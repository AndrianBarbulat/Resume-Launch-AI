export default function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-col items-center gap-1">
          <span className="text-white font-bold text-lg tracking-tight">
            ResuLaunch<span className="text-indigo-400">AI</span>
          </span>
          <p className="text-slate-500 text-xs">
            Built with Next.js, Firebase &amp; Gemini AI
          </p>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-800 text-center space-y-2">
          <p className="text-slate-500 text-xs">
            Built by{" "}
            <a
              href="https://github.com/AndrianBarbulat"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-white transition-colors"
            >
              Andrian Barbulat
            </a>{" "}
            as a portfolio project.{" "}
            <a
              href="https://github.com/AndrianBarbulat/resume-launch-ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-white transition-colors"
            >
              View on GitHub
            </a>
          </p>
          <p className="text-slate-600 text-xs">
            Created to explore AI capabilities and demonstrate my skills through a real-world application.
            All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
