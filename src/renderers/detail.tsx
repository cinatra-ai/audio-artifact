/**
 * Audio detail renderer.
 *
 * Renders any allowlisted audio MIME (MP3/M4A/Ogg/WAV/WebM/FLAC/AAC — the
 * `audio/*` representation) via a native audio element pointed at the address
 * the host handed it. Range requests on that address make seeking
 * stream-friendly (browsers issue `bytes=0-` then follow-up ranges). No client
 * JS beyond React — the browser's media stack does the work.
 *
 * THE ADDRESS COMES FROM THE BYTE ROAD. A media element's load is a subresource
 * request and inside a third-party application it carries no cookie, so a
 * player pointed at the host's session route plays nothing there. At props
 * version 2 the snapshot carries the byte reference the reader may actually
 * fetch on the surface they are on; a snapshot built at the older version has
 * no reference, falls back to the session href, and still plays. The renderer
 * builds no address of its own and fetches nothing itself.
 *
 * `preload="metadata"` fetches only the header bytes (duration for the
 * controls), not the whole file. No autoplay — playback is always
 * user-initiated.
 *
 * This is the extension-owned renderer for the `detail` slot. It consumes ONLY
 * the host-supplied authorized snapshot and requests no host ports.
 *
 * NEVER-BLANK: no playable address on any road (an unmaterialized or expired
 * representation, or otherwise malformed content) degrades to an inline notice
 * plus a download affordance when one exists — the renderer always emits a
 * panel, never an empty node.
 */
import type { ReactElement } from "react";

import type { ArtifactRendererProps } from "../artifact-renderer-props";
import { resolveByteRoad } from "./byte-road";

export default function AudioArtifactDetail(props: ArtifactRendererProps): ReactElement {
  const bytes = resolveByteRoad(props);
  const title = props.artifact?.title ?? null;
  const label = title ? `Audio preview: ${title}` : "Audio preview";

  if (!bytes.preview) {
    return (
      <article
        className="soft-panel rounded-card overflow-hidden p-6"
        data-audio-artifact="floor"
        data-byte-road={bytes.road}
      >
        <p className="text-sm text-muted-foreground">
          Audio preview is not available for this artifact.
        </p>
        {bytes.download ? (
          <a href={bytes.download} className="text-sm underline" download>
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
      data-byte-road={bytes.road}
    >
      <audio
        src={bytes.preview}
        controls
        preload="metadata"
        className="block w-full"
        aria-label={label}
      />
    </article>
  );
}
