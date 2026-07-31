-- Lily Workbench - Supabase 数据库初始化
-- 在 Supabase SQL Editor 中运行此脚本

-- 1. 存储所有业务数据（打卡、愿望清单、Todo等）
CREATE TABLE IF NOT EXISTS records (
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    data JSONB NOT NULL DEFAULT '{}',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (table_name, record_id)
);

-- 2. 存储应用设置（自定义类别、经期设置、密码等）
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. 开启行级安全
ALTER TABLE records ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- 4. 允许匿名访问（个人工具，不需要登录）
CREATE POLICY "anon_all" ON records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON settings FOR ALL USING (true) WITH CHECK (true);

-- 5. 创建索引加速查询
CREATE INDEX IF NOT EXISTS idx_records_table ON records(table_name);
CREATE INDEX IF NOT EXISTS idx_records_updated ON records(updated_at);
