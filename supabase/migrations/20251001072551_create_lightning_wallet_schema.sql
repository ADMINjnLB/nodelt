/*
  # Lightning Wallet Application Schema

  1. New Tables
    - `invoices`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `payment_request` (text) - BOLT11 invoice string
      - `payment_hash` (text, unique) - Invoice payment hash
      - `amount_msats` (bigint) - Amount in millisatoshis
      - `description` (text) - Invoice description
      - `status` (text) - pending, paid, expired, canceled
      - `expires_at` (timestamptz) - Invoice expiration
      - `paid_at` (timestamptz, nullable) - Payment timestamp
      - `created_at` (timestamptz)
      
    - `payments`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `payment_hash` (text) - Payment identifier
      - `payment_request` (text) - BOLT11 invoice paid
      - `amount_msats` (bigint) - Amount sent
      - `fee_msats` (bigint) - Fee paid
      - `destination` (text) - Recipient node pubkey
      - `status` (text) - pending, succeeded, failed
      - `error_message` (text, nullable)
      - `paid_at` (timestamptz, nullable)
      - `created_at` (timestamptz)
      
    - `channels`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `channel_id` (text, unique) - Lightning channel ID
      - `remote_pubkey` (text) - Peer node pubkey
      - `capacity_sats` (bigint) - Total channel capacity
      - `local_balance_sats` (bigint) - Our balance
      - `remote_balance_sats` (bigint) - Their balance
      - `status` (text) - opening, active, closing, closed
      - `is_active` (boolean) - Channel active status
      - `is_public` (boolean) - Public or private channel
      - `opened_at` (timestamptz)
      - `closed_at` (timestamptz, nullable)
      - `updated_at` (timestamptz)
      
    - `lightning_nodes`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `node_pubkey` (text, unique) - Node public key
      - `alias` (text) - Node alias/name
      - `color` (text) - Node color (hex)
      - `total_capacity_sats` (bigint) - Total network capacity
      - `num_channels` (integer) - Number of channels
      - `last_update` (timestamptz)
      - `created_at` (timestamptz)
      
    - `network_stats`
      - `id` (uuid, primary key)
      - `snapshot_date` (date, unique)
      - `total_nodes` (integer)
      - `total_channels` (integer)
      - `total_capacity_sats` (bigint)
      - `avg_channel_size_sats` (bigint)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Public read access for network stats
    
  3. Indexes
    - Add indexes for common query patterns
    - Payment hash lookups
    - User data filtering
    - Channel status queries
*/

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  payment_request text NOT NULL,
  payment_hash text UNIQUE NOT NULL,
  amount_msats bigint NOT NULL,
  description text DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  expires_at timestamptz NOT NULL,
  paid_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  payment_hash text NOT NULL,
  payment_request text NOT NULL,
  amount_msats bigint NOT NULL,
  fee_msats bigint DEFAULT 0,
  destination text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  error_message text,
  paid_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create channels table
CREATE TABLE IF NOT EXISTS channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  channel_id text UNIQUE NOT NULL,
  remote_pubkey text NOT NULL,
  capacity_sats bigint NOT NULL,
  local_balance_sats bigint NOT NULL,
  remote_balance_sats bigint NOT NULL,
  status text NOT NULL DEFAULT 'opening',
  is_active boolean DEFAULT false,
  is_public boolean DEFAULT false,
  opened_at timestamptz DEFAULT now(),
  closed_at timestamptz,
  updated_at timestamptz DEFAULT now()
);

-- Create lightning_nodes table
CREATE TABLE IF NOT EXISTS lightning_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  node_pubkey text UNIQUE NOT NULL,
  alias text NOT NULL,
  color text DEFAULT '#3399ff',
  total_capacity_sats bigint DEFAULT 0,
  num_channels integer DEFAULT 0,
  last_update timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create network_stats table
CREATE TABLE IF NOT EXISTS network_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date date UNIQUE NOT NULL,
  total_nodes integer NOT NULL,
  total_channels integer NOT NULL,
  total_capacity_sats bigint NOT NULL,
  avg_channel_size_sats bigint NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE lightning_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE network_stats ENABLE ROW LEVEL SECURITY;

-- Invoices policies
CREATE POLICY "Users can view own invoices"
  ON invoices FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own invoices"
  ON invoices FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own invoices"
  ON invoices FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own invoices"
  ON invoices FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Payments policies
CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own payments"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payments"
  ON payments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own payments"
  ON payments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Channels policies
CREATE POLICY "Users can view own channels"
  ON channels FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own channels"
  ON channels FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own channels"
  ON channels FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own channels"
  ON channels FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Lightning nodes policies
CREATE POLICY "Users can view all nodes"
  ON lightning_nodes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create nodes"
  ON lightning_nodes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update own nodes"
  ON lightning_nodes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Network stats policies (public read)
CREATE POLICY "Anyone can view network stats"
  ON network_stats FOR SELECT
  TO authenticated
  USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_payment_hash ON invoices(payment_hash);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_hash ON payments(payment_hash);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_channels_user_id ON channels(user_id);
CREATE INDEX IF NOT EXISTS idx_channels_status ON channels(status);
CREATE INDEX IF NOT EXISTS idx_channels_is_active ON channels(is_active);
CREATE INDEX IF NOT EXISTS idx_lightning_nodes_pubkey ON lightning_nodes(node_pubkey);
CREATE INDEX IF NOT EXISTS idx_network_stats_date ON network_stats(snapshot_date);