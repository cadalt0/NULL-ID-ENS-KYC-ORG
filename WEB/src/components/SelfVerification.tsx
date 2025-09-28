'use client';

import React, { useState, useEffect } from 'react';

// Mock Self Protocol components for now
const MockSelfQRcodeWrapper = ({ onSuccess, onError, size }: any) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="qr-placeholder">
        <div className="qr-mock">
          <div className="qr-grid">
            {Array.from({ length: 25 }, (_, i) => (
              <div key={i} className="qr-square"></div>
            ))}
          </div>
        </div>
        <p className="qr-status">Loading QR Code...</p>
      </div>
    );
  }

  return (
    <div className="qr-placeholder">
      <div className="qr-mock">
        <div className="qr-grid">
          {Array.from({ length: 25 }, (_, i) => (
            <div key={i} className="qr-square"></div>
          ))}
        </div>
      </div>
      <p className="qr-status">QR Code Ready - Scan with Self App</p>
      <button 
        className="download-link"
        onClick={() => {
          // Simulate successful verification
          setTimeout(() => {
            onSuccess();
          }, 1000);
        }}
        style={{ marginTop: '20px' }}
      >
        🧪 Test Human Verification
      </button>
    </div>
  );
};

interface SelfApp {
  [key: string]: any;
}

interface SelfVerificationProps {
  onSuccess: () => void;
  onError: (error: any) => void;
}

export default function SelfVerification({ onSuccess, onError }: SelfVerificationProps) {
  const [selfApp, setSelfApp] = useState<SelfApp | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      // Generate unique user ID
      const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      console.log('🔧 Initializing Self app with:', {
        appName: "Human Verification",
        scope: "human-verification-" + Date.now(),
        endpoint: "https://playground.self.xyz/api/verify",
        endpointType: "staging_https"
      });
      
      // Create mock Self app configuration
      const app = {
        appName: "Human Verification",
        scope: "human-verification-" + Date.now(),
        endpoint: "https://playground.self.xyz/api/verify",
        endpointType: "staging_https",
        userId: userId,
        userIdType: "uuid",
        userDefinedData: "Human Verification Check",
        disclosures: {
          minimumAge: 18,
          nationality: true,
          ofac: true
        }
      };

      setSelfApp(app);
      console.log('✅ Self app initialized successfully');
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to initialize Self app:', error);
      onError('Failed to initialize human verification system. Please refresh the page and try again.');
      setIsLoading(false);
    }
  }, [onError]);

  if (isLoading) {
    return (
      <div className="qr-placeholder">
        <div className="qr-mock">
          <div className="qr-grid">
            {Array.from({ length: 25 }, (_, i) => (
              <div key={i} className="qr-square"></div>
            ))}
          </div>
        </div>
        <p className="qr-status">Initializing verification system...</p>
      </div>
    );
  }

  return (
    <MockSelfQRcodeWrapper
      selfApp={selfApp}
      onSuccess={onSuccess}
      onError={onError}
      size={300}
      darkMode={false}
    />
  );
}
