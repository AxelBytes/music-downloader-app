// Script para generar claves de activación seguras
const crypto = require('crypto');

function generateRandomString(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    result += chars[randomIndex];
  }
  
  return result;
}

function generateActivationKey() {
  const randomPart = generateRandomString(8);
  const year = new Date().getFullYear();
  return `GROOVIFY-${randomPart}-${year}`;
}

// Generar 10 claves únicas
const activationKeys = [];
const usedKeys = new Set();

console.log('🔐 GENERANDO CLAVES DE ACTIVACIÓN SEGURAS PARA GROOVIFY\n');

while (activationKeys.length < 10) {
  const key = generateActivationKey();
  
  if (!usedKeys.has(key)) {
    usedKeys.add(key);
    activationKeys.push(key);
  }
}

console.log('✅ CLAVES GENERADAS:');
activationKeys.forEach((key, index) => {
  console.log(`${index + 1}. ${key}`);
});

console.log('\n📋 SQL PARA INSERTAR EN SUPABASE:');
console.log('-- Insertar las nuevas claves de activación');
activationKeys.forEach((key, index) => {
  const id = crypto.randomUUID();
  console.log(`INSERT INTO activation_keys (id, key_value, is_used) VALUES ('${id}', '${key}', false);`);
});

console.log('\n🔒 FORMATO DE SEGURIDAD:');
console.log('- Formato: GROOVIFY-{8_CARACTERES_ALEATORIOS}-{AÑO}');
console.log('- Total de combinaciones posibles: 36^8 = ~2.8 trillones');
console.log('- Difícil de adivinar por fuerza bruta');
console.log('- Fácil de recordar para usuarios legítimos');

module.exports = { activationKeys };
