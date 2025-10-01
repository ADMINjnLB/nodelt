import { useState, useEffect } from 'react';
import { Network, Plus, X, Wifi, WifiOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Channel } from '../types/lightning';

export function ChannelManager() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [newChannel, setNewChannel] = useState({
    remotePubkey: '',
    capacity: ''
  });

  useEffect(() => {
    loadChannels();
  }, []);

  const loadChannels = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('channels')
      .select('*')
      .eq('user_id', user.id)
      .order('opened_at', { ascending: false });

    if (!error && data) {
      setChannels(data);
    }
    setLoading(false);
  };

  const openChannel = async () => {
    if (!newChannel.remotePubkey.trim() || !newChannel.capacity || parseFloat(newChannel.capacity) <= 0) {
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const capacitySats = parseFloat(newChannel.capacity);
    const channelId = Array.from({ length: 16 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');

    const { error } = await supabase.from('channels').insert({
      user_id: user.id,
      channel_id: channelId,
      remote_pubkey: newChannel.remotePubkey,
      capacity_sats: capacitySats,
      local_balance_sats: capacitySats,
      remote_balance_sats: 0,
      status: 'active',
      is_active: true,
      is_public: true,
      opened_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    if (!error) {
      setShowNewChannel(false);
      setNewChannel({ remotePubkey: '', capacity: '' });
      loadChannels();
    }
  };

  const closeChannel = async (channelId: string) => {
    const { error } = await supabase
      .from('channels')
      .update({
        status: 'closed',
        is_active: false,
        closed_at: new Date().toISOString()
      })
      .eq('channel_id', channelId);

    if (!error) {
      loadChannels();
    }
  };

  const formatSats = (sats: number) => {
    return new Intl.NumberFormat('en-US').format(Math.floor(sats));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Network className="w-6 h-6 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Channel Management</h2>
        </div>

        <button
          onClick={() => setShowNewChannel(!showNewChannel)}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Open Channel
        </button>
      </div>

      {showNewChannel && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-gray-900 mb-4">Open New Channel</h3>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Remote Node Pubkey
              </label>
              <input
                type="text"
                value={newChannel.remotePubkey}
                onChange={(e) => setNewChannel({ ...newChannel, remotePubkey: e.target.value })}
                placeholder="03abc123..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Capacity (sats)
              </label>
              <input
                type="number"
                value={newChannel.capacity}
                onChange={(e) => setNewChannel({ ...newChannel, capacity: e.target.value })}
                placeholder="1000000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={openChannel}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Confirm
              </button>
              <button
                onClick={() => setShowNewChannel(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {channels.length === 0 ? (
          <div className="text-center py-12">
            <Network className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No channels yet</p>
            <p className="text-sm text-gray-400 mt-1">Open your first channel to start transacting</p>
          </div>
        ) : (
          channels.map((channel) => (
            <div
              key={channel.id}
              className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {channel.is_active ? (
                    <Wifi className="w-5 h-5 text-green-500" />
                  ) : (
                    <WifiOff className="w-5 h-5 text-gray-400" />
                  )}
                  <div>
                    <p className="font-mono text-sm text-gray-600">
                      {channel.remote_pubkey.substring(0, 20)}...
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        channel.status === 'active' ? 'bg-green-100 text-green-700' :
                        channel.status === 'opening' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {channel.status}
                      </span>
                      {channel.is_public && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                          Public
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {channel.is_active && (
                  <button
                    onClick={() => closeChannel(channel.channel_id)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Capacity</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatSats(channel.capacity_sats)} sats
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1">Local Balance</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatSats(channel.local_balance_sats)} sats
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1">Remote Balance</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatSats(channel.remote_balance_sats)} sats
                  </p>
                </div>
              </div>

              <div className="mt-3 bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-500 h-full transition-all"
                  style={{
                    width: `${(channel.local_balance_sats / channel.capacity_sats) * 100}%`
                  }}
                />
              </div>

              <p className="text-xs text-gray-500 mt-2">
                Opened {new Date(channel.opened_at).toLocaleDateString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
