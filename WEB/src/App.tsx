import React, { useState, useEffect } from 'react';
import { SelfQRcodeWrapper, SelfAppBuilder } from '@selfxyz/qrcode';

interface SelfApp {
  // Self app configuration type
  [key: string]: any;
}

const App: React.FC = () => {
  const [selfApp, setSelfApp] = useState<SelfApp | null>(null);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    try {
      // Generate unique user ID
      const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Create Self app configuration
      const app = new SelfAppBuilder({
        version: 2,
        appName: "Create Your Null ID",
        scope: "null-id-verification",
        endpoint: "https://playground.self.xyz/api/verify", // Use Self's playground for testing
        logoBase64: "https://i.postimg.cc/mrmVf9hm/self.png",
        userId: userId,
        endpointType: "staging_https", // Staging mode for testing
        userIdType: "uuid",
        userDefinedData: "Null ID Verification",
        disclosures: {
          // What we want to verify
          minimumAge: 18,
          nationality: true,
          gender: true,
          name: true,
          date_of_birth: true,
          // Security checks
          ofac: true,
          excludedCountries: ["IRN", "PRK", "RUS", "SYR"]
        }
      }).build();

      setSelfApp(app);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to initialize Self app:', error);
      setVerificationError('Failed to initialize verification system');
      setIsLoading(false);
    }
  }, []);

  const handleSuccessfulVerification = () => {
    console.log('✅ Identity verified successfully!');
    setIsVerified(true);
    setVerificationError(null);
  };

  const handleVerificationError = (error: any) => {
    console.error('❌ Verification failed:', error);
    setVerificationError('Identity verification failed. Please try again.');
  };

  if (isLoading) {
    return (
      <div className="verification-container">
        <div className="loading">
          <h2>Initializing Verification System...</h2>
          <p>Please wait while we set up your identity verification.</p>
        </div>
      </div>
    );
  }

  if (isVerified) {
    return (
      <div className="verification-container">
        <div className="verified-content">
          <h1 className="verified-title">🎉 Identity Verified Successfully!</h1>
          <p className="verified-message">
            Your Null ID has been created and verified. You now have access to all features.
          </p>
          <div className="app-info">
            <h3>✅ Verification Complete</h3>
            <p>• Age verified (18+)</p>
            <p>• Identity confirmed</p>
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
        <h1 className="verification-title">Create Your Null ID</h1>
        <p className="verification-subtitle">Privacy-First Identity Verification</p>
        <p className="verification-description">
          Verify your identity using your passport or ID card while maintaining complete privacy. 
          Only the information you choose to share will be disclosed.
        </p>
      </div>

      {verificationError && (
        <div className="error">
          <h3>Verification Error</h3>
          <p>{verificationError}</p>
        </div>
      )}

      <div className="qr-section">
        <h2 className="qr-title">📱 Scan QR Code to Verify</h2>
        <p className="qr-description">
          Use the Self app on your phone to scan this QR code and verify your identity
        </p>
        
        {selfApp ? (
          <SelfQRcodeWrapper
            selfApp={selfApp}
            onSuccess={handleSuccessfulVerification}
            onError={handleVerificationError}
            size={300}
            darkMode={false}
          />
        ) : (
          <div className="loading">Loading QR Code...</div>
        )}
      </div>

      <div className="instructions">
        <h3>How to Verify Your Identity:</h3>
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
          <span>Your identity will be verified while preserving your privacy</span>
        </div>
      </div>

      <div className="app-info">
        <h3>🔒 Privacy & Security</h3>
        <p>• Zero-knowledge proofs ensure your data stays private</p>
        <p>• Only verified attributes are shared, nothing more</p>
        <p>• No personal data is stored on our servers</p>
        <p>• OFAC sanctions check for security compliance</p>
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
    </div>
  );
};

export default App;
