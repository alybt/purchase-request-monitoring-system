import LoginForm from "./LoginForm";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

export default function LoginPage() {
  return (
    <>
      <Header />
      {/* Main background remains a deep, professional green gradient */}
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-800 via-emerald-700 to-teal-900 px-4">
        
        {/* Clean, minimalistic white card for high contrast */}
        <div className="w-full max-w-md bg-white text-gray-900 p-10 rounded-2xl shadow-2xl relative overflow-hidden">
          
          {/* Subtle top accent bar updated to yellow */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-yellow-400 to-yellow-500"></div>

          {/* Header Section */}
          <div className="text-center mb-8 mt-2">
            <div className="inline-block p-3 rounded-full bg-yellow-50 border border-yellow-100 mb-4">
              {/* Logo placeholder utilizing the new yellow accent */}
              <div className="w-8 h-8 rounded bg-gradient-to-tr from-yellow-400 to-yellow-500 shadow-sm"></div>
            </div>
            <h1 className="text-3xl font-bold tracking-wide text-gray-900">
              Portal Login
            </h1>
            <p className="text-sm text-gray-500 mt-2">
              Purchase Request Monitoring System
            </p>
          </div>

          <LoginForm />
        </div>
      </div>
      <Footer />
    </>
  );
}