/** FFmpeg command builders and encoder capability probe (Node / Vitest). */

export interface EncodeTargets {
  framesDir: string
  name: string
  fps: number
}

export function framesPattern(framesDir: string): string {
  const sep = framesDir.endsWith('/') ? '' : '/'
  return `${framesDir}${sep}frame_%06d.png`
}

export function proresCommand(targets: EncodeTargets, outDir: string): string[] {
  const out = `${outDir}/${targets.name}_prores4444.mov`
  return [
    '-y',
    '-framerate',
    String(targets.fps),
    '-i',
    framesPattern(targets.framesDir),
    '-c:v',
    'prores_ks',
    '-profile:v',
    '4444',
    '-pix_fmt',
    'yuva444p10le',
    out,
  ]
}

export function webmAlphaCommand(targets: EncodeTargets, outDir: string): string[] {
  const out = `${outDir}/${targets.name}_alpha.webm`
  return [
    '-y',
    '-framerate',
    String(targets.fps),
    '-i',
    framesPattern(targets.framesDir),
    '-c:v',
    'libvpx-vp9',
    '-pix_fmt',
    'yuva420p',
    '-b:v',
    '8M',
    out,
  ]
}

export function mp4PreviewCommand(
  targets: EncodeTargets,
  outDir: string,
  bgColor = '0x1a1a1e',
): string[] {
  const out = `${outDir}/${targets.name}_preview.mp4`
  return [
    '-y',
    '-framerate',
    String(targets.fps),
    '-i',
    framesPattern(targets.framesDir),
    '-vf',
    `format=yuv420p,scale=trunc(iw/2)*2:trunc(ih/2)*2,colorchannelmixer=aa=1.0,drawbox=t=fill:c=${bgColor}:replace=1`,
    '-c:v',
    'libx264',
    '-pix_fmt',
    'yuv420p',
    out,
  ]
}

export function probeEncodersOutput(stdout: string): {
  prores: boolean
  vp9: boolean
  x264: boolean
} {
  return {
    prores: stdout.includes('prores_ks'),
    vp9: stdout.includes('libvpx-vp9'),
    x264: stdout.includes('libx264'),
  }
}
