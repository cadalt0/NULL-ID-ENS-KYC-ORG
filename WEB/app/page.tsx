'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import VerificationPage from '../src/components/RealSelfVerification';

export default function Home() {
  const router = useRouter();
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [selfUserData, setSelfUserData] = useState<any>(null);

  useEffect(() => {
    // Load self user-defined data from localStorage
    const storedData = localStorage.getItem('selfUserDefinedData');
    if (storedData) {
      try {
        setSelfUserData(JSON.parse(storedData));
      } catch (err) {
        console.error('Failed to parse self user data:', err);
      }
    }
  }, []);

  const handleSuccessfulVerification = () => {
    console.log('✅ Human verification successful!');
    setIsVerified(true);
    setVerificationError(null);
    
    // Redirect to success page after 1.5 seconds (like workshop)
    setTimeout(() => {
      router.push('/verified');
    }, 1500);
  };

  const handleVerificationError = (error: any) => {
    console.error('❌ Human verification failed:', error);
    setVerificationError('Human verification failed. Please try again.');
  };

  if (isVerified) {
    return (
      <div className="verification-container">
        <div className="verified-content">
          <h1 className="verified-title">🎉 Human Verification Complete!</h1>
          <p className="verified-message">
            You have successfully verified that you are human. Welcome to the platform!
          </p>
          <div className="app-info">
            <h3>✅ Human Verification Results</h3>
            <p>• Human identity confirmed</p>
            <p>• Age verified (18+)</p>
            <p>• Security checks passed</p>
            <p>• Privacy preserved with zero-knowledge proofs</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="verification-container">
      <div className="verification-header">
        <h1 className="verification-title">🤖 Verify You Are Human</h1>
        <p className="verification-subtitle">Anti-Bot Protection</p>
        <p className="verification-description">
          Prove you are human by verifying your age (18+) with a government-issued document. 
          This helps us prevent bots and ensure a safe environment for real users.
        </p>
      </div>

      {verificationError && (
        <div className="error">
          <h3>Verification Error</h3>
          <p>{verificationError}</p>
        </div>
      )}

      <div className="qr-section">
        <h2 className="qr-title">📱 Scan QR Code to Verify Humanity</h2>
        <p className="qr-description">
          Use the Self app to scan this QR code and prove you are human
        </p>
        
        <VerificationPage 
          onSuccess={handleSuccessfulVerification}
          onError={handleVerificationError}
        />
      </div>

      <div className="instructions">
        <h3>How to Prove You Are Human:</h3>
        <div className="instruction-step">
          <div className="step-number">1</div>
          <span>Download the Self app on your phone</span>
        </div>
        <div className="instruction-step">
          <div className="step-number">2</div>
          <span>Open the Self app and scan the QR code above</span>
        </div>
        <div className="instruction-step">
          <div className="step-number">3</div>
          <span>Scan your passport or ID card with your phone's NFC</span>
        </div>
        <div className="instruction-step">
          <div className="step-number">4</div>
          <span>Your humanity will be verified while preserving your privacy</span>
        </div>
      </div>

      <div className="app-info">
        <h3>🛡️ Why Human Verification?</h3>
        <p>• Prevents bot attacks and spam</p>
        <p>• Ensures fair access for real users</p>
        <p>• Protects against automated abuse</p>
        <p>• Maintains platform integrity</p>
      </div>

      <div className="app-info">
        <h3>🔒 Privacy Protection</h3>
        <p>• Only verifies you are human (18+)</p>
        <p>• No personal data is stored</p>
        <p>• Zero-knowledge proofs protect your privacy</p>
        <p>• You control what information is shared</p>
      </div>

      <div className="download-links">
        <a 
          href="https://play.google.com/store/apps/details?id=com.proofofpassportapp" 
          className="download-link"
          target="_blank"
          rel="noopener noreferrer"
        >
          📱 Download Self App (Android)
        </a>
        <a 
          href="https://theselfapp.com/download/" 
          className="download-link"
          target="_blank"
          rel="noopener noreferrer"
        >
          📱 Download Self App (iOS)
        </a>
      </div>

      {/* Self User-Defined Data Display */}
      {selfUserData && (
        <div className="app-info">
          <h3>📧 Email Verification Data</h3>
          <p>• Circuit: {selfUserData.circuit}</p>
          <p>• Proof Type: {selfUserData.proofType}</p>
          <p>• Generated: {new Date(selfUserData.timestamp).toLocaleString()}</p>
          <p>• Public Signals: {selfUserData.publicSignals.length} values</p>
          <div className="mt-4 p-4 bg-gray-100 rounded">
            <h4 className="font-semibold mb-2">Public Signals:</h4>
            <pre className="text-xs overflow-x-auto">
              {JSON.stringify(selfUserData.publicSignals, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Navigation to ENS Page */}
      <div className="navigation-section mt-8">
        <h3>🔗 Additional Features</h3>
        <a 
          href="/ens" 
          className="ens-link"
        >
          🌐 Manage ENS Names
        </a>
        <a 
          href="/email" 
          className="ens-link"
        >
          📧 Email Verification
        </a>
      </div>
    </div>
  );
}
