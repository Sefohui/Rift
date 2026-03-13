let ctx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext()
  // Resume if suspended (browser policy)
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function master(volume: number) {
  const c = getCtx()
  const g = c.createGain()
  g.gain.value = Math.max(0, Math.min(1, volume))
  g.connect(c.destination)
  return { c, g }
}

/** Crispy split click: short noise burst + pitched tick */
export function playSplit(volume = 0.6) {
  const { c, g } = master(volume)
  const now = c.currentTime

  // White noise burst — crispy high-end component
  const bufLen = c.sampleRate * 0.04
  const buf = c.createBuffer(1, bufLen, c.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1)

  const noise = c.createBufferSource()
  noise.buffer = buf

  const bpf = c.createBiquadFilter()
  bpf.type = 'bandpass'
  bpf.frequency.value = 4000
  bpf.Q.value = 1.5

  const noiseGain = c.createGain()
  noiseGain.gain.setValueAtTime(0.9, now)
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04)

  noise.connect(bpf)
  bpf.connect(noiseGain)
  noiseGain.connect(g)
  noise.start(now)
  noise.stop(now + 0.05)

  // Pitched tick body
  const osc = c.createOscillator()
  const oscGain = c.createGain()
  osc.type = 'square'
  osc.frequency.setValueAtTime(720, now)
  osc.frequency.exponentialRampToValueAtTime(180, now + 0.06)
  oscGain.gain.setValueAtTime(0.35, now)
  oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07)
  osc.connect(oscGain)
  oscGain.connect(g)
  osc.start(now)
  osc.stop(now + 0.08)
}

/** PB fanfare: bright ascending major arpeggio */
export function playPB(volume = 0.55) {
  const { c, g } = master(volume)
  const now = c.currentTime

  // C5 E5 G5 C6 — quick ascending stagger
  const freqs = [523.25, 659.25, 783.99, 1046.5]
  freqs.forEach((freq, i) => {
    const t = now + i * 0.075

    const osc = c.createOscillator()
    const oscGain = c.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(freq, t)

    oscGain.gain.setValueAtTime(0, t)
    oscGain.gain.linearRampToValueAtTime(0.5, t + 0.015)
    oscGain.gain.setValueAtTime(0.5, t + 0.08)
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.22)

    // Slight shimmer with a detuned second oscillator
    const osc2 = c.createOscillator()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(freq * 2, t)
    const osc2Gain = c.createGain()
    osc2Gain.gain.setValueAtTime(0.15, t)
    osc2Gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18)
    osc2.connect(osc2Gain)
    osc2Gain.connect(g)
    osc2.start(t)
    osc2.stop(t + 0.22)

    osc.connect(oscGain)
    oscGain.connect(g)
    osc.start(t)
    osc.stop(t + 0.25)
  })
}

/** No-PB: two descending minor notes, slightly muted */
export function playNoPB(volume = 0.45) {
  const { c, g } = master(volume)
  const now = c.currentTime

  // B4 → G#4 (descending minor third, slightly sad)
  const freqs = [493.88, 415.3]
  freqs.forEach((freq, i) => {
    const t = now + i * 0.13

    const osc = c.createOscillator()
    const oscGain = c.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, t)
    osc.frequency.setValueAtTime(freq * 0.98, t + 0.05) // slight droop

    oscGain.gain.setValueAtTime(0, t)
    oscGain.gain.linearRampToValueAtTime(0.4, t + 0.02)
    oscGain.gain.setValueAtTime(0.4, t + 0.07)
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.28)

    osc.connect(oscGain)
    oscGain.connect(g)
    osc.start(t)
    osc.stop(t + 0.32)
  })
}
