import { useState } from 'react';
import { Send, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function PaymentSender() {
  const [invoice, setInvoice] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const sendPayment = async () => {
    if (!invoice.trim()) return;

    setSending(true);
    setResult(null);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setResult({ success: false, message: 'Please sign in to send payments' });
      setSending(false);
      return;
    }

    try {
      const amountMsats = Math.floor(Math.random() * 100000) + 1000;
      const feeMsats = Math.floor(amountMsats * 0.001);
      const paymentHash = Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('');

      const destinationPubkey = Array.from({ length: 66 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('');

      const { error } = await supabase.from('payments').insert({
        user_id: user.id,
        payment_hash: paymentHash,
        payment_request: invoice,
        amount_msats: amountMsats,
        fee_msats: feeMsats,
        destination: destinationPubkey,
        status: 'succeeded',
        paid_at: new Date().toISOString()
      });

      if (error) throw error;

      setResult({
        success: true,
        message: `Payment sent! Amount: ${(amountMsats / 1000).toFixed(0)} sats, Fee: ${(feeMsats / 1000).toFixed(2)} sats`
      });
      setInvoice('');
    } catch (error) {
      setResult({ success: false, message: 'Payment failed. Please try again.' });
      console.error('Payment error:', error);
    }

    setSending(false);
  };

  const handleWebLNPay = async () => {
    if (typeof window !== 'undefined' && 'webln' in window) {
      try {
        setSending(true);
        const webln = (window as any).webln;
        await webln.enable();
        const response = await webln.sendPayment(invoice);
        setResult({ success: true, message: `Payment sent via WebLN! Preimage: ${response.preimage.substring(0, 20)}...` });
        setInvoice('');
      } catch (error: any) {
        setResult({ success: false, message: error.message || 'WebLN payment failed' });
      } finally {
        setSending(false);
      }
    } else {
      setResult({ success: false, message: 'WebLN not available. Install a Lightning wallet browser extension.' });
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Send className="w-6 h-6 text-blue-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Send Payment</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Lightning Invoice (BOLT11)
          </label>
          <textarea
            value={invoice}
            onChange={(e) => setInvoice(e.target.value)}
            placeholder="lnbc..."
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm resize-none"
          />
        </div>

        {result && (
          <div className={`flex items-start gap-3 p-4 rounded-lg ${
            result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            {result.success ? (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <p className={`text-sm ${result.success ? 'text-green-800' : 'text-red-800'}`}>
              {result.message}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            onClick={sendPayment}
            disabled={sending || !invoice.trim()}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            {sending ? 'Sending...' : 'Pay Invoice'}
          </button>

          <button
            onClick={handleWebLNPay}
            disabled={sending || !invoice.trim()}
            className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Pay with WebLN
          </button>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <p className="text-xs text-gray-600">
            <strong className="text-gray-900">Note:</strong> This demo interface simulates Lightning payments.
            In production, this would connect to a real Lightning node via LND REST API or similar backend service.
            WebLN allows payment through browser extension wallets like Alby.
          </p>
        </div>
      </div>
    </div>
  );
}
