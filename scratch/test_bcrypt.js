const bcrypt = require('../backend/node_modules/bcrypt');

const passwords = {
  admin1: '$2b$12$Q2Ora9HB/7Tu1XTvxo/ziegTrGoNNIluwPbGBWjTArObufpWELzwq',
  officer1: '$2b$12$Ko4Hyd6AAkWj9teXIpZlaOB5Xty1.5519tAyiodAJxMV1V8/jTreO',
  farmer1: '$2b$12$r6Y3jUQ6wQe3kDkQGhDpn.Wr.tGlt2u0BHOUEB8tebtashOmIM9Va'
};

for (const [plain, hash] of Object.entries(passwords)) {
  const match = bcrypt.compareSync(plain, hash);
  const wrongMatch = bcrypt.compareSync('wrongpass', hash);
  console.log(`${plain}: match=${match}, wrongMatch=${wrongMatch}`);
}
