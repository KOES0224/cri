import { createProgram, getPrograms } from "./src/app/actions/programs";

async function test() {
  console.log("Testing getPrograms...");
  const initial = await getPrograms();
  console.log(`Got ${initial.length} programs.`);

  console.log("Creating test program...");
  const res = await createProgram({
    title: "Runtime Test Program",
    description: "Testing if this crashes",
    category: "Other",
    status: "OPEN",
    subCategory: "",
    tuition: null
  });
  console.log("Create result:", res);

  console.log("Testing getPrograms after create...");
  const final = await getPrograms();
  console.log(`Got ${final.length} programs.`);
}

test().catch(console.error);
