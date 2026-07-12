// generate-hash.js
// generate-hash.js
require("dotenv").config();
const bcrypt = require("bcryptjs");

const SALT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS, 10) || 12;
const label = process.argv[2] || "password";
const password = process.argv[3] || process.argv[2];

if (!password) {
  console.error("Usage: node generate-hash.js [label] <password>");
  process.exit(1);
}

const hash = bcrypt.hashSync(password, SALT_ROUNDS);

console.log(`${label}:`);
console.log(`Password: ${password}`);
console.log(`Hash: ${hash}`);
console.log(`Verify: ${bcrypt.compareSync(password, hash)}`);
