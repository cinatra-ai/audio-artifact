/**
 * Audio detail renderer.
 *
 * Renders any allowlisted audio MIME (MP3/M4A/Ogg/WAV/WebM/FLAC/AAC — the
 * `audio/*` representation) via a native `<audio>` element pointed at the
 * host-authorized preview URL. Range requests on the preview route make
 * seeking stream-friendly (browsers issue `bytes=0-` then follow-up ranges).
 * No client JS beyond React — the browser's media stack does the work.
 *
 * `preload="metadata"` fetches only the header bytes (duration for the
 * controls), not the whole file. No autoplay — playback is always
 * user-initiated.
 *
 * This is the extension-owned renderer for the `detail` slot. It consumes ONLY
 * the host-supplied authorized snapshot (`ArtifactRendererProps`) and requests
 * no host ports.
 *
 * NEVER-BLANK: a missing preview URL (an unmaterialized or expired
 * representation, or otherwise malformed content) degrades to an inline notice
 * plus a download affordance when one exists — the renderer always emits a
 * panel, never an empty node.
 */
import type { ReactElement } from "react";

import type { ArtifactRendererProps } from "../artifact-renderer-props";

export default function AudioArtifactDetail(props: ArtifactRendererProps): ReactElement {
  const previewHref = props.urls?.preview ?? null;
  const downloadHref = props.actions?.download ?? props.urls?.download ?? null;
  const title = props.artifact?.title ?? null;
  const label = title ? `Audio preview: ${title}` : "Audio preview";

  if (!previewHref) {
    return (
      <article
        className="soft-panel rounded-card overflow-hidden p-6"
        data-audio-artifact="floor"
      >
        <p className="text-sm text-muted-foreground">
          Audio preview is not available for this artifact.
        </p>
        {downloadHref ? (
          <a href={downloadHref} className="text-sm underline" download>
            Download the audio file
          </a>
        ) : null}
      </article>
    );
  }

  return (
    <article
      className="soft-panel rounded-card overflow-hidden p-6"
      data-audio-artifact="player"
    >
      <audio
        src={previewHref}
        controls
        preload="metadata"
        className="block w-full"
        aria-label={label}
      />
    </article>
  );
}
