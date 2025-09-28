'use client';

import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

interface WalletState {
  isConnected: boolean;
  address: string | null;
  balance: string | null;
  chainId: number | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
}

export const useWallet = () => {
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    address: null,
    balance: null,
    chainId: null,
    provider: null,
    signer: null,
  });
  // Distinguish between initial check vs. explicit connect
  const [isChecking, setIsChecking] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const isLoading = isChecking || isConnecting;
  // Track if the user has explicitly disconnected to avoid auto-reconnect
  const [userDisconnected, setUserDisconnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if MetaMask is installed
  const isMetaMaskInstalled = useCallback(() => {
    if (typeof window === 'undefined') return false;
    return !!(window.ethereum && window.ethereum.isMetaMask);
  }, []);

  // Connect to MetaMask
  const connectWallet = useCallback(async () => {
    if (!isMetaMaskInstalled()) {
      setError('MetaMask is not installed. Please install MetaMask to continue.');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Request account access
      const accounts = await window.ethereum!.request({ 
        method: 'eth_requestAccounts' 
      });
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found');
      }

      // Immediately reflect connection with basic info to update UI fast
      const connectedAddress = accounts[0];
      setWalletState(prev => ({
        isConnected: true,
        address: connectedAddress,
        balance: prev.balance, // keep any previous until refreshed
        chainId: prev.chainId,
        provider: prev.provider,
        signer: prev.signer,
      }));
      setIsConnecting(false);

      // Background enrich wallet details (without balance)
      (async () => {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum!);
          const [signer, network] = await Promise.all([
            provider.getSigner(),
            provider.getNetwork(),
          ]);
          setWalletState({
            isConnected: true,
            address: connectedAddress,
            balance: null,
            chainId: Number(network.chainId),
            provider,
            signer,
          });
          setUserDisconnected(false);
          console.log('✅ Wallet connected:', connectedAddress);
        } catch (bgErr) {
          console.warn('Background wallet enrichment failed:', bgErr);
        }
      })();
    } catch (err: any) {
      console.error('❌ Wallet connection failed:', err);
      setError(err.message || 'Failed to connect wallet');
      setIsConnecting(false);
    }
  }, [isMetaMaskInstalled]);

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    setWalletState({
      isConnected: false,
      address: null,
      balance: null,
      chainId: null,
      provider: null,
      signer: null,
    });
    // Ensure loading flags are cleared
    setIsConnecting(false);
    setIsChecking(false);
    setUserDisconnected(true);
    setError(null);
    console.log('🔌 Wallet disconnected');
  }, []);

  // Get ENS name for address using ethers.js v6 method with testnet support
  const getENSName = useCallback(async (address: string): Promise<string | null> => {
    if (!walletState.provider) return null;
    try {
      // For testnets like Sepolia, we need to use a different approach
      // First try the standard lookupAddress method
      let ensName = await walletState.provider.lookupAddress(address);
      
      // If that fails and we're on Sepolia, try direct reverse resolution
      if (!ensName && walletState.chainId === 11155111) {
        console.log('🔍 Trying Sepolia ENS resolution for:', address);
        
        // Use the Sepolia ENS registry
        const reverseNode = address.toLowerCase().slice(2) + '.addr.reverse';
        const namehash = ethers.namehash(reverseNode);
        
        // Sepolia ENS registry address
        const sepoliaEnsRegistry = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e';
        const ensRegistryAbi = [
          'function resolver(bytes32 node) external view returns (address)'
        ];
        const resolverAbi = [
          'function name(bytes32 node) external view returns (string)'
        ];
        
        const registry = new ethers.Contract(sepoliaEnsRegistry, ensRegistryAbi, walletState.provider);
        const resolverAddress = await registry.resolver(namehash);
        
        if (resolverAddress && resolverAddress !== '0x0000000000000000000000000000000000000000') {
          const resolver = new ethers.Contract(resolverAddress, resolverAbi, walletState.provider);
          ensName = await resolver.name(namehash);
        }
      }
      
      return ensName;
    } catch (err) {
      console.error('❌ Error resolving ENS name:', err);
      return null;
    }
  }, [walletState.provider, walletState.chainId]);

  // Format address for display
  const formatAddress = useCallback((address: string): string => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, []);

  // Check if wallet is already connected on page load
  const checkWalletConnection = useCallback(async () => {
    if (!isMetaMaskInstalled() || userDisconnected) {
      setIsChecking(false);
      return;
    }

    setIsChecking(true);
    try {
      const accounts = await window.ethereum!.request({ method: 'eth_accounts' });
      
      if (accounts && accounts.length > 0) {
        const restoredAddress = accounts[0];
        // Immediately reflect connection with basic info
        setWalletState(prev => ({
          isConnected: true,
          address: restoredAddress,
          balance: prev.balance,
          chainId: prev.chainId,
          provider: prev.provider,
          signer: prev.signer,
        }));
        setIsChecking(false);

        // Background enrichment (without balance)
        (async () => {
          try {
            const provider = new ethers.BrowserProvider(window.ethereum!);
            const [signer, network] = await Promise.all([
              provider.getSigner(),
              provider.getNetwork(),
            ]);
            setWalletState({
              isConnected: true,
              address: restoredAddress,
              balance: null,
              chainId: Number(network.chainId),
              provider,
              signer,
            });
            console.log('✅ Wallet restored:', restoredAddress);
          } catch (bgErr) {
            console.warn('Background wallet restore enrichment failed:', bgErr);
          }
        })();
      } else {
        // No accounts connected
        setWalletState({
          isConnected: false,
          address: null,
          balance: null,
          chainId: null,
          provider: null,
          signer: null,
        });
        setIsChecking(false);
      }
    } catch (err) {
      console.error('❌ Error checking wallet connection:', err);
      setWalletState({
        isConnected: false,
        address: null,
        balance: null,
        chainId: null,
        provider: null,
        signer: null,
      });
      setIsChecking(false);
    }
  }, [isMetaMaskInstalled, userDisconnected]);

  // Listen for account changes
  useEffect(() => {
    if (!isMetaMaskInstalled()) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (userDisconnected) {
        // Respect manual disconnect; keep UI disconnected regardless of accounts
        if (accounts.length === 0) {
          disconnectWallet();
        }
        return;
      }
      if (accounts.length === 0) {
        disconnectWallet();
      } else {
        const newAddress = accounts[0];
        // Update immediately for snappy UI
        setWalletState(prev => ({
          isConnected: true,
          address: newAddress,
          balance: prev.balance,
          chainId: prev.chainId,
          provider: prev.provider,
          signer: prev.signer,
        }));
        // Background enrich without triggering prompts/spinner (no balance)
        (async () => {
          try {
            const provider = new ethers.BrowserProvider(window.ethereum!);
            const [signer, network] = await Promise.all([
              provider.getSigner(),
              provider.getNetwork(),
            ]);
            setWalletState({
              isConnected: true,
              address: newAddress,
              balance: null,
              chainId: Number(network.chainId),
              provider,
              signer,
            });
          } catch (bgErr) {
            console.warn('Background account change enrichment failed:', bgErr);
          }
        })();
      }
    };

    const handleChainChanged = (chainId: string) => {
      if (userDisconnected) return;
      if (!walletState.isConnected || !walletState.address) return;
      const currentAddress = walletState.address;
      // Background enrich with new network; no prompts (no balance)
      (async () => {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum!);
          const [signer, network] = await Promise.all([
            provider.getSigner(),
            provider.getNetwork(),
          ]);
          setWalletState({
            isConnected: true,
            address: currentAddress,
            balance: null,
            chainId: Number(network.chainId),
            provider,
            signer,
          });
        } catch (bgErr) {
          console.warn('Background chain change enrichment failed:', bgErr);
        }
      })();
    };

    // Check if already connected on mount
    checkWalletConnection();

    // Add event listeners
    window.ethereum!.on('accountsChanged', handleAccountsChanged);
    window.ethereum!.on('chainChanged', handleChainChanged);

    return () => {
      if (window.ethereum) {
        window.ethereum!.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum!.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [isMetaMaskInstalled, checkWalletConnection, connectWallet, disconnectWallet, walletState.isConnected, userDisconnected, walletState.address]);

  return {
    ...walletState,
    isLoading,
    isChecking,
    isConnecting,
    error,
    isMetaMaskInstalled: isMetaMaskInstalled(),
    connectWallet,
    disconnectWallet,
    getENSName,
    formatAddress,
  };
};

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
    };
  }
}