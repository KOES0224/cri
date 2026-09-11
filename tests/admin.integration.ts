/** Run only against a disposable local PostgreSQL database with the current schema. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import type { PrismaClient } from '@prisma/client';
const url = new URL(process.env.DATABASE_URL || 'http://missing');
if (!['localhost', '127.0.0.1'].includes(url.hostname)) throw new Error('Admin tests require a disposable LOCAL database.');
let session: any = null;
require.cache[require.resolve('next-auth')] = { exports: { getServerSession: async () => session } } as any;
require.cache[require.resolve('next/cache')] = { exports: { revalidatePath: () => {} } } as any;
const { prisma: db } = require('../src/lib/prisma') as { prisma: PrismaClient };
const { updateApplicationStatus, updateApplicationProcessingFields } = require('../src/app/actions/adminApplications');
const { getUsers, getUserDetails, updateUserRole, deleteUser } = require('../src/app/actions/users');
const { manuallyLinkLeadToUser, createLead } = require('../src/app/actions/crm');
const key = randomUUID();
const adminId = `admin-${key}`, studentId = `student-${key}`, otherId = `other-${key}`, programId = `program-${key}`;
test('admin authorization, atomic decisions, registration, stale updates and linked records', async () => {
  await db.user.createMany({ data: [
    { id: adminId, email: `${adminId}@example.test`, role: 'ADMIN', name: 'QA Admin' },
    { id: studentId, email: `${studentId}@example.test`, role: 'STUDENT', password: 'synthetic-hash' },
    { id: otherId, email: `${otherId}@example.test`, role: 'STUDENT' },
  ] });
  await db.program.create({ data: { id: programId, title: 'Synthetic admin test', category: 'Winter', description: 'Test only' } });
  try {
    const app = await db.application.create({ data: { userId: studentId, programId } });
    assert.equal((await updateApplicationStatus(app.id, 'ACCEPTED', app.updatedAt)).success, false);
    session = { user: { id: studentId, role: 'ADMIN' } }; // forged role is rejected by database check
    await assert.rejects(() => getUsers(), /Administrator access/);
    assert.equal((await updateApplicationStatus(app.id, 'ACCEPTED', app.updatedAt)).success, false);
    session = { user: { id: adminId, role: 'ADMIN', name: 'QA Admin' } };
    assert.equal((await updateUserRole(adminId, 'STUDENT')).success, false);
    assert.equal((await deleteUser(adminId)).success, false);
    assert.equal((await updateApplicationStatus(app.id, 'INVALID', app.updatedAt)).success, false);
    assert.equal((await updateApplicationProcessingFields(app.id, { stage: 'ENROLLED' }, app.updatedAt, true)).success, false);
    const accepted = await updateApplicationStatus(app.id, 'ACCEPTED', app.updatedAt);
    assert.equal(accepted.success, true); assert.equal(accepted.stage, 'PAYMENT');
    assert.equal((await db.enrollment.findUniqueOrThrow({ where: { userId_programId: { userId: studentId, programId } } })).status, 'ACCEPTED');
    assert.equal((await updateApplicationStatus(app.id, 'REJECTED', app.updatedAt)).success, false);
    assert.equal((await updateApplicationProcessingFields(app.id, { stage: 'ENROLLED' }, accepted.updatedAt)).success, false);
    assert.equal((await updateApplicationProcessingFields(app.id, { stage: 'INTERVIEW' }, accepted.updatedAt)).success, false);
    assert.equal(await db.userActivity.count({ where: { userId: studentId } }), 1, 'failed changes do not leave audit entries');
    const enrolled = await updateApplicationProcessingFields(app.id, { stage: 'ENROLLED' }, accepted.updatedAt, true);
    assert.equal(enrolled.success, true);
    assert.equal((await db.enrollment.findUniqueOrThrow({ where: { userId_programId: { userId: studentId, programId } } })).status, 'ONGOING');
    assert.equal((await updateApplicationStatus(app.id, 'REJECTED', enrolled.updatedAt)).success, false);
    const audit = await db.userActivity.findFirstOrThrow({ where: { userId: studentId }, orderBy: { createdAt: 'desc' } });
    assert.match(audit.content!, /Before:/); assert.match(audit.content!, /After:/); assert.ok(audit.content!.includes(adminId));
    const lead = await db.lead.create({ data: { name: 'Synthetic inquiry', email: `${studentId}@example.test` } });
    assert.equal((await manuallyLinkLeadToUser(lead.id, `${studentId}@example.test`)).success, true);
    assert.equal((await manuallyLinkLeadToUser(lead.id, `${otherId}@example.test`)).success, false);
    const reminder = await db.notification.create({ data: { leadId: lead.id, message: 'Test reminder', dueDate: new Date() } });
    const person = await getUserDetails(studentId);
    assert.equal('password' in person, false); assert.equal('sessionVersion' in person, false);
    assert.ok(person.notifications.some((item: any) => item.id === reminder.id));
    assert.equal(person.enrollments[0].status, 'ONGOING');
    const duplicate = await createLead('Duplicate', `${studentId}@example.test`);
    assert.equal(duplicate.success, false); assert.equal(duplicate.existingLeadId, lead.id);
    const pending = await db.application.create({ data: { userId: otherId, programId } });
    const admitted = await updateApplicationStatus(pending.id, 'ACCEPTED', pending.updatedAt);
    const rejected = await updateApplicationStatus(pending.id, 'REJECTED', admitted.updatedAt);
    assert.equal(rejected.success, true); assert.equal(rejected.stage, 'REJECTED');
    assert.equal(await db.enrollment.count({ where: { userId: otherId, programId } }), 0);
  } finally {
    await db.lead.deleteMany({ where: { email: `${studentId}@example.test` } });
    await db.user.deleteMany({ where: { id: { in: [adminId, studentId, otherId] } } });
    await db.program.delete({ where: { id: programId } });
    await db.$disconnect();
  }
});
