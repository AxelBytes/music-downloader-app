-- Script para insertar las nuevas claves de activación seguras
-- Ejecutar en el SQL Editor de Supabase

-- Insertar las 10 nuevas claves de activación con formato seguro
INSERT INTO activation_keys (id, key, is_used, user_id, created_at) VALUES
('1d89f406-73b7-43d4-8137-e4d310364322', 'GROOVIFY-CAKPQC0O-2025', false, null, now()),
('57893b86-1566-4620-8229-98805ef46d45', 'GROOVIFY-20KK56XI-2025', false, null, now()),
('a0459516-645d-460a-8c41-b86883083800', 'GROOVIFY-DVV95F2W-2025', false, null, now()),
('2c32d0b6-5039-433b-a6eb-479b0bb70d8c', 'GROOVIFY-E3T6VU18-2025', false, null, now()),
('4e68532b-1477-4bc6-87f7-eac27c9556eb', 'GROOVIFY-FIRYWMHS-2025', false, null, now()),
('e250f44e-8929-40e7-951d-3a67d9ea0ce8', 'GROOVIFY-TZ37JEED-2025', false, null, now()),
('647e7867-e7de-4a6e-ab36-73e5fb804e53', 'GROOVIFY-E09LW8UI-2025', false, null, now()),
('e747d33f-ecd8-41c2-9eda-cf6d2d0a5260', 'GROOVIFY-C2UAB9TL-2025', false, null, now()),
('7080d5bc-b6cd-4eaf-97fd-8319df83ef66', 'GROOVIFY-AZ91E4TN-2025', false, null, now()),
('b6ffd9fd-07f6-4247-b2d6-303ccda2833b', 'GROOVIFY-ROTZJ1D3-2025', false, null, now());

-- Verificar las nuevas claves insertadas
SELECT * FROM activation_keys WHERE key LIKE 'GROOVIFY-%2025' ORDER BY created_at DESC;

-- Mostrar todas las claves disponibles (no usadas)
SELECT key, created_at FROM activation_keys WHERE is_used = false ORDER BY created_at DESC;
