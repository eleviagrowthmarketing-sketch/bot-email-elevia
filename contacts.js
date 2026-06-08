const fs = require('fs');
const csv = require('csv-parser');

function loadContacts(filePath) {
  return new Promise((resolve, reject) => {
    const contacts = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => contacts.push(row))
      .on('end', () => resolve(contacts))
      .on('error', reject);
  });
}

module.exports = { loadContacts };
