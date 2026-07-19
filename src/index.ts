// `@cinatra-ai/audio-artifact` — the system-base audio renderer.
//
// A renderer artifact: it ships a `detail`-slot renderer for the `audio/*`
// representation. It carries no matcher — audio rows resolve to this renderer
// through the representation provider, not through a semantic classifier.
//
// Per the ratified upload-typing ruling (epic cinatra#1785, owner entry 106-B),
// this REQUIRED system-base pack also DECLARES exactly one explicit object type
// (`@cinatra-ai/audio-artifact:recording`, claim "dedicated"): a human upload
// mapped by mime (`audio/*`) is persisted under this declared type. Without the
// declaration the mime-map would resolve to nothing post-#1824. The declaration
// is AUTHORITATIVE in the `package.json` cinatra block (below).
//
// The AUTHORITATIVE manifest is the `cinatra` block in `package.json` (what the
// host install pipeline + the marketplace publish gate read). This module
// re-declares the `artifact` descriptor as a typed value for programmatic use;
// the two are kept in agreement by the manifest test.

export {
  type ArtifactRendererProps,
  ARTIFACT_RENDERER_PROPS_API_VERSION,
} from "./artifact-renderer-props";

/** The closed v1 renderer-slot names (`detail` = the artifact detail view;
 * `preview` = the neutral inline preview). This base ships `detail` only. */
export type ArtifactUiSlot = "detail" | "preview";

/** A single slot renderer. v1 requests NO host ports — only these three keys. */
export interface ArtifactUiRenderer {
  entry: string;
  propsApiVersion: number;
  representations?: string[];
}

export interface ArtifactUiManifest {
  abiVersion: 1;
  sdkAbiRange: string;
  renderers: Partial<Record<ArtifactUiSlot, ArtifactUiRenderer>>;
}

export interface AudioArtifactManifest {
  accepts: { file: { mimeTypes: string[] } };
  ui: ArtifactUiManifest;
}

export const audioArtifactManifest: AudioArtifactManifest = {
  accepts: {
    file: {
      mimeTypes: ["audio/*"],
    },
  },
  ui: {
    abiVersion: 1,
    sdkAbiRange: "^2.4.0",
    renderers: {
      detail: {
        entry: "./src/renderers/detail.tsx",
        propsApiVersion: 1,
        representations: ["audio/*"],
      },
    },
  },
};
