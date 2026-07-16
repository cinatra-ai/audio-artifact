// The versioned, normalized, SERIALIZABLE props snapshot a Cinatra
// extension-shipped artifact renderer receives from the host.
//
// A v1 renderer requests NO host ports — it renders ONLY from this
// host-supplied authorized snapshot. Every field is plain JSON data: row
// metadata, the resolved representation, host-authorized URLs, and sanctioned
// action handles as navigational hrefs (never closures / host context). The
// host access-checks each URL BEFORE building this snapshot; the renderer just
// references them.
//
// This is a HOST-NEUTRAL STRUCTURAL MIRROR of the host's internal props
// contract, declared locally so the renderer stays standalone-typecheckable and
// -testable (the concrete host type lives in the host application and is not a
// published package). The shape is byte-compatible with the host contract: a
// host that hands a superset object still assigns to this structural type.

export const ARTIFACT_RENDERER_PROPS_API_VERSION = 1;

export type ArtifactOwnerLevel = "owner" | "workspace" | "org" | "public";
export type ArtifactVisibility = "private" | "workspace" | "org" | "public";
export type EffectiveIdentityKind = "extension" | "mime" | "generic";

export interface ArtifactRendererProps {
  /** The props-contract version this snapshot conforms to. A renderer declares
   * the `propsApiVersion` it expects; the host refuses to mount a renderer whose
   * expected version this snapshot does not satisfy. */
  propsApiVersion: number;
  /** Row metadata (a projection of the authorized artifact summary). */
  artifact: {
    id: string;
    title: string | null;
    objectType: string;
    mime: string;
    size: number;
    createdAt: string;
    updatedAt: string;
    ownerLevel: ArtifactOwnerLevel;
    visibility: ArtifactVisibility;
    sourceUrl: string | null;
  };
  /** The resolved representation to serve (null when the artifact has no
   * materialized representation). */
  representation: {
    revisionId: string;
    mime: string;
  } | null;
  /** Host-authorized URLs. Already access-checked by the host — reference only. */
  urls: {
    preview: string | null;
    download: string | null;
  };
  /** The resolved effective identity, flattened to plain data. */
  identity: {
    kind: EffectiveIdentityKind;
    extension: string | null;
    basis: string | null;
    selectable: boolean;
  };
  /** Sanctioned action handles — SERIALIZABLE navigational hrefs only. */
  actions: {
    download: string | null;
    openInSource: string | null;
  };
}
