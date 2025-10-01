import { useState } from 'react';
import { ShoppingCart, Trash2, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface CartItem {
  name: string;
  price: number;
  quantity: number;
}

export function POSTerminal() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoice, setInvoice] = useState<string | null>(null);

  const addItem = () => {
    if (!itemName.trim() || !itemPrice || parseFloat(itemPrice) <= 0) return;

    const existingItem = items.find(item => item.name === itemName);
    if (existingItem) {
      setItems(items.map(item =>
        item.name === itemName
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setItems([...items, { name: itemName, price: parseFloat(itemPrice), quantity: 1 }]);
    }

    setItemName('');
    setItemPrice('');
  };

  const removeItem = (name: string) => {
    setItems(items.filter(item => item.name !== name));
  };

  const updateQuantity = (name: string, delta: number) => {
    setItems(items.map(item => {
      if (item.name === name) {
        const newQuantity = item.quantity + delta;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const generateCheckout = async () => {
    if (items.length === 0) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('Please sign in to generate invoices');
      return;
    }

    const description = items.map(item => `${item.quantity}x ${item.name}`).join(', ');
    const amountMsats = total * 1000;
    const paymentHash = Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');

    const mockBolt11 = `lnbc${total}n1p${paymentHash.substring(0, 50)}`;
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

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
      setShowInvoice(true);
    }
  };

  const resetCart = () => {
    setItems([]);
    setShowInvoice(false);
    setInvoice(null);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-green-100 rounded-lg">
          <ShoppingCart className="w-6 h-6 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">POS Terminal</h2>
      </div>

      {!showInvoice ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Item Name
              </label>
              <input
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="Coffee"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && addItem()}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price (sats)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={itemPrice}
                  onChange={(e) => setItemPrice(e.target.value)}
                  placeholder="5000"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  min="1"
                  onKeyPress={(e) => e.key === 'Enter' && addItem()}
                />
                <button
                  onClick={addItem}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Cart</h3>
            </div>

            <div className="divide-y divide-gray-200">
              {items.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>Cart is empty</p>
                </div>
              ) : (
                items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-500">{item.price} sats each</p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.name, -1)}
                          className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-semibold"
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.name, 1)}
                          className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-semibold"
                        >
                          +
                        </button>
                      </div>

                      <p className="w-24 text-right font-semibold text-gray-900">
                        {item.price * item.quantity} sats
                      </p>

                      <button
                        onClick={() => removeItem(item.name)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between text-lg font-bold">
              <span className="text-gray-900">Total:</span>
              <span className="text-gray-900">{total} sats</span>
            </div>
          </div>

          <button
            onClick={generateCheckout}
            disabled={items.length === 0}
            className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Generate Payment Invoice
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <p className="text-sm text-green-800 mb-2">
              <strong>Total Amount:</strong> {total} sats
            </p>
            <p className="text-sm text-green-800">
              <strong>Items:</strong> {items.map(item => `${item.quantity}x ${item.name}`).join(', ')}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-xs font-mono break-all text-gray-600">{invoice}</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={resetCart}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              New Sale
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
