import type { NoteIssue, SyncStatus } from '../shared/types.ts'
import type { BucketFile } from './bucket.ts'
import type { StoredCard } from './cards.ts'
import type { Env } from './env.ts'
import { listFolder } from './bucket.ts'
import { buildCard, todayIn } from './cards.ts'
import { listLogos } from './logos.ts'
import { NoteError, parseNote } from './obsidian.ts'
import { makeIdFactory } from './settings.ts'

/**
 * "Sync notes": reads every card note from the R2 bucket, builds the cards and stores the result in KV.
 * Runs only when the owner presses the button in the admin page.
 */

const SNAPSHOT_KEY = 'snapshot'
const STATUS_KEY = 'sync-status'
/** R2 reads running at the same time */
const PARALLEL_READS = 6

export interface Snapshot {
  syncedAt: string
  cards: StoredCard[]
  /** Carrier key → logo URL */
  logos: Record<string, string>
}

const EMPTY_STATUS: SyncStatus = {
  lastFinishedAt: null,
  lastSuccessAt: null,
  lastError: null,
  lastErrorCode: null,
  lastErrorParams: null,
  cardCount: 0,
  recordCount: 0,
  issues: [],
}

export async function loadSnapshot(env: Env): Promise<Snapshot | null> {
  return env.STORE.get<Snapshot>(SNAPSHOT_KEY, 'json')
}

export async function loadStatus(env: Env): Promise<SyncStatus> {
  return { ...EMPTY_STATUS, ...await env.STORE.get<Partial<SyncStatus>>(STATUS_KEY, 'json') }
}

async function listNotes(env: Env): Promise<BucketFile[]> {
  const notes = (await listFolder(env, env.CARDS_FOLDER)).filter((file) => {
    // Hidden files and folders (e.g. `.obsidian`) are not notes
    return file.path.endsWith('.md') && !file.path.split('/').some(part => part.startsWith('.'))
  })
  return notes.sort((a, b) => a.path.localeCompare(b.path, 'zh-Hans-CN', { numeric: true }))
}

function issue(file: string, code: string, message: string, params: NoteIssue['params'], skipped: boolean): NoteIssue {
  return { file, code, message, params, skipped }
}

export async function runSync(env: Env): Promise<SyncStatus> {
  const previous = await loadStatus(env)
  const finishedAt = () => new Date().toISOString()

  try {
    const files = await listNotes(env)
    const today = todayIn(env.TIMEZONE)
    const makeId = await makeIdFactory(env)
    const cards: StoredCard[] = []
    const issues: NoteIssue[] = []

    for (let i = 0; i < files.length; i += PARALLEL_READS) {
      const batch = files.slice(i, i + PARALLEL_READS)
      const texts = await Promise.all(batch.map(async f => (await env.NOTES.get(f.key))?.text() ?? null))
      for (const [index, { path: file }] of batch.entries()) {
        const text = texts[index]
        if (text === null || text === undefined) {
          issues.push(issue(file, 'note.vanished', 'The note disappeared while syncing', {}, true))
          continue
        }
        try {
          const note = parseNote(text)
          for (const p of note.problems)
            issues.push(issue(file, p.code, p.message, p.params, false))
          const { card, problems } = buildCard(note, { id: await makeId(file), file, order: i + index, today })
          cards.push(card)
          for (const problem of problems)
            issues.push(issue(file, 'note.check', problem, { problem }, false))
        }
        catch (error) {
          if (!(error instanceof NoteError))
            throw error
          issues.push(issue(file, error.code, error.message, error.params, true))
        }
      }
    }

    const snapshot: Snapshot = {
      syncedAt: finishedAt(),
      cards,
      logos: await listLogos(env, env.LOGOS_FOLDER),
    }
    await env.STORE.put(SNAPSHOT_KEY, JSON.stringify(snapshot))

    const status: SyncStatus = {
      lastFinishedAt: snapshot.syncedAt,
      lastSuccessAt: snapshot.syncedAt,
      lastError: null,
      lastErrorCode: null,
      lastErrorParams: null,
      cardCount: cards.length,
      recordCount: cards.reduce((sum, card) => sum + card.history.length, 0),
      issues,
    }
    await env.STORE.put(STATUS_KEY, JSON.stringify(status))
    console.log(`[sync] ${cards.length} cards from ${files.length} notes, ${issues.length} issue(s)`)
    return status
  }
  catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[sync] Failed:', error)
    // Keep the counts and issues of the last good sync; only record the failure
    const status: SyncStatus = {
      ...previous,
      lastFinishedAt: finishedAt(),
      lastError: message,
      lastErrorCode: 'sync.failed',
      lastErrorParams: { message },
    }
    await env.STORE.put(STATUS_KEY, JSON.stringify(status))
    return status
  }
}
