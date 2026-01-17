#!/usr/bin/env tsx
/**
 * Policy Replay Diagnostic: Replay trial logs through PolicyEngine to diagnose width inflation non-activation
 * 
 * This script:
 * 1. Loads trial data CSV (same source as Report.qmd)
 * 2. Replays trials through PolicyEngine (matching app/src/lib/policy.ts logic)
 * 3. Outputs 3 CSVs with diagnostic results
 * 
 * Run from project root: cd app && npx tsx ../scripts/policy_replay_width_inflation_diagnostics.ts [csv_path]
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join, resolve } from 'path'

// Import policy modules - will be loaded in main()
let PolicyEngine: any
let getDefaultPolicy: any
let Modality: any

interface TrialRow {
  participant_id: string
  trial_number: number
  modality: string
  ui_mode: string
  pressure: number | string
  rt_ms: number | null
  correct: boolean | string | number | null
  practice: boolean | string | null
  width_scale_factor: number | null
  timestamp?: number
  [key: string]: any
}

interface PolicyEvent {
  pid: string
  trial_index: number
  modality: string
  ui_mode: string
  pressure_label: number | string
  pressureEnabled_runtime: boolean
  action: string
  reason: string
  counters_bad?: number
  counters_good?: number
  rt_ms?: number
  correct?: boolean
}

interface ParticipantSummary {
  pid: string
  n_trials: number
  n_hand_adaptive_p1: number
  max_bad_streak: number
  ever_inflate_width: boolean
  n_inflate_width: number
  top_reason: string
  n_reason_pressure_not_enabled: number
  n_reason_triggered: number
  n_reason_performance_improved: number
  n_reason_other: number
}

function parseCSV(content: string): TrialRow[] {
  const lines = content.trim().split('\n')
  if (lines.length < 2) return []
  
  const headers = lines[0].split(',').map(h => h.trim())
  const rows: TrialRow[] = []
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',')
    const row: any = {}
    
    headers.forEach((header, idx) => {
      let value: any = values[idx]?.trim() || ''
      
      // Parse numeric fields
      if (['trial_number', 'rt_ms', 'width_scale_factor', 'pressure'].includes(header)) {
        value = value === '' || value === 'NA' || value === 'null' ? null : Number(value)
      }
      
      // Parse boolean fields
      if (['correct', 'practice'].includes(header)) {
        if (value === '' || value === 'NA' || value === 'null') {
          value = null
        } else if (typeof value === 'string') {
          value = value.toLowerCase() === 'true' || value === '1'
        }
      }
      
      row[header] = value
    })
    
    rows.push(row as TrialRow)
  }
  
  return rows
}

function inferPressureEnabled(pressure: number | string | null): boolean {
  if (pressure === null || pressure === undefined) return false
  const p = typeof pressure === 'string' ? Number(pressure) : pressure
  return p === 1 || p === '1'
}

async function main() {
  // Load policy modules - detect if running from app/ or root
  const cwd = process.cwd()
  const isInAppDir = cwd.endsWith('/app')
  const appSrcPath = isInAppDir 
    ? join(cwd, 'src')
    : join(cwd, 'app', 'src')
  
  const policyPath = join(appSrcPath, 'lib', 'policy.ts')
  const modalityPath = join(appSrcPath, 'lib', 'modality.ts')
  
  try {
    const policyModule = await import('file://' + policyPath)
    const modalityModule = await import('file://' + modalityPath)
    
    PolicyEngine = policyModule.PolicyEngine
    getDefaultPolicy = policyModule.getDefaultPolicy
    Modality = modalityModule.Modality
  } catch (e) {
    console.error('Error loading policy modules:', e)
    console.error(`Tried path: ${policyPath}`)
    console.error(`Current working directory: ${cwd}`)
    console.error('Make sure to run from project root or app directory')
    process.exit(1)
  }
  
  const args = process.argv.slice(2)
  const csvPath = args[0] || 'data/clean/trial_data.csv'
  
  console.log('Policy Replay Diagnostic: Width Inflation Non-Activation')
  console.log('='.repeat(60))
  console.log(`Loading data from: ${csvPath}\n`)
  
  // Load CSV
  let csvContent: string
  try {
    csvContent = readFileSync(csvPath, 'utf-8')
  } catch (e) {
    console.error(`Error reading CSV: ${e}`)
    process.exit(1)
  }
  
  const trials = parseCSV(csvContent)
  console.log(`Loaded ${trials.length} trials from CSV\n`)
  
  // Filter to non-practice trials (matching Report.qmd logic)
  const nonPracticeTrials = trials.filter(t => {
    const practice = t.practice
    return practice === false || practice === 'false' || practice === null || practice === undefined
  })
  console.log(`Non-practice trials: ${nonPracticeTrials.length}\n`)
  
  // Initialize policy engine with default config
  const policy = getDefaultPolicy()
  const engine = new PolicyEngine(policy)
  
  console.log('Policy configuration:')
  console.log(`  adaptive: ${policy.adaptive}`)
  console.log(`  pressure_only: ${policy.pressure_only}`)
  console.log(`  hysteresis_trials: ${policy.hysteresis_trials}`)
  console.log(`  hand.action: ${policy.hand.action}`)
  console.log(`  hand.delta_w: ${policy.hand.delta_w}`)
  console.log(`  hand.trigger.rt_p: ${policy.hand.trigger.rt_p}`)
  console.log(`  hand.trigger.err_burst: ${policy.hand.trigger.err_burst}\n`)
  
  // Group trials by participant
  const byPid: Record<string, TrialRow[]> = {}
  nonPracticeTrials.forEach(trial => {
    const pid = trial.participant_id || trial.pid
    if (!pid) return
    if (!byPid[pid]) byPid[pid] = []
    byPid[pid].push(trial)
  })
  
  const pids = Object.keys(byPid).sort()
  console.log(`Participants: ${pids.length}\n`)
  
  // Replay trials through PolicyEngine
  const events: PolicyEvent[] = []
  const summaries: ParticipantSummary[] = []
  
  for (const pid of pids) {
    const participantTrials = byPid[pid].sort((a, b) => {
      const aNum = typeof a.trial_number === 'number' ? a.trial_number : Number(a.trial_number) || 0
      const bNum = typeof b.trial_number === 'number' ? b.trial_number : Number(b.trial_number) || 0
      return aNum - bNum
    })
    
    // Reset engine for each participant
    engine.reset()
    
    let maxBadStreak = 0
    let everInflateWidth = false
    let nInflateWidth = 0
    const reasonCounts: Record<string, number> = {}
    let nHandAdaptiveP1 = 0
    
    // Track counters manually (since they're private)
    let currentBadCount = 0
    let currentGoodCount = 0
    
    for (let i = 0; i < participantTrials.length; i++) {
      const trial = participantTrials[i]
      const modalityStr = (trial.modality || '').toLowerCase()
      const uiMode = (trial.ui_mode || '').toLowerCase()
      const pressure = trial.pressure
      const pressureEnabled = inferPressureEnabled(pressure)
      
      // Only process hand/adaptive/pressure=1 trials for width inflation
      const isHandAdaptiveP1 = modalityStr === 'hand' && 
                                uiMode === 'adaptive' && 
                                (pressure === 1 || pressure === '1')
      
      if (isHandAdaptiveP1) {
        nHandAdaptiveP1++
      }
      
      // Convert modality string to enum
      const modality = modalityStr === 'gaze' ? Modality.GAZE : Modality.HAND
      
      // Add trial to history
      const correct = trial.correct === true || trial.correct === 'true' || trial.correct === 1
      const rt_ms = trial.rt_ms && trial.rt_ms > 0 ? trial.rt_ms : undefined
      
      engine.addTrial({
        trialId: `${pid}_trial_${trial.trial_number}`,
        modality: modalityStr,
        rt_ms: rt_ms,
        correct: correct,
        error: !correct,
        timestamp: trial.timestamp || Date.now()
      })
      
      // Get next policy state
      const state = engine.nextPolicyState({
        modality: modality,
        pressure: typeof pressure === 'number' ? pressure : Number(pressure) || 0,
        pressureEnabled: pressureEnabled,
        currentRT: rt_ms
      })
      
      // Track counters (approximate from state)
      if (state.triggered) {
        currentBadCount = state.hysteresis_count || 0
        currentGoodCount = 0
        maxBadStreak = Math.max(maxBadStreak, currentBadCount)
      } else if (state.action === 'none' && state.reason === 'Performance improved') {
        currentGoodCount = state.hysteresis_count || 0
        currentBadCount = 0
      } else {
        // If action is none but not "Performance improved", check if we're accumulating bad
        if (state.reason.includes('Triggered') || state.reason.includes('RT p75') || state.reason.includes('err_burst')) {
          currentBadCount++
          currentGoodCount = 0
          maxBadStreak = Math.max(maxBadStreak, currentBadCount)
        } else {
          currentGoodCount++
          currentBadCount = 0
        }
      }
      
      // Record events where action != 'none'
      if (state.action !== 'none') {
        events.push({
          pid: pid,
          trial_index: i,
          modality: modalityStr,
          ui_mode: uiMode,
          pressure_label: pressure,
          pressureEnabled_runtime: pressureEnabled,
          action: state.action,
          reason: state.reason,
          counters_bad: currentBadCount,
          counters_good: currentGoodCount,
          rt_ms: rt_ms || undefined,
          correct: correct
        })
        
        if (state.action === 'inflate_width') {
          everInflateWidth = true
          nInflateWidth++
        }
      }
      
      // Count reasons (for hand/adaptive/pressure=1 only)
      if (isHandAdaptiveP1) {
        const reason = state.reason || 'unknown'
        reasonCounts[reason] = (reasonCounts[reason] || 0) + 1
      }
    }
    
    // Find top reason
    const topReason = Object.entries(reasonCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'
    
    summaries.push({
      pid: pid,
      n_trials: participantTrials.length,
      n_hand_adaptive_p1: nHandAdaptiveP1,
      max_bad_streak: maxBadStreak,
      ever_inflate_width: everInflateWidth,
      n_inflate_width: nInflateWidth,
      top_reason: topReason,
      n_reason_pressure_not_enabled: reasonCounts['Pressure mode not enabled'] || 0,
      n_reason_triggered: Object.keys(reasonCounts).filter(r => r.includes('Triggered')).length > 0 
        ? Object.values(reasonCounts).reduce((a, b) => a + b, 0) - (reasonCounts['Pressure mode not enabled'] || 0)
        : 0,
      n_reason_performance_improved: reasonCounts['Performance improved'] || 0,
      n_reason_other: Object.entries(reasonCounts)
        .filter(([r]) => !r.includes('Pressure mode not enabled') && 
                         !r.includes('Triggered') && 
                         !r.includes('Performance improved'))
        .reduce((sum, [, count]) => sum + count, 0)
    })
  }
  
  // Compute summary statistics
  const nParticipants = summaries.length
  const nEverInflateWidth = summaries.filter(s => s.ever_inflate_width).length
  const nMaxStreakGe5 = summaries.filter(s => s.max_bad_streak >= 5).length
  const totalInflateWidthEvents = summaries.reduce((sum, s) => sum + s.n_inflate_width, 0)
  const totalEvents = events.length
  const nPressureNotEnabled = summaries.reduce((sum, s) => sum + s.n_reason_pressure_not_enabled, 0)
  
  // Console summary
  console.log('=== DIAGNOSTIC SUMMARY ===\n')
  console.log(`Participants: ${nParticipants}`)
  console.log(`Participants with ever inflate_width: ${nEverInflateWidth} (${(100 * nEverInflateWidth / nParticipants).toFixed(1)}%)`)
  console.log(`Participants with max bad streak >= 5: ${nMaxStreakGe5} (${(100 * nMaxStreakGe5 / nParticipants).toFixed(1)}%)`)
  console.log(`Total inflate_width events: ${totalInflateWidthEvents}`)
  console.log(`Total policy events (action != 'none'): ${totalEvents}`)
  console.log(`Events with reason 'Pressure mode not enabled': ${nPressureNotEnabled}`)
  console.log()
  
  // Top reasons (aggregated)
  const allReasons: Record<string, number> = {}
  summaries.forEach(s => {
    if (s.top_reason !== 'N/A') {
      allReasons[s.top_reason] = (allReasons[s.top_reason] || 0) + 1
    }
  })
  const topReasons = Object.entries(allReasons)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
  
  console.log('Top reasons (by participant count):')
  topReasons.forEach(([reason, count]) => {
    console.log(`  ${reason}: ${count} participants`)
  })
  console.log()
  
  // Write CSV outputs - use root outputs/ directory
  const cwd = process.cwd()
  const isInAppDir = cwd.endsWith('/app')
  const outputsDir = isInAppDir ? join('..', 'outputs') : 'outputs'
  try {
    mkdirSync(outputsDir, { recursive: true })
  } catch (e) {
    // Directory might already exist
  }
  
  // 1. Summary CSV
  const summaryRow = {
    n_participants: nParticipants,
    n_ever_inflate_width: nEverInflateWidth,
    pct_ever_inflate_width: (100 * nEverInflateWidth / nParticipants).toFixed(2),
    n_max_streak_ge5: nMaxStreakGe5,
    pct_max_streak_ge5: (100 * nMaxStreakGe5 / nParticipants).toFixed(2),
    total_inflate_width_events: totalInflateWidthEvents,
    total_policy_events: totalEvents,
    n_pressure_not_enabled: nPressureNotEnabled,
    top_reason: topReasons[0]?.[0] || 'N/A',
    top_reason_count: topReasons[0]?.[1] || 0
  }
  
  const summaryCsv = [
    Object.keys(summaryRow).join(','),
    Object.values(summaryRow).join(',')
  ].join('\n')
  
  writeFileSync(join(outputsDir, 'policy_replay_summary.csv'), summaryCsv)
  console.log(`✓ Written: ${join(outputsDir, 'policy_replay_summary.csv')}`)
  
  // 2. Per-participant CSV
  const participantHeaders = Object.keys(summaries[0] || {})
  const participantCsv = [
    participantHeaders.join(','),
    ...summaries.map(s => participantHeaders.map(h => s[h as keyof ParticipantSummary]).join(','))
  ].join('\n')
  
  writeFileSync(join(outputsDir, 'policy_replay_by_pid.csv'), participantCsv)
  console.log(`✓ Written: ${join(outputsDir, 'policy_replay_by_pid.csv')}`)
  
  // 3. Events CSV
  if (events.length > 0) {
    const eventHeaders = Object.keys(events[0])
    const eventCsv = [
      eventHeaders.join(','),
      ...events.map(e => eventHeaders.map(h => {
        const val = e[h as keyof PolicyEvent]
        if (val === undefined || val === null) return ''
        if (typeof val === 'boolean') return val ? 'true' : 'false'
        return String(val)
      }).join(','))
    ].join('\n')
    
    writeFileSync(join(outputsDir, 'policy_replay_events.csv'), eventCsv)
    console.log(`✓ Written: ${join(outputsDir, 'policy_replay_events.csv')} (${events.length} events)`)
  } else {
    const eventCsv = 'pid,trial_index,modality,ui_mode,pressure_label,pressureEnabled_runtime,action,reason\n'
    writeFileSync(join(outputsDir, 'policy_replay_events.csv'), eventCsv)
    console.log(`✓ Written: ${join(outputsDir, 'policy_replay_events.csv')} (0 events - no policy actions occurred)`)
  }
  
  console.log('\n=== DIAGNOSTIC COMPLETE ===')
}

main().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})