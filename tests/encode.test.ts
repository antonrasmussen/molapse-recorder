import { describe, expect, it } from 'vitest'
import {
  framesPattern,
  mp4PreviewCommand,
  probeEncodersOutput,
  proresCommand,
  webmAlphaCommand,
} from '../encoder/encode'

describe('encoder commands', () => {
  const targets = {
    framesDir: './exports/aspirin/frames',
    name: 'aspirin',
    fps: 30,
  }

  it('builds frame pattern', () => {
    expect(framesPattern('./exports/aspirin/frames')).toContain('frame_%06d.png')
  })

  it('builds prores args with alpha pix fmt', () => {
    const args = proresCommand(targets, './exports/aspirin')
    expect(args).toContain('prores_ks')
    expect(args).toContain('yuva444p10le')
    expect(args[args.length - 1]).toContain('prores4444.mov')
  })

  it('builds webm alpha args', () => {
    const args = webmAlphaCommand(targets, './exports/aspirin')
    expect(args).toContain('libvpx-vp9')
    expect(args).toContain('yuva420p')
  })

  it('builds mp4 preview args', () => {
    const args = mp4PreviewCommand(targets, './exports/aspirin')
    expect(args).toContain('libx264')
    expect(args).toContain('yuv420p')
  })

  it('probes encoders from ffmpeg -encoders text', () => {
    const sample = `
      V..... prores_ks
      V..... libvpx-vp9
      V..... libx264
    `
    const r = probeEncodersOutput(sample)
    expect(r.prores).toBe(true)
    expect(r.vp9).toBe(true)
    expect(r.x264).toBe(true)
  })
})
