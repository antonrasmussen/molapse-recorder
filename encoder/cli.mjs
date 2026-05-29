#!/usr/bin/env node
/**
 * Local FFmpeg encoder: PNG frame folder -> ProRes 4444 / WebM alpha / MP4 preview.
 * Usage: node encoder/cli.mjs --frames ./exports/aspirin/frames --name aspirin --fps 30 --out ./exports/aspirin
 */
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

const args = parseArgs(process.argv.slice(2))

if (!args.frames || !args.name) {
  console.error(
    'Usage: node encoder/cli.mjs --frames <dir> --name <basename> [--fps 30] [--out <dir>] [--formats png-sequence,prores,webm,mp4]',
  )
  process.exit(1)
}

const framesDir = resolve(args.frames)
const outDir = resolve(args.out ?? framesDir)
const fps = Number(args.fps ?? 30)
const formats = (args.formats ?? 'prores,webm,mp4').split(',').map((s) => s.trim())

if (!existsSync(framesDir)) {
  console.error(`Frames directory not found: ${framesDir}`)
  process.exit(1)
}

const ffmpeg = process.env.FFMPEG ?? 'ffmpeg'
const encoders = await probeEncoders(ffmpeg)
const targets = { framesDir, name: args.name, fps }

let ok = true
if (formats.includes('prores')) {
  if (encoders.prores) {
    await runFfmpeg(ffmpeg, proresArgs(targets, outDir))
  } else {
    console.warn('Skip ProRes 4444: prores_ks encoder not available')
  }
}
if (formats.includes('webm')) {
  if (encoders.vp9) {
    await runFfmpeg(ffmpeg, webmArgs(targets, outDir))
  } else {
    console.warn('Skip WebM alpha: libvpx-vp9 encoder not available')
  }
}
if (formats.includes('mp4')) {
  if (encoders.x264) {
    await runFfmpeg(ffmpeg, mp4Args(targets, outDir))
  } else {
    console.warn('Skip MP4: libx264 encoder not available')
  }
}

console.log('PNG sequence remains canonical in:', framesDir)
process.exit(ok ? 0 : 1)

function parseArgs(argv) {
  const out = {}
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].slice(2)
      out[key] = argv[i + 1] ?? true
      i++
    }
  }
  return out
}

function pattern(dir) {
  const sep = dir.endsWith('/') ? '' : '/'
  return `${dir}${sep}frame_%06d.png`
}

function proresArgs(t, outDir) {
  return [
    '-y',
    '-framerate',
    String(t.fps),
    '-i',
    pattern(t.framesDir),
    '-c:v',
    'prores_ks',
    '-profile:v',
    '4444',
    '-pix_fmt',
    'yuva444p10le',
    `${outDir}/${t.name}_prores4444.mov`,
  ]
}

function webmArgs(t, outDir) {
  return [
    '-y',
    '-framerate',
    String(t.fps),
    '-i',
    pattern(t.framesDir),
    '-c:v',
    'libvpx-vp9',
    '-pix_fmt',
    'yuva420p',
    '-b:v',
    '8M',
    `${outDir}/${t.name}_alpha.webm`,
  ]
}

function mp4Args(t, outDir) {
  return [
    '-y',
    '-framerate',
    String(t.fps),
    '-i',
    pattern(t.framesDir),
    '-vf',
    'format=yuv420p,scale=trunc(iw/2)*2:trunc(ih/2)*2',
    '-c:v',
    'libx264',
    '-pix_fmt',
    'yuv420p',
    `${outDir}/${t.name}_preview.mp4`,
  ]
}

function runFfmpeg(bin, ffArgs) {
  return new Promise((resolve, reject) => {
    console.log('Running:', bin, ffArgs.join(' '))
    const p = spawn(bin, ffArgs, { stdio: 'inherit' })
    p.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg exit ${code}`))))
  })
}

function probeEncoders(bin) {
  return new Promise((resolve) => {
    const p = spawn(bin, ['-encoders'], { stdio: ['ignore', 'pipe', 'pipe'] })
    let out = ''
    p.stdout.on('data', (d) => (out += d))
    p.on('close', () => {
      resolve({
        prores: out.includes('prores_ks'),
        vp9: out.includes('libvpx-vp9'),
        x264: out.includes('libx264'),
      })
    })
    p.on('error', () => resolve({ prores: false, vp9: false, x264: false }))
  })
}
