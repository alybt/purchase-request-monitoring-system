import LoginForm from "./LoginForm";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

export default function LoginPage() {
  return (
    <div className="relative flex flex-col min-h-screen">
      
      {/* Absolute Background Image & Green Filter */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/bg.jpg')" }}
      >
        {/* Dark green overlay utilizing your palette's Primary Shade */}
        <div className="absolute inset-0 bg-[#1a251f]/50 backdrop-blur-sm"></div>
      </div>

      {/* Main Content Wrapper (z-10 keeps it above the background) */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />
        
        <div className="flex-grow flex flex-col items-center justify-center px-4 py-12">
         <div className="w-full max-w-4xl bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
            
            {/* Left Column: Colored Branding Section */}
            <div className="w-full md:w-1/2 p-10 lg:p-14 flex flex-col items-center justify-center bg-gradient-to-br from-[#1a251f] to-[#2c6548] relative">
              
              <div className="text-center z-10">
                {/* Semi-transparent container for the logo */}
                <div className="inline-block p-4 rounded-full bg-white/10 border border-white/20 mb-6 shadow-sm backdrop-blur-sm">
                  
                  {/* Logo icon utilizing the Comp HL (Gold) */}
                  <div className="w-12 h-12 rounded-xl bg-[#e0a843] shadow-md flex items-center justify-center">
                     <svg className="w-7 h-7 text-[#1a251f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                     </svg>
                  </div>
                </div>
                
                <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-white mb-3">
                  Portal Login
                </h1>
                
                {/* Accent Color (Light Green) used for the subtitle text */}
                <p className="text-sm lg:text-base text-[#5db68d] font-medium">
                  Purchase Request Monitoring System
                </p>
              </div>
            </div>

            {/* Right Column: Form Section */}
            <div className="w-full md:w-1/2 p-10 lg:p-14 flex flex-col justify-center bg-white relative">
              {/* Primary green top accent for continuity on the right side */}
              <div className="absolute top-0 left-0 w-full h-1.5 bg-[#3b825e] hidden md:block"></div>
              
              <LoginForm />
            </div>

          </div>
        </div>
        
        <Footer />
      </div>
    </div>
  );
}