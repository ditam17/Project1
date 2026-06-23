const bcrypt = require("bcryptjs");

const password = process.argv[2] || "teacher123";
const hash = bcrypt.hashSync(password, 10);

console.log("Password:", password);
console.log("Hash:", hash);
console.log("Verify:", bcrypt.compareSync(password, hash));
