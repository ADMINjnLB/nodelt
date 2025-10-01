import { useState } from 'react';
import { Receipt, Copy, Check, QrCode } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function InvoiceGenerator() {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [generating, setGenerating] = useState(false);
  const [invoice, setInvoice] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generateInvoice = async () => {
    if (!amount || parseFloat(amount) <= 0) return;

    setGenerating(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      alert('Please sign in to generate invoices');
      setGenerating(false);
      return;
    }

    const amountSats = parseFloat(amount);
    const amountMsats = amountSats * 1000;
    const paymentHash = generateRandomHash();
    const mockBolt11 = `lnbc${amountSats}n1p${paymentHash.substring(0, 50)}`;

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    const { error } = await supabase.from('invoices').insert({
      user_id: user.id,
      payment_request: mockBolt11,
      payment_hash: paymentHash,
      amount_msats: amountMsats,
      description: description || 'Lightning payment',
      status: 'pending',
      expires_at: expiresAt.toISOString()
    });

    if (error) {
      console.error('Error creating invoice:', error);
      alert('Failed to create invoice');
    } else {
      setInvoice(mockBolt11);
    }

    setGenerating(false);
  };

  const generateRandomHash = () => {
    return Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  };

  const copyToClipboard = async () => {
    if (invoice) {
      await navigator.clipboard.writeText(invoice);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const reset = () => {
    setInvoice(null);
    setAmount('');
    setDescription('');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-orange-100 rounded-lg">
          <Receipt className="w-6 h-6 text-orange-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Generate Invoice</h2>
      </div>

      {!invoice ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount (sats)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="10000"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Coffee payment"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              maxLength={100}
            />
          </div>

          <button
            onClick={generateInvoice}
            disabled={generating || !amount || parseFloat(amount) <= 0}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            {generating ? 'Generating...' : 'Generate Invoice'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-white p-4 rounded-lg">
                <QrCode className="w-32 h-32 text-gray-400" />
              </div>
            </div>

            <div className="bg-white rounded p-3 break-all text-xs font-mono text-gray-600 border border-gray-200">
              {invoice}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={copyToClipboard}
              className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Invoice
                </>
              )}
            </button>

            <button
              onClick={reset}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Create New
            </button>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Amount:</strong> {amount} sats<br />
              <strong>Expires:</strong> In 1 hour<br />
              {description && <><strong>Description:</strong> {description}</>}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
