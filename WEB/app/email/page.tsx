'use client';

import React, { useState, useRef } from 'react';
import { ethers } from 'ethers';
import { useRouter } from 'next/navigation';

export default function EmailPage() {
  const router = useRouter();
  const [emailFile, setEmailFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [proofResult, setProofResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('');
  const [isRedirecting, setIsRedirecting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.name.endsWith('.eml')) {
        setEmailFile(file);
        setError(null);
        setProofResult(null);
      } else {
        setError('Please select a .eml file');
        setEmailFile(null);
      }
    }
  };

  const generateProof = async () => {
    if (!emailFile) return;

    setIsGenerating(true);
    setError(null);
    setProgress('Reading email file...');

    try {
      // Read the email file
      const arrayBuffer = await emailFile.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      
      setProgress('Building circuit input...');
      
      // Build input using the same logic as build_input.js
      const input = await buildCircuitInput(bytes);
      
      setProgress('Generating witness...');
      
      // Generate witness
      const witness = await generateWitness(input);
      
      setProgress('Generating ZK proof...');
      
      // Generate proof using snarkjs
      const proof = await generateSnarkProof(witness);
      
      setProgress('Complete!');
      setProofResult(proof);
      
      // Copy public.json data to self user-defined data
      const publicJsonData = {
        publicSignals: proof.publicSignals,
        timestamp: new Date().toISOString(),
        circuit: 'eml_receiver',
        proofType: 'groth16'
      };
      
      // Store in localStorage for now (you can integrate with your backend)
      localStorage.setItem('selfUserDefinedData', JSON.stringify(publicJsonData));
      
      // Redirect to main page after a short delay
      setIsRedirecting(true);
      setTimeout(() => {
        router.push('/');
      }, 2000);
      
    } catch (err: any) {
      console.error('Proof generation failed:', err);
      setError(err.message || 'Failed to generate proof');
    } finally {
      setIsGenerating(false);
      setProgress('');
    }
  };

  const buildCircuitInput = async (bytes: Uint8Array) => {
    const MAX = 8192;
    const eml = Array.from(bytes.slice(0, MAX));
    while (eml.length < MAX) eml.push(0);

    const buf = Buffer.from(eml);
    
    // Check for required literals
    const fromStr = 'From:';
    const toStr = 'To:';
    const atgStr = '@gmail.com';
    const idx_from = buf.indexOf(Buffer.from(fromStr, 'ascii'));
    const idx_to = buf.indexOf(Buffer.from(toStr, 'ascii'));
    const idx_atg = buf.indexOf(Buffer.from(atgStr, 'ascii'));
    
    if (idx_from < 0 || idx_to < 0 || idx_atg < 0) {
      throw new Error('Required literals not found in .eml (need From:, To:, and @gmail.com)');
    }

    // Generate Poseidon hash
    const poseidon = await import('circomlibjs').then(lib => lib.buildPoseidon());
    const F = poseidon.F;
    
    let h = 0n;
    for (let off = 0; off < MAX; off += 31) {
      const chunk = pack31LE(eml.slice(off, off + 31));
      const out = poseidon([F.e(h), F.e(chunk)]);
      h = BigInt(F.toString(out));
    }

    const input = {
      eml_commitment: h.toString(),
      eml: eml.map(n => n.toString()),
      from_bytes: strBytesAscii(fromStr).map(n => n.toString()),
      to_bytes: strBytesAscii(toStr).map(n => n.toString()),
      atg_bytes: strBytesAscii(atgStr).map(n => n.toString()),
      sel_from: oneHot(MAX, idx_from).map(n => n.toString()),
      sel_to: oneHot(MAX, idx_to).map(n => n.toString()),
      sel_atg: oneHot(MAX, idx_atg).map(n => n.toString())
    };

    return input;
  };

  const generateWitness = async (input: any) => {
    // Load the witness calculator
    const wasmPath = '/circuit/build/eml_receiver_js/eml_receiver.wasm';
    const response = await fetch(wasmPath);
    const wasm = await response.arrayBuffer();
    
    // Load witness calculator script dynamically
    const script = document.createElement('script');
    script.src = '/circuit/build/eml_receiver_js/witness_calculator_browser.js';
    document.head.appendChild(script);
    
    return new Promise((resolve, reject) => {
      script.onload = async () => {
        try {
          // The witness calculator is now available globally
          const wc = await (window as any).WitnessCalculatorBuilder(wasm);
          const witness = await wc.calculateWTNSBin(input, 0);
          document.head.removeChild(script);
          resolve(witness);
        } catch (err) {
          document.head.removeChild(script);
          reject(err);
        }
      };
      script.onerror = () => {
        document.head.removeChild(script);
        reject(new Error('Failed to load witness calculator'));
      };
    });
  };

  const generateSnarkProof = async (witness: any) => {
    // Load proving key
    const zkeyPath = '/circuit/build/eml_receiver.zkey';
    const zkeyResponse = await fetch(zkeyPath);
    const zkeyArrayBuffer = await zkeyResponse.arrayBuffer();
    const zkey = new Uint8Array(zkeyArrayBuffer);
    
    // Generate proof using snarkjs
    const snarkjs = await import('snarkjs');
    const { proof, publicSignals } = await snarkjs.groth16.prove(zkey, witness);
    
    return {
      proof: {
        pi_a: proof.pi_a,
        pi_b: proof.pi_b,
        pi_c: proof.pi_c
      },
      publicSignals: publicSignals
    };
  };

  const downloadProof = () => {
    if (!proofResult) return;
    
    const dataStr = JSON.stringify(proofResult, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'email_proof.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Helper functions
  const pack31LE = (bytes: number[]) => {
    let acc = 0n, mul = 1n;
    for (let i = 0; i < 31; i++) {
      const b = BigInt(bytes[i] || 0);
      acc += b * mul;
      mul *= 256n;
    }
    return acc;
  };

  const strBytesAscii = (s: string) => {
    return Array.from(Buffer.from(s, 'ascii'));
  };

  const oneHot = (length: number, pos: number) => {
    const arr = new Array(length).fill(0);
    if (pos >= 0 && pos < length) arr[pos] = 1;
    return arr;
  };

  // Show redirecting state when proof is generated
  if (isRedirecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 mb-2">✅ ZK Proof Generated!</p>
          <p className="text-sm text-gray-500">Redirecting to main page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Email ZK Proof Generator</h1>
            </div>
            <div className="text-sm text-gray-500">
              Generate ZK proofs locally - no cloud upload
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Generate ZK Proof from Email
            </h2>
            <p className="text-gray-600">
              Upload a .eml file to generate a zero-knowledge proof that verifies the email contains required headers.
            </p>
          </div>

          {/* File Upload Area */}
          <div className="mb-8">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept=".eml"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {!emailFile ? (
                <div>
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-600">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="font-medium text-blue-600 hover:text-blue-500"
                    >
                      Click to upload
                    </button>
                    {' '}or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 mt-1">EML files only</p>
                </div>
              ) : (
                <div>
                  <svg className="mx-auto h-12 w-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-600">
                    <span className="font-medium text-green-600">{emailFile.name}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {(emailFile.size / 1024).toFixed(1)} KB
                  </p>
                  <button
                    onClick={() => {
                      setEmailFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="mt-2 text-xs text-red-600 hover:text-red-500"
                  >
                    Remove file
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Generate Button - Only show after file upload */}
          {emailFile && (
            <div className="text-center mb-8">
              <button
                onClick={generateProof}
                disabled={isGenerating}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-8 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2 mx-auto"
              >
                {isGenerating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Generating ZK Proof...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>Generate ZK Proof</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Progress */}
          {progress && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-3"></div>
                <span className="text-blue-800">{progress}</span>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">{error}</div>
                </div>
              </div>
            </div>
          )}

          {/* Proof Result */}
          {proofResult && (
            <div className="space-y-6">
              <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center mb-4">
                  <svg className="h-6 w-6 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-lg font-medium text-green-800">Proof Generated Successfully!</h3>
                </div>
                <p className="text-green-700 mb-4">
                  Your ZK proof has been generated locally. The proof verifies that your email contains the required headers (From:, To:, @gmail.com).
                </p>
                <button
                  onClick={downloadProof}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Download Proof JSON</span>
                </button>
              </div>

              {/* Proof Details */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-800 mb-2">Proof Details</h4>
                <div className="text-xs text-gray-600 space-y-1">
                  <p><span className="font-medium">Public Signals:</span> {proofResult.publicSignals.length} values</p>
                  <p><span className="font-medium">Proof Type:</span> Groth16</p>
                  <p><span className="font-medium">Circuit:</span> eml_receiver.circom</p>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-8 p-6 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-medium text-blue-800 mb-3">How it works</h3>
            <div className="text-sm text-blue-700 space-y-2">
              <p>1. <strong>Upload .eml file:</strong> Your email file stays on your machine</p>
              <p>2. <strong>Circuit verification:</strong> Checks for required headers (From:, To:, @gmail.com)</p>
              <p>3. <strong>ZK proof generation:</strong> Creates a proof without revealing email content</p>
              <p>4. <strong>Download proof:</strong> Get the JSON proof file for verification</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
