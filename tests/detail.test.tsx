import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";

import AudioArtifactDetail from "../src/renderers/detail";
import type { ArtifactRendererProps } from "../src/artifact-renderer-props";

afterEach(cleanup);

/** A complete, serializable host snapshot with overridable pieces. */
function props(overrides: {
  preview?: string | null;
  download?: string | null;
  title?: string | null;
}): ArtifactRendererProps {
  return {
    propsApiVersion: 1,
    artifact: {
      id: "art_1",
      title: overrides.title === undefined ? "Interview take 3" : overrides.title,
      objectType: "audio",
      mime: "audio/mpeg",
      size: 1024,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      ownerLevel: "workspace",
      visibility: "workspace",
      sourceUrl: null,
    },
    representation: { revisionId: "rev_1", mime: "audio/mpeg" },
    urls: {
      preview: overrides.preview === undefined ? "/api/artifacts/art_1/preview" : overrides.preview,
      download: overrides.download === undefined ? "/api/artifacts/art_1/download" : overrides.download,
    },
    identity: { kind: "mime", extension: null, basis: null, selectable: false },
    actions: {
      download: overrides.download === undefined ? "/api/artifacts/art_1/download" : overrides.download,
      openInSource: null,
    },
  };
}

describe("AudioArtifactDetail — the ported audio player", () => {
  it("renders a native <audio> element pointed at the host preview URL", () => {
    const { container } = render(<AudioArtifactDetail {...props({ preview: "/preview/x.mp3" })} />);
    const audio = container.querySelector("audio");
    expect(audio).not.toBeNull();
    expect(audio?.getAttribute("src")).toBe("/preview/x.mp3");
  });

  it("preserves the host UX: controls, preload=metadata, no autoplay, full-width", () => {
    const { container } = render(<AudioArtifactDetail {...props({})} />);
    const audio = container.querySelector("audio");
    expect(audio?.hasAttribute("controls")).toBe(true);
    expect(audio?.getAttribute("preload")).toBe("metadata");
    expect(audio?.hasAttribute("autoplay")).toBe(false);
    expect(audio?.getAttribute("class")).toContain("block w-full");
  });

  it("wraps the player in the host soft-panel card", () => {
    const { container } = render(<AudioArtifactDetail {...props({})} />);
    const panel = container.querySelector('[data-audio-artifact="player"]');
    expect(panel?.tagName.toLowerCase()).toBe("article");
    expect(panel?.getAttribute("class")).toContain("soft-panel rounded-card");
  });

  it("labels the player with the artifact title when present", () => {
    const { container } = render(<AudioArtifactDetail {...props({ title: "Weekly sync" })} />);
    expect(container.querySelector("audio")?.getAttribute("aria-label")).toBe(
      "Audio preview: Weekly sync",
    );
  });

  it("falls back to a generic label when the title is absent", () => {
    const { container } = render(<AudioArtifactDetail {...props({ title: null })} />);
    expect(container.querySelector("audio")?.getAttribute("aria-label")).toBe("Audio preview");
  });

  it("NEVER-BLANK: a null preview URL degrades to a notice + download link, not an empty node", () => {
    const { container } = render(
      <AudioArtifactDetail {...props({ preview: null, download: "/dl/x.mp3" })} />,
    );
    expect(container.querySelector("audio")).toBeNull();
    const floor = container.querySelector('[data-audio-artifact="floor"]');
    expect(floor).not.toBeNull();
    expect(floor?.textContent).toContain("Audio preview is not available");
    const dl = container.querySelector("a");
    expect(dl?.getAttribute("href")).toBe("/dl/x.mp3");
    // never-blank: the rendered subtree has real content.
    expect((container.textContent ?? "").trim().length).toBeGreaterThan(0);
  });

  it("NEVER-BLANK: null preview AND null download still renders the notice without crashing", () => {
    const { container } = render(
      <AudioArtifactDetail {...props({ preview: null, download: null })} />,
    );
    expect(container.querySelector("audio")).toBeNull();
    expect(container.querySelector("a")).toBeNull();
    expect(container.querySelector('[data-audio-artifact="floor"]')).not.toBeNull();
    expect((container.textContent ?? "").trim().length).toBeGreaterThan(0);
  });

  it("tolerates a malformed snapshot missing the urls/actions objects (never throws, never blank)", () => {
    // A defensive check: the host contract guarantees these objects, but a
    // malformed/partial snapshot must still degrade to the floor, not crash.
    const malformed = {
      propsApiVersion: 1,
      artifact: { title: null },
    } as unknown as ArtifactRendererProps;
    const { container } = render(<AudioArtifactDetail {...malformed} />);
    expect(container.querySelector('[data-audio-artifact="floor"]')).not.toBeNull();
    expect((container.textContent ?? "").trim().length).toBeGreaterThan(0);
  });
});
