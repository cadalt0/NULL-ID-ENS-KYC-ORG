'use client';

import React, { useState, useEffect } from 'react';
import { getUniversalLink } from "@selfxyz/core";
import {
  SelfQRcodeWrapper,
  SelfAppBuilder,
  type SelfApp,
} from "@selfxyz/qrcode";
import { ethers } from "ethers";

interface VerificationPageProps {
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

function VerificationPage({ onSuccess, onError }: VerificationPageProps) {
  const [selfApp, setSelfApp] = useState<SelfApp | null>(null);
  const [universalLink, setUniversalLink] = useState("");
  const [userId] = useState(ethers.ZeroAddress);

  useEffect(() => {
    try {
      const config = {
        version: 2,
        appName: "Self Workshop",
        scope: "self-workshop",
        endpoint: "0xE40a04c8A63b598fC320CD0D8F1C432026b9F5F1", // Deployed contract address
        logoBase64: "https://i.postimg.cc/mrmVf9hm/self.png",
        userId: userId,
        endpointType: "celo" as const, // Use Celo mainnet
        userIdType: "hex" as const,
        userDefinedData: "Hello World",
        disclosures: {
          minimumAge: 18,
        }
      };
      
      console.log('🔧 Frontend config:', config);
      
      const app = new SelfAppBuilder(config).build();

      setSelfApp(app);
      setUniversalLink(getUniversalLink(app));
      console.log('✅ Frontend app initialized successfully');
    } catch (error) {
      console.error("Failed to initialize Self app:", error);
    }
  }, [userId]);

  const handleSuccessfulVerification = () => {
    console.log("Verification successful!");
    onSuccess?.(); // Call parent success callback
  };

  const handleVerificationError = (error: any) => {
    console.error("Error: Failed to verify identity", error);
    onError?.(error); // Call parent error callback
  };

  return (
    <div className="verification-container">
      <h1>Verify Your Identity</h1>
      <p>Scan this QR code with the Self app</p>
      
      {selfApp ? (
        <SelfQRcodeWrapper
          selfApp={selfApp}
          onSuccess={handleSuccessfulVerification}
          onError={handleVerificationError}
        />
      ) : (
        <div>Loading QR Code...</div>
      )}
    </div>
  );
}

export default VerificationPage;