import { useState, useEffect } from 'react';
import { Globe, Search, Activity, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { LightningNode, NetworkStats } from '../types/lightning';

export function NetworkExplorer() {
  const [nodes, setNodes] = useState<LightningNode[]>([]);
  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNetworkData();
  }, []);

  const loadNetworkData = async () => {
    const [nodesRes, statsRes] = await Promise.all([
      supabase
        .from('lightning_nodes')
        .select('*')
        .order('total_capacity_sats', { ascending: false })
        .limit(50),
      supabase
        .from('network_stats')
        .select('*')
        .order('snapshot_date', { ascending: false })
        .limit(1)
    ]);

    if (nodesRes.data) setNodes(nodesRes.data);
    if (statsRes.data && statsRes.data.length > 0) setStats(statsRes.data[0]);

    if (nodesRes.data?.length === 0) {
      await seedSampleData();
      loadNetworkData();
    }

    setLoading(false);
  };

  const seedSampleData = async () => {
    const sampleNodes = [
      { alias: 'ACINQ', color: '#FF6B6B', total_capacity_sats: 50000000, num_channels: 2500 },
      { alias: 'Voltage', color: '#4ECDC4', total_capacity_sats: 45000000, num_channels: 1800 },
      { alias: 'LNBig', color: '#FFE66D', total_capacity_sats: 42000000, num_channels: 2200 },
      { alias: 'OpenNode', color: '#95E1D3', total_capacity_sats: 38000000, num_channels: 1500 },
      { alias: 'Bitrefill', color: '#F38181', total_capacity_sats: 35000000, num_channels: 1200 }
    ];

    for (const node of sampleNodes) {
      const pubkey = Array.from({ length: 66 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('');

      await supabase.from('lightning_nodes').insert({
        node_pubkey: pubkey,
        alias: node.alias,
        color: node.color,
        total_capacity_sats: node.total_capacity_sats,
        num_channels: node.num_channels,
        last_update: new Date().toISOString()
      });
    }

    await supabase.from('network_stats').insert({
      snapshot_date: new Date().toISOString().split('T')[0],
      total_nodes: 16000,
      total_channels: 75000,
      total_capacity_sats: 5000000000,
      avg_channel_size_sats: 66666
    });
  };

  const filteredNodes = nodes.filter(node =>
    node.alias.toLowerCase().includes(searchTerm.toLowerCase()) ||
    node.node_pubkey.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatSats = (sats: number) => {
    if (sats >= 1000000) {
      return `${(sats / 1000000).toFixed(2)}M`;
    }
    return new Intl.NumberFormat('en-US').format(Math.floor(sats));
  };

  const formatBTC = (sats: number) => {
    return (sats / 100000000).toFixed(2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-100 rounded-lg">
            <Globe className="w-6 h-6 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Lightning Network Explorer</h2>
        </div>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-blue-600" />
                <p className="text-xs font-medium text-blue-700">Total Nodes</p>
              </div>
              <p className="text-2xl font-bold text-blue-900">
                {new Intl.NumberFormat('en-US').format(stats.total_nodes)}
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-purple-600" />
                <p className="text-xs font-medium text-purple-700">Total Channels</p>
              </div>
              <p className="text-2xl font-bold text-purple-900">
                {new Intl.NumberFormat('en-US').format(stats.total_channels)}
              </p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-4 h-4 text-orange-600" />
                <p className="text-xs font-medium text-orange-700">Network Capacity</p>
              </div>
              <p className="text-2xl font-bold text-orange-900">
                {formatBTC(stats.total_capacity_sats)} BTC
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-green-600" />
                <p className="text-xs font-medium text-green-700">Avg Channel Size</p>
              </div>
              <p className="text-2xl font-bold text-green-900">
                {formatSats(stats.avg_channel_size_sats)}
              </p>
            </div>
          </div>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search nodes by alias or pubkey..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Node
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Pubkey
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Channels
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Capacity
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Last Update
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredNodes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No nodes found
                  </td>
                </tr>
              ) : (
                filteredNodes.map((node) => (
                  <tr key={node.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: node.color }}
                        />
                        <span className="font-medium text-gray-900">{node.alias}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs text-gray-600">
                        {node.node_pubkey.substring(0, 16)}...
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-900">
                      {new Intl.NumberFormat('en-US').format(node.num_channels)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                      {formatSats(node.total_capacity_sats)} sats
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-500">
                      {new Date(node.last_update).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
