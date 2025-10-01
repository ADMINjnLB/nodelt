export interface Invoice {
  id: string;
  user_id: string;
  payment_request: string;
  payment_hash: string;
  amount_msats: number;
  description: string;
  status: 'pending' | 'paid' | 'expired' | 'canceled';
  expires_at: string;
  paid_at?: string;
  created_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  payment_hash: string;
  payment_request: string;
  amount_msats: number;
  fee_msats: number;
  destination: string;
  status: 'pending' | 'succeeded' | 'failed';
  error_message?: string;
  paid_at?: string;
  created_at: string;
}

export interface Channel {
  id: string;
  user_id: string;
  channel_id: string;
  remote_pubkey: string;
  capacity_sats: number;
  local_balance_sats: number;
  remote_balance_sats: number;
  status: 'opening' | 'active' | 'closing' | 'closed';
  is_active: boolean;
  is_public: boolean;
  opened_at: string;
  closed_at?: string;
  updated_at: string;
}

export interface LightningNode {
  id: string;
  user_id?: string;
  node_pubkey: string;
  alias: string;
  color: string;
  total_capacity_sats: number;
  num_channels: number;
  last_update: string;
  created_at: string;
}

export interface NetworkStats {
  id: string;
  snapshot_date: string;
  total_nodes: number;
  total_channels: number;
  total_capacity_sats: number;
  avg_channel_size_sats: number;
  created_at: string;
}
