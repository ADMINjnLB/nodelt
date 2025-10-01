import { useState, useEffect } from 'react';
import { Wallet, CheckCircle, XCircle, Zap } from 'lucide-react';

interface WebLNProvider {
  enable: () => Promise<void>;
  getInfo: () => Promise<{ node?: { alias?: string; pubkey?: string } }>;
  sendPayment: (invoice: string) => Promise<{ preimage: string }>;
  makeInvoice: (args: { amount?: number; defaultMemo?: string }) => Promise<{ paymentRequest: string }>;
}

declare global {
  interface Window {
    webln?: WebLNProvider;
  }
}

export function WebLNConnect() {
  const [connected, setConnected] = useState(false);
  const [nodeInfo, setNodeInfo] = useState<{ alias?: string; pubkey?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkWebLN();
  }, []);

  const checkWebLN = () => {
    if (typeof window !== 'undefined' && window.webln) {
      setConnected(false);
    }
  };

  const connectWebLN = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!window.webln) {
        throw new Error('WebLN not available. Please install a Lightning wallet browser extension like Alby.');
      }

      await window.webln.enable();
      const info = await window.webln.getInfo();

      setNodeInfo(info.node || null);
      setConnected(true);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to WebLN');
      setConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const disconnect = () => {
    setConnected(false);
    setNodeInfo(null);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-100 rounded-lg">
          <Wallet className="w-6 h-6 text-purple-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">WebLN Connection</h2>
      </div>

      {!connected ? (
        <div className="space-y-4">
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-purple-900 mb-1">What is WebLN?</h3>
                <p className="text-sm text-purple-800">
                  WebLN allows websites to interact with your Lightning wallet browser extension.
                  Install extensions like Alby, Joule, or LNbits to enable seamless Lightning payments.
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 border border-red-200">
              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <button
            onClick={connectWebLN}
            disabled={loading}
            className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            {loading ? 'Connecting...' : 'Connect WebLN Wallet'}
          </button>

          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-2 text-sm">Recommended Extensions:</h4>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• Alby - Lightning wallet for the web</li>
              <li>• Joule - Non-custodial Lightning wallet</li>
              <li>• LNbits - Self-hosted Lightning accounts</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-green-50 border border-green-200">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-green-900">Connected to WebLN</p>
              {nodeInfo && (
                <div className="mt-2 space-y-1">
                  {nodeInfo.alias && (
                    <p className="text-sm text-green-800">
                      <strong>Node:</strong> {nodeInfo.alias}
                    </p>
                  )}
                  {nodeInfo.pubkey && (
                    <p className="text-xs text-green-700 font-mono break-all">
                      {nodeInfo.pubkey}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-sm text-blue-800">
              You can now use your WebLN wallet to send payments instantly from this application.
              Look for the "Pay with WebLN" button when sending payments.
            </p>
          </div>

          <button
            onClick={disconnect}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
