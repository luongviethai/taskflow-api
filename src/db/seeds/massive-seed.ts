// ============================================================
// src/db/seeds/massive-seed.ts
// Seed 1M+ records cho thí nghiệm database performance
//
// CHẠY: npx ts-node src/db/seeds/massive-seed.ts
//
// MỤC TIÊU:
//   100,000 users
//   10,000 workspaces
//   ~125,000 workspace_members
//   50,000 projects
//   1,000,000 tasks
//   ~50,000 labels + ~1,500,000 task_labels
//   ~5,000,000 comments
//   ~10,000,000 activity_logs
//
// THỜI GIAN DỰ KIẾN: 3-10 phút tùy máy
// ============================================================

import knex from 'knex';
import knexConfig from '../knexfile';
import { randomUUID } from 'crypto';
import bcrypt from 'bcrypt';

const db = knex(knexConfig);

// ============================================================
// CẤU HÌNH — Điều chỉnh nếu máy yếu
// ============================================================
const CONFIG = {
  USERS: 100_000,
  WORKSPACES: 10_000,
  MEMBERS_PER_WS: { min: 5, max: 20 },
  PROJECTS: 50_000,
  TASKS: 1_000_000,
  COMMENTS_PER_TASK: { min: 3, max: 7 },
  LABELS_PER_WS: { min: 4, max: 8 },
  LABELS_PER_TASK: { min: 0, max: 3 },
  ACTIVITY_LOGS: 10_000_000,
  BATCH_SIZE: 5_000,     // Insert 5000 rows mỗi lần
};

// ============================================================
// HELPERS
// ============================================================
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Phân bố status: 30% todo, 40% in_progress, 30% done
function randomStatus(): string {
  const r = Math.random();
  if (r < 0.3) return 'todo';
  if (r < 0.7) return 'in_progress';
  return 'done';
}

// Batch insert — KHÔNG insert từng row!
// Lý do: 1M single insert = 1M TCP roundtrip (~500s)
//         1M batch (5000/batch) = 200 roundtrip (~vài giây)
async function batchInsert(table: string, rows: any[]): Promise<void> {
  for (let i = 0; i < rows.length; i += CONFIG.BATCH_SIZE) {
    const batch = rows.slice(i, i + CONFIG.BATCH_SIZE);
    await db(table).insert(batch);

    if (i > 0 && i % (CONFIG.BATCH_SIZE * 20) === 0) {
      const pct = Math.round((i / rows.length) * 100);
      console.log(`  ${table}: ${i.toLocaleString()} / ${rows.length.toLocaleString()} (${pct}%)`);
    }
  }
  console.log(`  ✓ ${table}: ${rows.length.toLocaleString()} rows`);
}

// Batch insert cho data quá lớn (comments, activity_logs)
// Tạo + insert theo chunk để tránh hết RAM
async function streamInsert(
  table: string,
  totalCount: number,
  chunkSize: number,
  generateRow: (index: number) => any,
): Promise<void> {
  let inserted = 0;

  while (inserted < totalCount) {
    const remaining = totalCount - inserted;
    const currentChunk = Math.min(remaining, chunkSize);
    const rows: any[] = [];

    for (let i = 0; i < currentChunk; i++) {
      rows.push(generateRow(inserted + i));
    }

    await batchInsert(table, rows);
    inserted += currentChunk;

    const pct = Math.round((inserted / totalCount) * 100);
    console.log(`  → ${table} progress: ${inserted.toLocaleString()} / ${totalCount.toLocaleString()} (${pct}%)`);
  }
}

// ============================================================
// CONSTANT DATA
// ============================================================
const TASK_VERBS = ['Fix', 'Build', 'Design', 'Test', 'Review', 'Deploy', 'Refactor', 'Update', 'Migrate', 'Optimize'];
const TASK_NOUNS = ['auth', 'UI', 'API', 'database', 'cache', 'search', 'email', 'payment', 'dashboard', 'settings'];
const COMMENT_TEXTS = [
  'Looks good to me!', 'Can we add more tests?', 'This needs review.',
  'Updated the implementation.', 'Fixed the edge case.', 'Added documentation.',
  'Waiting for feedback.', 'Merged and deployed.', 'LGTM, ship it!',
  'Need to refactor this part.', 'Works on my machine.', 'Please check the error handling.',
];
const LABEL_NAMES = [
  'Bug', 'Feature', 'Improvement', 'Documentation', 'Urgent',
  'Low Priority', 'In Review', 'Blocked', 'Epic', 'Tech Debt',
  'Design', 'Backend', 'Frontend', 'DevOps', 'Testing',
];
const LABEL_COLORS = [
  '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6',
  '#EC4899', '#6366F1', '#14B8A6', '#F97316', '#06B6D4',
];
const ACTIONS = ['created', 'updated', 'deleted', 'assigned', 'status_changed'] as const;
const ENTITY_TYPES = ['task', 'project', 'comment', 'workspace'] as const;
const METADATA_FIELDS = ['status', 'title', 'assignee', 'description', 'deadline'];
const METADATA_VALUES = ['todo', 'in_progress', 'done', 'null', 'updated value'];

const DATE_START = new Date('2024-01-01');
const DATE_END = new Date('2025-06-01');
const NOW = new Date();
const SIX_MONTHS_LATER = new Date(NOW.getTime() + 180 * 24 * 60 * 60 * 1000);

// ============================================================
// MAIN SEED
// ============================================================
async function seed(): Promise<void> {
  const startTime = Date.now();
  console.log('🚀 Starting massive seed...');
  console.log(`   Config: ${CONFIG.TASKS.toLocaleString()} tasks, ${CONFIG.ACTIVITY_LOGS.toLocaleString()} activity logs`);
  console.log('');

  // ----------------------------------------------------------
  // STEP 0: Clean existing data
  // ----------------------------------------------------------
  console.log('🧹 Cleaning existing data...');
  await db('activity_logs').del();
  await db('task_labels').del();
  await db('comments').del();
  await db('labels').del();
  await db('tasks').del();
  await db('projects').del();
  await db('workspace_members').del();
  await db('workspaces').del();
  await db('users').del();
  console.log('  ✓ Clean\n');

  // ----------------------------------------------------------
  // STEP 1: USERS
  // ----------------------------------------------------------
  console.log(`👤 Creating ${CONFIG.USERS.toLocaleString()} users...`);
  const passwordHash = await bcrypt.hash('password123', 10);
  const userIds: string[] = [];
  const users: any[] = [];

  for (let i = 0; i < CONFIG.USERS; i++) {
    const id = randomUUID();
    userIds.push(id);
    users.push({
      id,
      email: `user${i}@taskflow.dev`,
      password_hash: passwordHash,
      name: `User ${i}`,
      created_at: randDate(DATE_START, DATE_END),
    });
  }
  await batchInsert('users', users);

  // ----------------------------------------------------------
  // STEP 2: WORKSPACES
  // ----------------------------------------------------------
  console.log(`\n🏢 Creating ${CONFIG.WORKSPACES.toLocaleString()} workspaces...`);
  const workspaceIds: string[] = [];
  const workspaces: any[] = [];

  for (let i = 0; i < CONFIG.WORKSPACES; i++) {
    const id = randomUUID();
    workspaceIds.push(id);
    workspaces.push({
      id,
      name: `Workspace ${i}`,
      owner_id: randPick(userIds),
      created_at: randDate(DATE_START, DATE_END),
    });
  }
  await batchInsert('workspaces', workspaces);

  // ----------------------------------------------------------
  // STEP 3: WORKSPACE_MEMBERS
  // ----------------------------------------------------------
  console.log('\n👥 Creating workspace members...');
  const members: any[] = [];
  const wsMemberMap = new Map<string, string[]>();

  for (const wsId of workspaceIds) {
    const count = randInt(CONFIG.MEMBERS_PER_WS.min, CONFIG.MEMBERS_PER_WS.max);
    const shuffled = [...userIds].sort(() => Math.random() - 0.5);
    const wsMembers = shuffled.slice(0, count);
    wsMemberMap.set(wsId, wsMembers);

    for (let j = 0; j < wsMembers.length; j++) {
      members.push({
        workspace_id: wsId,
        user_id: wsMembers[j],
        role: j === 0 ? 'owner' : (Math.random() < 0.8 ? 'member' : 'viewer'),
      });
    }
  }
  await batchInsert('workspace_members', members);

  // ----------------------------------------------------------
  // STEP 4: LABELS
  // ----------------------------------------------------------
  console.log('\n🏷️  Creating labels...');
  const labels: any[] = [];
  const wsLabelMap = new Map<string, string[]>();

  for (const wsId of workspaceIds) {
    const count = randInt(CONFIG.LABELS_PER_WS.min, CONFIG.LABELS_PER_WS.max);
    const shuffledNames = [...LABEL_NAMES].sort(() => Math.random() - 0.5);
    const wsLabels: string[] = [];

    for (let j = 0; j < count; j++) {
      const id = randomUUID();
      wsLabels.push(id);
      labels.push({
        id,
        workspace_id: wsId,
        name: shuffledNames[j],
        color: randPick(LABEL_COLORS),
        created_at: randDate(DATE_START, DATE_END),
      });
    }
    wsLabelMap.set(wsId, wsLabels);
  }
  await batchInsert('labels', labels);

  // ----------------------------------------------------------
  // STEP 5: PROJECTS
  // ----------------------------------------------------------
  console.log(`\n📁 Creating ${CONFIG.PROJECTS.toLocaleString()} projects...`);
  const projectIds: string[] = [];
  const projects: any[] = [];
  const projectWsMap = new Map<string, string>();

  for (let i = 0; i < CONFIG.PROJECTS; i++) {
    const id = randomUUID();
    const wsId = randPick(workspaceIds);
    projectIds.push(id);
    projectWsMap.set(id, wsId);
    projects.push({
      id,
      workspace_id: wsId,
      name: `Project ${i}`,
      description: `Description for project ${i}`,
      created_at: randDate(DATE_START, DATE_END),
    });
  }
  await batchInsert('projects', projects);

  // ----------------------------------------------------------
  // STEP 6: TASKS (1 triệu!)
  // ----------------------------------------------------------
  console.log(`\n📋 Creating ${CONFIG.TASKS.toLocaleString()} tasks...`);
  const taskIds: string[] = [];
  const tasks: any[] = [];
  const taskProjectMap = new Map<string, string>();

  for (let i = 0; i < CONFIG.TASKS; i++) {
    const id = randomUUID();
    const projectId = randPick(projectIds);
    taskIds.push(id);
    taskProjectMap.set(id, projectId);

    const hasDeadline = Math.random() > 0.2; // 80% có deadline

    tasks.push({
      id,
      project_id: projectId,
      title: `${randPick(TASK_VERBS)} ${randPick(TASK_NOUNS)} #${i}`,
      description: `Task ${i} description`,
      status: randomStatus(),
      assignee_id: randPick(userIds),
      deadline: hasDeadline ? randDate(NOW, SIX_MONTHS_LATER) : null,
      created_at: randDate(DATE_START, DATE_END),
    });
  }
  await batchInsert('tasks', tasks);

  // ----------------------------------------------------------
  // STEP 7: TASK_LABELS
  // ----------------------------------------------------------
  console.log('\n🏷️  Creating task_labels...');
  const taskLabels: any[] = [];
  const seenPairs = new Set<string>();

  for (const taskId of taskIds) {
    const projectId = taskProjectMap.get(taskId)!;
    const wsId = projectWsMap.get(projectId);
    if (!wsId) continue;
    const wsLabels = wsLabelMap.get(wsId) || [];
    if (wsLabels.length === 0) continue;

    const count = randInt(CONFIG.LABELS_PER_TASK.min, Math.min(CONFIG.LABELS_PER_TASK.max, wsLabels.length));
    const shuffled = [...wsLabels].sort(() => Math.random() - 0.5);

    for (let j = 0; j < count; j++) {
      const pair = `${taskId}:${shuffled[j]}`;
      if (seenPairs.has(pair)) continue;
      seenPairs.add(pair);
      taskLabels.push({ task_id: taskId, label_id: shuffled[j] });
    }
  }
  await batchInsert('task_labels', taskLabels);

  // ----------------------------------------------------------
  // STEP 8: COMMENTS (~5M)
  // Tạo theo chunk để tránh OOM
  // ----------------------------------------------------------
  console.log('\n💬 Creating ~5M comments (this takes a while)...');
  const TASK_CHUNK = 100_000;
  let totalComments = 0;

  for (let chunk = 0; chunk < taskIds.length; chunk += TASK_CHUNK) {
    const chunkTaskIds = taskIds.slice(chunk, chunk + TASK_CHUNK);
    const comments: any[] = [];

    for (const taskId of chunkTaskIds) {
      const count = randInt(CONFIG.COMMENTS_PER_TASK.min, CONFIG.COMMENTS_PER_TASK.max);
      for (let j = 0; j < count; j++) {
        comments.push({
          id: randomUUID(),
          task_id: taskId,
          user_id: randPick(userIds),
          content: `${randPick(COMMENT_TEXTS)} (comment ${j + 1})`,
          created_at: randDate(DATE_START, DATE_END),
        });
      }
    }

    await batchInsert('comments', comments);
    totalComments += comments.length;

    const pct = Math.round(((chunk + TASK_CHUNK) / taskIds.length) * 100);
    console.log(`  → comments: ${totalComments.toLocaleString()} total (${Math.min(pct, 100)}%)`);
  }

  // ----------------------------------------------------------
  // STEP 9: ACTIVITY_LOGS (~10M)
  // Tạo theo chunk 500k để tránh OOM
  // ----------------------------------------------------------
  console.log('\n📝 Creating ~10M activity_logs (this takes the longest)...');
  const LOG_CHUNK = 500_000;
  let totalLogs = 0;

  while (totalLogs < CONFIG.ACTIVITY_LOGS) {
    const remaining = CONFIG.ACTIVITY_LOGS - totalLogs;
    const currentChunk = Math.min(remaining, LOG_CHUNK);
    const logs: any[] = [];

    for (let i = 0; i < currentChunk; i++) {
      const entityType = randPick([...ENTITY_TYPES]);
      const taskId = randPick(taskIds);
      const projectId = taskProjectMap.get(taskId) || randPick(projectIds);
      const wsId = projectWsMap.get(projectId) || randPick(workspaceIds);

      let entityId: string;
      if (entityType === 'task') entityId = taskId;
      else if (entityType === 'project') entityId = projectId;
      else entityId = taskId; // fallback

      logs.push({
        id: randomUUID(),
        workspace_id: wsId,
        user_id: randPick(userIds),
        entity_type: entityType,
        entity_id: entityId,
        action: randPick([...ACTIONS]),
        metadata: JSON.stringify({
          field: randPick(METADATA_FIELDS),
          old_value: randPick(METADATA_VALUES),
          new_value: randPick(METADATA_VALUES),
        }),
        created_at: randDate(DATE_START, DATE_END),
      });
    }

    await batchInsert('activity_logs', logs);
    totalLogs += currentChunk;

    const pct = Math.round((totalLogs / CONFIG.ACTIVITY_LOGS) * 100);
    console.log(`  → activity_logs: ${totalLogs.toLocaleString()} / ${CONFIG.ACTIVITY_LOGS.toLocaleString()} (${pct}%)`);
  }

  // ----------------------------------------------------------
  // DONE
  // ----------------------------------------------------------
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(`
╔════════════════════════════════════════════════╗
║            🎉 SEED COMPLETED!                 ║
╠════════════════════════════════════════════════╣
║  Users:            ${CONFIG.USERS.toLocaleString().padStart(14)}      ║
║  Workspaces:       ${CONFIG.WORKSPACES.toLocaleString().padStart(14)}      ║
║  Members:          ${members.length.toLocaleString().padStart(14)}      ║
║  Labels:           ${labels.length.toLocaleString().padStart(14)}      ║
║  Projects:         ${CONFIG.PROJECTS.toLocaleString().padStart(14)}      ║
║  Tasks:            ${CONFIG.TASKS.toLocaleString().padStart(14)}      ║
║  Task Labels:      ${taskLabels.length.toLocaleString().padStart(14)}      ║
║  Comments:         ~${totalComments.toLocaleString().padStart(13)}      ║
║  Activity Logs:    ~${totalLogs.toLocaleString().padStart(13)}      ║
║                                                ║
║  Time:             ${(elapsed + 's').padStart(14)}      ║
╚════════════════════════════════════════════════╝
  `);

  await db.destroy();
}

// Chạy trực tiếp: npx ts-node src/db/seeds/massive-seed.ts
seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  db.destroy();
  process.exit(1);
});
