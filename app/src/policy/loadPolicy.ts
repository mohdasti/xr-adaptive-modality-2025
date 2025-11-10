export type AdaptationPolicy = {
  adaptation: {
    triggers: {
      rt_percentile: number
      error_burst_threshold: number
      min_trials_before_adapt: number
    }
    hysteresis: {
      post_trigger_window: number
      min_trigger_gap: number
    }
  }
}

async function fetchJSON(path: string): Promise<AdaptationPolicy> {
  const res = await fetch(path, { cache: 'no-store' })
  if (!res.ok) {
    throw new Error(`Fetch error ${path}`)
  }
  return (await res.json()) as AdaptationPolicy
}

export async function loadAdaptationPolicy(): Promise<AdaptationPolicy> {
  const lockedPath = '/policy/policy.locked.json'
  const defaultPath = '/policy/policy.default.json'

  try {
    return await fetchJSON(lockedPath)
  } catch (error) {
    console.warn('Falling back to default adaptation policy:', error)
    return fetchJSON(defaultPath)
  }
}

