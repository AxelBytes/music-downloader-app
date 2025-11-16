-- Script para crear keys de activación en Supabase
-- Ejecutar en el SQL Editor de Supabase

-- Insertar keys de activación de prueba
INSERT INTO activation_keys (key, is_used, user_id, created_at) VALUES
('GROOVIFY-2024-001', false, null, now()),
('GROOVIFY-2024-002', false, null, now()),
('GROOVIFY-2024-003', false, null, now()),
('GROOVIFY-2024-004', false, null, now()),
('GROOVIFY-2024-005', false, null, now()),
('GROOVIFY-2024-006', false, null, now()),
('GROOVIFY-2024-007', false, null, now()),
('GROOVIFY-2024-008', false, null, now()),
('GROOVIFY-2024-009', false, null, now()),
('GROOVIFY-2024-010', false, null, now());

-- Verificar las keys creadas
SELECT * FROM activation_keys ORDER BY created_at DESC;
