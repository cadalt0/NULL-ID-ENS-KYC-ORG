'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export default function VerifiedPage() {
  const router = useRouter();

  const handleBackToHome = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex flex-col items-center justify-center p-4">
      {/* Success Animation */}
      <div className="text-center mb-8">
        <div className="w-24 h-24 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center animate-pulse">
          <svg 
            className="w-12 h-12 text-green-600" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={3} 
              d="M5 13l4 4L19 7" 
            />
          </svg>
        </div>
        
        <h1 className="text-4xl font-bold text-green-600 mb-4 animate-bounce">
          🎉 Identity Verified!
        </h1>
        
        <p className="text-xl text-gray-700 mb-2">
          Welcome to the Human Club!
        </p>
        
        <p className="text-gray-600 mb-8">
          You have successfully proven you are human using Self Protocol
        </p>
      </div>

      {/* Verification Details */}
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 text-center">
          ✅ Verification Complete
        </h2>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-gray-600">Status:</span>
            <span className="text-green-600 font-semibold">Verified Human</span>
          </div>
          
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-gray-600">Age Check:</span>
            <span className="text-green-600 font-semibold">18+ Confirmed</span>
          </div>
          
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-gray-600">Privacy:</span>
            <span className="text-blue-600 font-semibold">Zero-Knowledge</span>
          </div>
          
          <div className="flex justify-between items-center py-2">
            <span className="text-gray-600">Verified At:</span>
            <span className="text-gray-800 font-mono text-sm">
              {new Date().toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
        <button
          onClick={handleBackToHome}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
        >
          🏠 Back to Home
        </button>
        
        <button
          onClick={() => window.location.reload()}
          className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
        >
          🔄 Verify Again
        </button>
      </div>

      {/* Additional Info */}
      <div className="mt-8 text-center text-sm text-gray-500 max-w-md">
        <p>
          Your identity verification is complete and your privacy is protected. 
          No personal data was stored during this process.
        </p>
      </div>
    </div>
  );
}
