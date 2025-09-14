import React, { useState } from "react";
import NavBar from "./NavBar";
import lp_11 from "./lp_11.png";
import lp_10 from "./lp_10.png";
import lp_12 from "./lp_12.png";

function LandingPage() {
  const [activeImage, setActiveImage] = useState(0);
  const images = [lp_10, lp_12, lp_11];
  const imageAlts = [
    "Healthcare technology",
    "Blockchain security",
    "Medical records"
  ];

  // Auto-rotate images
  React.useEffect(() => {
    const interval = setInterval(() => {
      setActiveImage((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div className="min-h-screen bg-white">
      <NavBar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 mb-16">
          <div className="lg:w-1/2">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Revolutionizing Healthcare with <span className="text-blue-600">Blockchain Technology</span>
            </h1>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              Our Secure Electronic Health Records (EHR) application transforms healthcare data management 
              through blockchain technology, ensuring security, transparency, and seamless interoperability.
            </p>
            <div className="flex flex-wrap gap-4">
              <button className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-md">
                Get Started
              </button>
              <button className="px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors">
                Learn More
              </button>
            </div>
          </div>
          
          <div className="lg:w-1/2 relative">
            <div className="relative h-80 w-full rounded-xl overflow-hidden shadow-lg">
              {images.map((img, index) => (
                <img
                  key={index}
                  src={img}
                  alt={imageAlts[index]}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
                    index === activeImage ? "opacity-100" : "opacity-0"
                  }`}
                />
              ))}
            </div>
            
            {/* Image selector dots */}
            <div className="flex justify-center mt-4 space-x-2">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveImage(index)}
                  className={`w-3 h-3 rounded-full ${
                    index === activeImage ? "bg-blue-600" : "bg-gray-300"
                  }`}
                  aria-label={`View image ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-blue-50 p-6 rounded-lg">
            <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Secure Data Storage</h3>
            <p className="text-gray-600">
              Blockchain technology ensures your health records are encrypted, immutable, and protected from unauthorized access.
            </p>
          </div>
          
          <div className="bg-green-50 p-6 rounded-lg">
            <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Seamless Interoperability</h3>
            <p className="text-gray-600">
              Our system enables healthcare providers to securely access and share records, improving care coordination.
            </p>
          </div>
          
          <div className="bg-purple-50 p-6 rounded-lg">
            <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"></path>
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Patient Empowerment</h3>
            <p className="text-gray-600">
              Patients have full control over their health data and can grant access to providers as needed.
            </p>
          </div>
        </div>

        {/* Detailed Description */}
        <div className="bg-gray-50 rounded-xl p-8 mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Transforming Healthcare Data Management</h2>
          <p className="text-gray-700 leading-relaxed text-lg mb-6">
            Our Secure Electronic Health Records (EHR) application is revolutionizing healthcare data management 
            by leveraging blockchain technology to ensure secure and transparent data storage. The platform integrates 
            tools like Ganache for efficient development, Metamask for seamless blockchain interaction, and IPFS for 
            decentralized file storage.
          </p>
          <p className="text-gray-700 leading-relaxed text-lg">
            This innovative system prioritizes security, accessibility, and trust while enabling seamless data 
            interoperability between healthcare providers. By adopting this solution, we aim to transform healthcare 
            data management, leading to improved patient outcomes and more efficient healthcare services.
          </p>
        </div>

        {/* Technology Stack */}
        <div className="text-center mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Powered By Cutting-Edge Technology</h2>
          <div className="flex flex-wrap justify-center gap-8">
            <div className="flex flex-col items-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mb-3">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-700">Blockchain</span>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mb-3">
                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-700">IPFS</span>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mb-3">
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-700">Ganache</span>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mb-3">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 极 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-700">MetaMask</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      {/* <footer className="bg-gray-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <h3 className="text-xl font-bold">Secure EHR Platform</h3>
              <p className="text-gray-400 mt-2">Revolutionizing healthcare with blockchain technology</p>
            </div>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Contact Us</a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-700 text-center text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} Secure EHR Platform. All rights reserved.
          </div>
        </div>
      </footer> */}
    </div>
  );
}

export default LandingPage;