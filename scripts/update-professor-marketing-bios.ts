/** Portable inventory update. Preview by default; use --apply after reviewing the output. */
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'node:fs';
const prisma = new PrismaClient();
const catalog = JSON.parse(readFileSync(new URL('../src/data/reviewed-professor-bios.json', import.meta.url), 'utf8')) as {
  profiles: Array<{name: string; aliases: string[]; role: string; bio: string; sources: string[]}>;
};
const normalize = (name: string) => name.trim().toLowerCase().replace(/^(professor|prof\.?|dr\.?)\s+/, '').replace(/\s+/g, ' ');
async function main() {
  const professors = await prisma.professor.findMany();
  const changes = professors.flatMap(current => {
    const reviewed = catalog.profiles.find(p => [p.name, ...p.aliases].some(name => normalize(name) === normalize(current.name)));
    if (!reviewed) { console.log(`REVIEW NEEDED: ${current.name} — unchanged; no verified match.`); return []; }
    if (current.bio === reviewed.bio && current.role === reviewed.role && current.name === reviewed.name) return [];
    console.log(JSON.stringify({id: current.id, before: {name: current.name, role: current.role, bio: current.bio}, after: {name: reviewed.name, role: reviewed.role, bio: reviewed.bio}, sources: reviewed.sources}, null, 2));
    return [{current, reviewed}];
  });
  console.log(`${changes.length} faculty records ${process.argv.includes('--apply') ? 'to update' : 'in preview; no writes'}.`);
  if (!process.argv.includes('--apply')) return;
  await prisma.$transaction(async tx => {
    for (const {current, reviewed} of changes) {
      // Protect edits made after the preview was loaded.
      const result = await tx.professor.updateMany({where: {id: current.id, updatedAt: current.updatedAt}, data: {name: reviewed.name, role: reviewed.role, bio: reviewed.bio}});
      if (result.count !== 1) throw new Error('Inventory changed during this run. Review again.');
    }
  });
  console.log('Inventory updated. Program links, course descriptions and images were preserved.');
}
main().catch(() => { console.error('Inventory update failed; review the database connection and retry.'); process.exitCode = 1; }).finally(() => prisma.$disconnect());
