'use client';

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useRouter } from 'next/navigation';
import { useWallet } from '../../src/hooks/useWallet';

export default function ENSPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [ensName, setEnsName] = useState<string | null>(null);
  const [showEnsPopup, setShowEnsPopup] = useState(false);
  const [userEnsInput, setUserEnsInput] = useState('');
  const [ensVerification, setEnsVerification] = useState<{
    isValid: boolean;
    message: string;
    showCreateButton: boolean;
  } | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  const {
    isConnected,
    address,
    balance,
    chainId,
    provider,
    isLoading,
    isChecking,
    isConnecting,
    error,
    isMetaMaskInstalled,
    connectWallet,
    disconnectWallet,
    getENSName,
    formatAddress,
  } = useWallet();

  // Prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Get ENS name whenever wallet state changes (including on reload)
  useEffect(() => {
    const fetchENSName = async () => {
      if (isConnected && address && !isChecking) {
        try {
          console.log('🔍 Resolving ENS name for:', address);
          const name = await getENSName(address);
          console.log('✅ ENS name resolved:', name);
          setEnsName(name);
          
          // Show popup if no ENS name is found
          if (!name) {
            setShowEnsPopup(true);
          } else {
            // If ENS name is found, redirect to email page after a short delay
            setIsRedirecting(true);
            setTimeout(() => {
              router.push('/email');
            }, 1500);
          }
        } catch (err) {
          console.warn('Failed to resolve ENS name:', err);
          setEnsName(null);
          setShowEnsPopup(true);
        }
      } else {
        setEnsName(null);
        setShowEnsPopup(false);
      }
    };

    // Only fetch ENS name after initial check is complete
    if (!isChecking) {
      fetchENSName();
    }
  }, [isConnected, address, getENSName, isChecking]);

  const handleConnect = async () => {
    await connectWallet();
  };

  const handleDisconnect = () => {
    disconnectWallet();
  };


  const handleEnsVerification = async () => {
    if (!userEnsInput.trim() || !address) return;
    
    setIsVerifying(true);
    setEnsVerification(null);
    
    try {
      const provider = new ethers.JsonRpcProvider('https://sepolia.drpc.org');
      const resolvedAddress = await provider.resolveName(userEnsInput.trim());
      
      if (resolvedAddress && resolvedAddress.toLowerCase() === address.toLowerCase()) {
        setEnsVerification({
          isValid: true,
          message: `✅ ${userEnsInput} is correctly linked to your address! Redirecting...`,
          showCreateButton: false
        });
        setEnsName(userEnsInput.trim());
        setIsRedirecting(true);
        
                // Redirect to email page after successful verification
                setTimeout(() => {
                  router.push('/email');
                }, 2000);
      } else if (resolvedAddress) {
        setEnsVerification({
          isValid: false,
          message: `❌ ${userEnsInput} is linked to a different address: ${resolvedAddress}`,
          showCreateButton: true
        });
      } else {
        setEnsVerification({
          isValid: false,
          message: `❌ ${userEnsInput} is not registered or doesn't exist`,
          showCreateButton: true
        });
      }
    } catch (err) {
      console.error('❌ Error verifying ENS name:', err);
      setEnsVerification({
        isValid: false,
        message: 'Error verifying ENS name',
        showCreateButton: true
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Show loading state until mounted or while initial wallet check runs
  if (!isMounted || isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">{!isMounted ? 'Loading ENS Manager...' : 'Checking wallet connection...'}</p>
        </div>
      </div>
    );
  }

  // Show redirecting state when ENS is found
  if (isRedirecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600 mb-2">✅ ENS name found!</p>
                  <p className="text-sm text-gray-500">Redirecting to email verification...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header with Wallet Connection */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo/Title */}
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">ENS Manager</h1>
            </div>

            {/* Wallet Connection Button */}
            <div className="flex items-center space-x-4">
              {!isMetaMaskInstalled ? (
                <div className="text-red-600 text-sm">
                  MetaMask not installed
                </div>
              ) : !isConnected ? (
                <button
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
                >
                  {isConnecting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M17.778 8.222c-4.296-4.296-11.26-4.296-15.556 0A1 1 0 010.808 6.808c5.076-5.076 13.308-5.076 18.384 0a1 1 0 01-1.414 1.414zM14.95 11.05c-3.124-3.124-8.194-3.124-11.318 0A1 1 0 012.515 9.636c3.943-3.943 10.33-3.943 14.273 0a1 1 0 01-1.414 1.414zM12.12 13.88c-1.171-1.171-3.073-1.171-4.244 0a1 1 0 01-1.415-1.415c2.051-2.051 5.374-2.051 7.425 0a1 1 0 01-1.415 1.415zM9 16a1 1 0 102 0 1 1 0 00-2 0z" clipRule="evenodd" />
                      </svg>
                      <span>Connect Wallet</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="flex items-center space-x-3">
                  {/* Wallet Info */}
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {ensName || formatAddress(address || '')}
                    </div>
                    <div className="text-xs text-gray-500">
                      Connected
                    </div>
                  </div>

                  {/* Disconnect Button */}
                  <button
                    onClick={handleDisconnect}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                  >
                    Disconnect
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Connection Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Wallet Info */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Wallet Information</h2>
            {isConnected ? (
              <div className="space-y-3">
                <p className="text-gray-700">
                  <span className="font-medium">Address:</span> {address}
                </p>
                <p className="text-gray-700">
                  <span className="font-medium">ENS Name:</span> {ensName || 'N/A'}
                  {chainId === 11155111 && (
                    <span className="text-xs text-blue-600 ml-2">(Sepolia testnet)</span>
                  )}
                </p>
                <p className="text-gray-700">
                  <span className="font-medium">Status:</span> Connected
                </p>
                <p className="text-gray-700">
                  <span className="font-medium">Chain ID:</span> {chainId}
                </p>
              </div>
            ) : (
              <p className="text-gray-600">Connect your MetaMask wallet to view details.</p>
            )}
          </div>

          {/* Right Column - ENS Actions */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">ENS Actions</h2>
            <div className="space-y-4">
              <p className="text-gray-600">
                ENS actions will be available here once connected.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* ENS Setup Popup */}
      {showEnsPopup && isConnected && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Setup Your ENS Name
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Enter your ENS name to verify it's linked to your connected address, or create a new one.
            </p>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="user-ens" className="block text-sm font-medium text-gray-700 mb-2">
                  Your ENS Name
                </label>
                <input
                  id="user-ens"
                  type="text"
                  value={userEnsInput}
                  onChange={(e) => setUserEnsInput(e.target.value)}
                  placeholder="e.g., myname.eth"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && handleEnsVerification()}
                />
              </div>
              
              {ensVerification && (
                <div className={`p-3 rounded-lg ${
                  ensVerification.isValid 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <p className={`text-sm ${
                    ensVerification.isValid ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {ensVerification.message}
                  </p>
                </div>
              )}
              
              <div className="flex space-x-3">
                <button
                  onClick={handleEnsVerification}
                  disabled={isVerifying || !userEnsInput.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  {isVerifying ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <span>Verify ENS</span>
                  )}
                </button>
                
                {ensVerification?.showCreateButton && (
                  <button
                    onClick={() => window.open('https://app.ens.domains/', '_blank')}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors duration-200"
                  >
                    Create ENS
                  </button>
                )}
              </div>
              
              <button
                onClick={() => setShowEnsPopup(false)}
                className="w-full px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
              >
                Skip for now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}