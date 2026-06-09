export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#1a251f] mt-auto border-t border-[#2b3c33]">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-25 flex flex-col md:flex-row justify-between items-center gap-4">
        
        <div className="flex flex-col items-center md:items-start">
          <span className="text-gray-300 font-medium tracking-wide">
            Purchase Request Portal
          </span>
          <p className="text-gray-500 text-sm mt-1">
            &copy; {currentYear} All rights reserved.
          </p>
        </div>

        <div className="flex space-x-6">
          <a href="#" className="text-sm text-gray-400 hover:text-[#5db68d] transition-colors">
            Contact Support
          </a>
        </div>

      </div>
    </footer>
  );
}