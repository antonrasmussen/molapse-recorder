/**
 * MP4 preview via WebCodecs when available; otherwise returns FFmpeg CLI hint.
 */

export interface Mp4PreviewResult {
  method: 'webcodecs' | 'skipped'
  blob?: Blob
  ffmpegCommand?: string
}

export function isWebCodecsSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'VideoEncoder' in window &&
    typeof VideoEncoder !== 'undefined'
  )
}

export function ffmpegMp4Hint(framesDir: string, outputPath: string): string {
  return `ffmpeg -y -framerate 30 -i "${framesDir}/frame_%06d.png" -c:v libx264 -pix_fmt yuv420p "${outputPath}"`
}

/**
 * Encode PNG blobs to a simple MP4 when WebCodecs + VideoEncoder work.
 * Falls back to documenting FFmpeg — browser alpha H.264 is limited.
 */
export async function tryEncodeMp4Preview(
  frameBlobs: Blob[],
  fps: number,
): Promise<Mp4PreviewResult> {
  if (!isWebCodecsSupported() || frameBlobs.length === 0) {
    return {
      method: 'skipped',
      ffmpegCommand: ffmpegMp4Hint('./exports/frames', './exports/preview.mp4'),
    }
  }

  try {
    const first = await createImageBitmap(frameBlobs[0])
    const width = first.width
    const height = first.height
    first.close()

    const chunks: EncodedVideoChunk[] = []
    const encoder = new VideoEncoder({
      output: (chunk) => chunks.push(chunk),
      error: (e) => {
        throw e
      },
    })

    encoder.configure({
      codec: 'avc1.42E01E',
      width,
      height,
      bitrate: 4_000_000,
      framerate: fps,
    })

    for (let i = 0; i < frameBlobs.length; i++) {
      const bitmap = await createImageBitmap(frameBlobs[i])
      const frame = new VideoFrame(bitmap, {
        timestamp: Math.round((i * 1_000_000) / fps),
        duration: Math.round(1_000_000 / fps),
      })
      encoder.encode(frame, { keyFrame: i % 30 === 0 })
      frame.close()
      bitmap.close()
    }
    await encoder.flush()
    encoder.close()

    const blob = new Blob(chunks as unknown as BlobPart[], {
      type: 'video/mp4',
    })
    return { method: 'webcodecs', blob }
  } catch {
    return {
      method: 'skipped',
      ffmpegCommand: ffmpegMp4Hint('./exports/frames', './exports/preview.mp4'),
    }
  }
}

export function downloadMp4(blob: Blob, filename = 'preview.mp4'): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
