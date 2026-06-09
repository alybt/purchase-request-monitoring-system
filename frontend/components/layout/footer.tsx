export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-secondary mt-auto border-t border-gray-800">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
        
        <div className="flex flex-col items-center md:items-start">
          <span className="text-white font-semibold tracking-wide">
            Purchase Request Portal
          </span>
          <p className="text-gray-400 text-sm mt-1">
            &copy; {currentYear} All rights reserved.
          </p>
        </div>

        <div className="flex space-x-6">
          <a href="#" className="text-sm text-gray-400 hover:text-accent transition-colors">
            Contact Support
          </a>
        </div>

      </div>
    </footer>
  );
}