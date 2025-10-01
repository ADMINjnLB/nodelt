import { useState } from 'react';
import { Heart, Gift, Coffee, Zap, Copy, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';

const PRESET_AMOUNTS = [1000, 5000, 10000, 21000, 50000, 100000];

const PRESET_MESSAGES = [
  { icon: Coffee, label: 'Coffee', amount: 5000 },
  { icon: Heart, label: 'Thanks', amount: 10000 },
  { icon: Gift, label: 'Tip', amount: 21000 },
  { icon: Zap, label: 'Boost', amount: 50000 }
];

export function TippingInterface() {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [message, setMessage] = useState('');
  const [recipient, setRecipient] = useState('');
  const [invoice, setInvoice] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const getAmount = () => {
    if (customAmount) return parseFloat(customAmount);
    if (selectedAmount) return selectedAmount;
    return 0;
  };

  const generateTipInvoice = async () => {
    const amount = getAmount();
    if (amount <= 0 || !recipient.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('Please sign in to create tips');
      return;
    }

    const amountMsats = amount * 1000;
    const paymentHash = Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');

    const description = message || `Tip to ${recipient}`;
    const mockBolt11 = `lnbc${amount}n1p${paymentHash.substring(0, 50)}`;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const { error } = await supabase.from('invoices').insert({
      user_id: user.id,
      payment_request: mockBolt11,
      payment_hash: paymentHash,
      amount_msats: amountMsats,
      description: description,
      status: 'pending',
      expires_at: expiresAt.toISOString()
    });

    if (!error) {
      setInvoice(mockBolt11);
    }
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
    setSelectedAmount(null);
    setCustomAmount('');
    setMessage('');
    setRecipient('');
  };

  const formatSats = (sats: number) => {
    return new Intl.NumberFormat('en-US').format(sats);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-pink-100 rounded-lg">
          <Heart className="w-6 h-6 text-pink-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Lightning Tips</h2>
      </div>

      {!invoice ? (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Quick Tips
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {PRESET_MESSAGES.map((preset) => {
                const Icon = preset.icon;
                return (
                  <button
                    key={preset.label}
                    onClick={() => {
                      setSelectedAmount(preset.amount);
                      setCustomAmount('');
                    }}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                      selectedAmount === preset.amount
                        ? 'border-pink-500 bg-pink-50'
                        : 'border-gray-200 hover:border-pink-300 bg-white'
                    }`}
                  >
                    <Icon className={`w-6 h-6 ${
                      selectedAmount === preset.amount ? 'text-pink-600' : 'text-gray-400'
                    }`} />
                    <span className="text-sm font-medium text-gray-900">{preset.label}</span>
                    <span className="text-xs text-gray-500">{formatSats(preset.amount)} sats</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Or Choose Amount
            </label>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {PRESET_AMOUNTS.map((amount) => (
                <button
                  key={amount}
                  onClick={() => {
                    setSelectedAmount(amount);
                    setCustomAmount('');
                  }}
                  className={`py-2 px-4 rounded-lg border-2 transition-all text-sm font-medium ${
                    selectedAmount === amount
                      ? 'border-pink-500 bg-pink-50 text-pink-700'
                      : 'border-gray-200 hover:border-pink-300 text-gray-700'
                  }`}
                >
                  {formatSats(amount)}
                </button>
              ))}
            </div>

            <input
              type="number"
              value={customAmount}
              onChange={(e) => {
                setCustomAmount(e.target.value);
                setSelectedAmount(null);
              }}
              placeholder="Custom amount in sats"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recipient (Lightning Address or Pubkey)
            </label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="user@getalby.com or 03abc..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message (optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Thanks for the great content!"
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
              maxLength={200}
            />
          </div>

          <button
            onClick={generateTipInvoice}
            disabled={getAmount() <= 0 || !recipient.trim()}
            className="w-full bg-pink-500 hover:bg-pink-600 disabled:bg-gray-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Generate Tip Invoice
          </button>

          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-xs text-blue-800">
              <strong>LNURL Support:</strong> In production, this would support LNURL-pay and Lightning Address
              protocols for seamless tipping without generating invoices.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-pink-50 rounded-lg p-4 border border-pink-200">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-pink-900">
                  Tip Invoice Generated
                </p>
                <p className="text-xs text-pink-700 mt-1">
                  Amount: {formatSats(getAmount())} sats
                </p>
              </div>
              <Heart className="w-8 h-8 text-pink-500" />
            </div>

            {message && (
              <div className="bg-white rounded p-3 mt-2">
                <p className="text-sm text-gray-700 italic">"{message}"</p>
              </div>
            )}
          </div>

          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-xs font-mono break-all text-gray-600">{invoice}</p>
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
                  Copy
                </>
              )}
            </button>

            <button
              onClick={reset}
              className="flex-1 bg-pink-500 hover:bg-pink-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              New Tip
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
