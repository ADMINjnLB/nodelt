import { useState, useEffect } from 'react';
import { Wallet, TrendingUp, TrendingDown, Zap, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Invoice, Payment, Channel } from '../types/lightning';

export function Dashboard() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [balanceVisible, setBalanceVisible] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [invoicesRes, paymentsRes, channelsRes] = await Promise.all([
      supabase.from('invoices').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
      supabase.from('payments').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
      supabase.from('channels').select('*').eq('user_id', user.id).eq('is_active', true)
    ]);

    setInvoices(invoicesRes.data || []);
    setPayments(paymentsRes.data || []);
    setChannels(channelsRes.data || []);
    setLoading(false);
  };

  const totalBalance = channels.reduce((sum, ch) => sum + ch.local_balance_sats, 0);
  const totalCapacity = channels.reduce((sum, ch) => sum + ch.capacity_sats, 0);
  const totalReceived = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount_msats / 1000, 0);
  const totalSent = payments.filter(p => p.status === 'succeeded').reduce((sum, p) => sum + p.amount_msats / 1000, 0);

  const formatSats = (sats: number) => {
    return new Intl.NumberFormat('en-US').format(Math.floor(sats));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-orange-500" />
              <h3 className="text-sm font-medium text-gray-600">Balance</h3>
            </div>
            <button onClick={() => setBalanceVisible(!balanceVisible)} className="text-gray-400 hover:text-gray-600">
              {balanceVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {balanceVisible ? `${formatSats(totalBalance)} sats` : '••••••'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {channels.length} active {channels.length === 1 ? 'channel' : 'channels'}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            <h3 className="text-sm font-medium text-gray-600">Capacity</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatSats(totalCapacity)} sats</p>
          <p className="text-xs text-gray-500 mt-1">
            {totalBalance > 0 ? `${((totalBalance / totalCapacity) * 100).toFixed(1)}% available` : '0% available'}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-5 h-5 text-green-500" />
            <h3 className="text-sm font-medium text-gray-600">Received</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatSats(totalReceived)} sats</p>
          <p className="text-xs text-gray-500 mt-1">
            {invoices.filter(i => i.status === 'paid').length} paid invoices
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-red-500" />
            <h3 className="text-sm font-medium text-gray-600">Sent</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatSats(totalSent)} sats</p>
          <p className="text-xs text-gray-500 mt-1">
            {payments.filter(p => p.status === 'succeeded').length} completed payments
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Invoices</h3>
          <div className="space-y-3">
            {invoices.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No invoices yet</p>
            ) : (
              invoices.slice(0, 5).map(invoice => (
                <div key={invoice.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{invoice.description || 'No description'}</p>
                    <p className="text-xs text-gray-500">{new Date(invoice.created_at).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">+{formatSats(invoice.amount_msats / 1000)} sats</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      invoice.status === 'paid' ? 'bg-green-100 text-green-700' :
                      invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {invoice.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Payments</h3>
          <div className="space-y-3">
            {payments.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No payments yet</p>
            ) : (
              payments.slice(0, 5).map(payment => (
                <div key={payment.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{payment.destination.substring(0, 20)}...</p>
                    <p className="text-xs text-gray-500">{new Date(payment.created_at).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">-{formatSats(payment.amount_msats / 1000)} sats</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      payment.status === 'succeeded' ? 'bg-green-100 text-green-700' :
                      payment.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {payment.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
