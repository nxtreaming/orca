const TERMINAL_LIVE_INPUT_MAX_BYTES = 256 * 1024

const encoder = new TextEncoder()

export type TerminalLiveInputFocusTimerRef = {
  current: ReturnType<typeof setTimeout> | null
}

export type TerminalLiveInputDefaultResult = {
  enabledHandles: ReadonlySet<string>
  defaultedHandles: ReadonlySet<string>
  changed: boolean
}

export type TerminalLiveInputPruneResult = TerminalLiveInputDefaultResult

export function getTerminalLiveSpecialKeyBytes(key: string): string | null {
  if (key === 'Backspace') {
    return '\x7f'
  }
  return null
}

export function isTerminalLiveInputWithinByteLimit(
  text: string,
  maxBytes = TERMINAL_LIVE_INPUT_MAX_BYTES
): boolean {
  return encoder.encode(text).byteLength <= maxBytes
}

export function defaultTerminalLiveInputHandles(
  enabledHandles: ReadonlySet<string>,
  defaultedHandles: ReadonlySet<string>,
  terminalHandles: readonly string[]
): TerminalLiveInputDefaultResult {
  let nextEnabledHandles: Set<string> | null = null
  let nextDefaultedHandles: Set<string> | null = null

  for (const handle of terminalHandles) {
    if (defaultedHandles.has(handle)) {
      continue
    }
    nextEnabledHandles ??= new Set(enabledHandles)
    nextDefaultedHandles ??= new Set(defaultedHandles)
    nextEnabledHandles.add(handle)
    nextDefaultedHandles.add(handle)
  }

  if (!nextEnabledHandles || !nextDefaultedHandles) {
    return { enabledHandles, defaultedHandles, changed: false }
  }

  return {
    enabledHandles: nextEnabledHandles,
    defaultedHandles: nextDefaultedHandles,
    changed: true
  }
}

export function pruneTerminalLiveInputHandles(
  enabledHandles: ReadonlySet<string>,
  defaultedHandles: ReadonlySet<string>,
  liveTerminalHandles: ReadonlySet<string>
): TerminalLiveInputPruneResult {
  let nextEnabledHandles: Set<string> | null = null
  let nextDefaultedHandles: Set<string> | null = null

  for (const handle of enabledHandles) {
    if (liveTerminalHandles.has(handle)) {
      continue
    }
    nextEnabledHandles ??= new Set(enabledHandles)
    nextEnabledHandles.delete(handle)
  }

  for (const handle of defaultedHandles) {
    if (liveTerminalHandles.has(handle)) {
      continue
    }
    nextDefaultedHandles ??= new Set(defaultedHandles)
    nextDefaultedHandles.delete(handle)
  }

  if (!nextEnabledHandles && !nextDefaultedHandles) {
    return { enabledHandles, defaultedHandles, changed: false }
  }

  return {
    enabledHandles: nextEnabledHandles ?? enabledHandles,
    defaultedHandles: nextDefaultedHandles ?? defaultedHandles,
    changed: true
  }
}

export function clearTerminalLiveInputFocusTimer(timerRef: TerminalLiveInputFocusTimerRef): void {
  if (timerRef.current === null) {
    return
  }
  clearTimeout(timerRef.current)
  timerRef.current = null
}

export function scheduleTerminalLiveInputFocus(
  timerRef: TerminalLiveInputFocusTimerRef,
  focus: () => void,
  delayMs = 50
): void {
  // Why: live input can be toggled during route changes; replacing the pending
  // focus timer prevents stale native TextInput focus after unmount/disable.
  clearTerminalLiveInputFocusTimer(timerRef)
  timerRef.current = setTimeout(() => {
    timerRef.current = null
    focus()
  }, delayMs)
}

export { TERMINAL_LIVE_INPUT_MAX_BYTES }
