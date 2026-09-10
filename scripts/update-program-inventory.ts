/** Persist the shared program facts; preserves dates, pricing, visibility and course content. */
import {PrismaClient} from '@prisma/client';
import {inventoryFacts} from '../src/lib/program-policy';
const db=new PrismaClient();
async function main(){
 const programs=await db.program.findMany();
 const changes=programs.flatMap(program=>{
  const patch=inventoryFacts(program.category);
  if(Object.entries(patch).every(([key,value])=>(program as Record<string,unknown>)[key]===value)) return [];
  console.log(JSON.stringify({id:program.id,title:program.title,before:{category:program.category,locationFormat:program.locationFormat,capacity:program.capacity,teachingHoursProf:program.teachingHoursProf,teachingHoursTA:program.teachingHoursTA},after:patch},null,2));
  return [{program,patch}];
 });
 console.log(`${changes.length} programs ${process.argv.includes('--apply')?'to update':'in preview; no writes'}. Legacy Summer Camp records are classified as Seoul; check any Global cohorts before applying.`);
 if(!process.argv.includes('--apply'))return;
 await db.$transaction(async tx=>{for(const {program,patch} of changes){const result=await tx.program.updateMany({where:{id:program.id,updatedAt:program.updatedAt},data:patch});if(result.count!==1)throw new Error('Inventory changed during this run.');}});
}
main().catch(()=>{console.error('Inventory update failed. Review the database connection and retry.');process.exitCode=1;}).finally(()=>db.$disconnect());
