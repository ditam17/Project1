const bcrypt = require("bcryptjs");

const rounds = 12;

const passwords = [
  { user: "teachers", password: "Teacher@123" },
  { user: "students", password: "Student@123" },
];

passwords.forEach((p) => {
  const hash = bcrypt.hashSync(p.password, rounds);
  console.log(`\n${p.user}:`);
  console.log(`Password: ${p.password}`);
  console.log(`Hash: ${hash}`);
  console.log(`Verify: ${bcrypt.compareSync(p.password, hash)}`);
});
