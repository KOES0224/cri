/**
 * Program page addresses (slugs) against a disposable LOCAL PostgreSQL database with the current schema: what the
 * dashboard saves, what an old address resolves to, and what the existence check tells the proxy.
 */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {PrismaClient} from '@prisma/client';
const url = new URL(process.env.DATABASE_URL || 'http://missing');
if (!['127.0.0.1','localhost'].includes(url.hostname)) throw new Error('Integration tests require a disposable LOCAL database.');

let session: any = null;
const pinged: string[][] = [];
require.cache[require.resolve('next-auth')] = {exports: {getServerSession: async () => session}} as any;
require.cache[require.resolve('next/cache')] = {exports: {revalidatePath: () => {}, revalidateTag: () => {}, unstable_cache: (fn: any) => fn}} as any;
require.cache[require.resolve('../src/lib/indexnow')] = {exports: {notifySearchEngines: (paths: string[]) => { pinged.push(paths); }}} as any;
const {prisma: db} = require('../src/lib/prisma') as {prisma: PrismaClient};
const {createProgram, updateProgram, deleteProgram} = require('../src/app/actions/programs');
const {getProgramByRef} = require('../src/lib/public-data');
const {GET: exists} = require('../src/app/api/public/exists/route');
const {CURRENT_REF_HEADER} = require('../src/lib/missing-page');

// A unique word per run so slugs never meet rows left by an earlier run.
const key = randomUUID().replaceAll('-', '').slice(0, 10);
const adminId = `slug-admin-${key}`;
const base = {description: 'Local only', category: 'Winter Online Research Program', status: 'OPEN', endDate: new Date(Date.now() + 30 * 86400000)};
const check = async (kind: string, ref: string) => exists(new Request(`http://localhost/api/public/exists?kind=${kind}&id=${encodeURIComponent(ref)}`));

test('program slugs: made on save, unique, renamed with the old address kept', async () => {
  await db.user.create({data: {id: adminId, email: `${adminId}@example.test`, role: 'ADMIN'}});
  session = {user: {id: adminId, role: 'ADMIN'}};
  const created: string[] = [];
  try {
    // Made from the title; a second program with the same title gets -2.
    const first = await createProgram({...base, title: `The Quiet ${key}: A Study of Something`});
    assert.equal(first.success, true);
    created.push(first.program.id);
    assert.equal(first.program.slug, `quiet-${key}`);
    const twin = await createProgram({...base, title: `The Quiet ${key}: A Study of Something`});
    created.push(twin.program.id);
    assert.equal(twin.program.slug, `quiet-${key}-2`);
    assert.deepEqual(pinged.at(-1)?.[0], `/research/program/quiet-${key}-2`);

    // A typed slug is normalized; one that another program has is refused and nothing is created.
    const typed = await createProgram({...base, title: `Typed ${key}`, slug: ` Loud ${key} `});
    created.push(typed.program.id);
    assert.equal(typed.program.slug, `loud-${key}`);
    const before = await db.program.count();
    const clash = await createProgram({...base, title: `Clash ${key}`, slug: `quiet-${key}`});
    assert.equal(clash.success, false);
    assert.match(clash.error, /already uses the page address/);
    assert.equal(await db.program.count(), before);
    const malformed = await createProgram({...base, title: `Bad ${key}`, slug: 'ab'});
    assert.equal(malformed.success, false);
    assert.match(malformed.error, /cannot be a page address/);
    assert.equal(await db.program.count(), before);

    // A title with no usable letters keeps the id address until someone types a slug.
    const hangul = await createProgram({...base, title: '겨울 온라인 리서치'});
    created.push(hangul.program.id);
    assert.equal(hangul.program.slug, null);

    // Saving without touching the address keeps it, even when the title changes.
    const retitled = await updateProgram(first.program.id, {title: `Renamed ${key}`, slug: `quiet-${key}`});
    assert.equal(retitled.program.slug, `quiet-${key}`);
    const untouched = await updateProgram(first.program.id, {status: 'CLOSED'});
    assert.equal(untouched.program.slug, `quiet-${key}`);

    // Renaming: the new address is current, the old slug and the id still find the program, engines hear about both.
    const renamed = await updateProgram(first.program.id, {slug: `calm-${key}`});
    assert.equal(renamed.success, true);
    assert.equal(renamed.program.slug, `calm-${key}`);
    assert.ok(pinged.at(-1)?.includes(`/research/program/calm-${key}`));
    assert.ok(pinged.at(-1)?.includes(`/research/program/quiet-${key}`));
    for (const ref of [`calm-${key}`, `quiet-${key}`, first.program.id]) {
      assert.equal((await getProgramByRef(ref))?.id, first.program.id, ref);
    }
    assert.equal(await getProgramByRef(`nobody-${key}`), null);

    // The old slug stays reserved: nobody else can take it, the same program can go back to it.
    const steal = await updateProgram(twin.program.id, {slug: `quiet-${key}`});
    assert.equal(steal.success, false);
    assert.equal((await db.program.findUnique({where: {id: twin.program.id}}))?.slug, `quiet-${key}-2`);
    const back = await updateProgram(first.program.id, {slug: `quiet-${key}`});
    assert.equal(back.program.slug, `quiet-${key}`);
    assert.equal(await db.programSlug.count({where: {programId: first.program.id}}), 2);
    await updateProgram(first.program.id, {slug: `calm-${key}`});

    // Emptying the field asks for one made from the (new) title.
    const regenerated = await updateProgram(typed.program.id, {title: `Fresh ${key}`, slug: ''});
    assert.equal(regenerated.program.slug, `fresh-${key}`);

    // What the proxy is told: current address → 204; id or old slug → 204 plus where to go; unknown or hidden → 404.
    const current = await check('program', `calm-${key}`);
    assert.equal(current.status, 204);
    assert.equal(current.headers.get(CURRENT_REF_HEADER), null);
    for (const old of [first.program.id, `quiet-${key}`]) {
      const res = await check('program', old);
      assert.equal(res.status, 204, old);
      assert.equal(res.headers.get(CURRENT_REF_HEADER), `calm-${key}`, old);
      assert.equal(res.headers.get('cache-control'), 'public, s-maxage=30', old);
    }
    assert.equal((await check('program', `nobody-${key}`)).status, 404);
    assert.equal((await check('program', hangul.program.id)).headers.get(CURRENT_REF_HEADER), null);
    assert.equal((await check('intern', `calm-${key}`)).status, 404);
    await updateProgram(twin.program.id, {isPublished: false});
    assert.equal((await check('program', `quiet-${key}-2`)).status, 404);

    // Deleting a program frees its slugs.
    assert.equal((await deleteProgram(typed.program.id)).success, true);
    assert.equal(await db.programSlug.count({where: {programId: typed.program.id}}), 0);
    const reuse = await createProgram({...base, title: `Reuse ${key}`, slug: `loud-${key}`});
    created.push(reuse.program.id);
    assert.equal(reuse.program.slug, `loud-${key}`);
  } finally {
    await db.program.deleteMany({where: {id: {in: created}}});
    await db.user.delete({where: {id: adminId}});
    await db.$disconnect();
  }
});
