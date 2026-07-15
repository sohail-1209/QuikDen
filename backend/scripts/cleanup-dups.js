const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

(async () => {
  const ls = await p.listing.findMany({ select: { id: true, title: true, city: true, type: true } });
  const seen = new Map();
  const del = [];
  for (const l of ls) {
    const k = l.title + '|' + l.city + '|' + l.type;
    if (seen.has(k)) del.push(l.id);
    else seen.set(k, l.id);
  }
  console.log('Deleting', del.length, 'duplicates');
  for (const id of del) {
    await p.listing.delete({ where: { id } });
  }
  console.log('Remaining:', await p.listing.count());
  await p.$disconnect();
})();
