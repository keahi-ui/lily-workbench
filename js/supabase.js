/* ============================================
   Supabase 客户端配置
   ============================================ */

const SUPABASE_URL = 'https://rgtfiaueckmtzxryzgye.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJndGZpYXVlY2ttdHp4cnl6Z3llIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0NzkzNzQsImV4cCI6MjEwMTA1NTM3NH0.MQyFEN8r1OSS4sekwa-Crf_qaobU0A35JYSdDMILp9A';

const supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;
