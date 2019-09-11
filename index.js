const ecc = require('eosjs-ecc');

const public = 'EOS6cVaU9m7gVXtR5MJ1oMAua4RXj9MhWTXTVDmakjqPoxFwUKFjL';
const private = '5Kbh2KD4tBvCJVY4kAkvZhPCT88yj9s3GuiRg3kG2xGjyHap2xW';

const data = 'gm4dgnrzhege:977827:1568224922:10140184828739867366';
console.log(`user generated seed data: ${data}`)

for (var i = 0; i < 10; i++) {
  console.log(`\nusing nonce ${i}...`);

  const signed = ecc.sign(data, private, 'utf8', i);
  console.log(`signature: ${signed}`)

  const verified = ecc.verify(signed, data, public)
  console.log("is signature valid?", verified)
}
