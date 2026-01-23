-- Create initial admin account
-- Username: admin
-- Password: admin123 (hashed with bcrypt)

INSERT INTO admins (username, password_hash, email, is_active, created_at, updated_at)
VALUES (
    'admin',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',  -- password: admin123
    'admin@example.com',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (username) DO NOTHING;
