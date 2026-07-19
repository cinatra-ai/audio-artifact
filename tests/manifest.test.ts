// @vitest-environment node
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { audioArtifactManifest } from "../src/index";

const pkg = JSON.parse(
  readFileSync(fileURLToPath(new URL("../package.json", import.meta.url)), "utf8"),
) as {
  name: string;
  cinatra: {
    apiVersion: string;
    kind: string;
    displayName: string;
    vendor: { key: string; name: string };
    dependencies: unknown[];
    artifact: {
      accepts: { file: { mimeTypes: string[] } };
      ui: {
        abiVersion: number;
        sdkAbiRange: string;
        renderers: Record<string, { entry: string; propsApiVersion: number; representations?: string[] }>;
      };
      objectTypes?: Array<{
        type: string;
        claim: string;
        dispositions?: {
          projection?: string;
          pinnable?: boolean;
          snapshotPolicy?: string;
          sensitivity?: string;
          mutability?: string;
        };
        schema?: { type?: string; properties?: Record<string, unknown>; required?: string[]; additionalProperties?: boolean };
      }>;
    };
  };
};

const ARTIFACT_ALLOWED_CINATRA_KEYS = new Set([
  "kind",
  "apiVersion",
  "artifact",
  "dependencies",
  "roles",
  "displayName",
  "vendor",
]);
const ARTIFACT_UI_RENDERER_ALLOWED_KEYS = new Set(["entry", "propsApiVersion", "representations"]);

describe("package.json manifest — the system-base audio identity", () => {
  it("names the package per the @cinatra-ai/<slug>-artifact convention", () => {
    expect(pkg.name).toBe("@cinatra-ai/audio-artifact");
  });

  it("declares the first-party artifact identity", () => {
    expect(pkg.cinatra.kind).toBe("artifact");
    expect(pkg.cinatra.apiVersion).toBe("cinatra.ai/v1");
    expect(pkg.cinatra.displayName).toBe("Audio");
    expect(pkg.cinatra.vendor).toEqual({ key: "cinatra-ai", name: "Cinatra" });
  });

  it("omits dependency edges (a system base is platform-guaranteed)", () => {
    expect(pkg.cinatra.dependencies).toEqual([]);
  });

  it("declares only the allowed cinatra.* keys (no matcher skill bundle)", () => {
    for (const k of Object.keys(pkg.cinatra)) {
      expect(ARTIFACT_ALLOWED_CINATRA_KEYS.has(k)).toBe(true);
    }
    // A renderer artifact ships no matcher skill bundle.
    expect("skills" in pkg.cinatra.artifact).toBe(false);
  });

  // Ratified upload-typing model (epic cinatra#1785, owner entry 106-B): a
  // REQUIRED system-base pack must DECLARE the object type its mime map
  // persists uploads under. The old pure-renderer model (zero objectTypes)
  // registered no type post-#1824, so the audio mime map resolved to nothing.
  it("DECLARES exactly one explicit uploaded-audio object type (cinatra#1785)", () => {
    const claims = pkg.cinatra.artifact.objectTypes;
    expect(Array.isArray(claims)).toBe(true);
    expect(claims).toHaveLength(1);

    const [claim] = claims!;
    // Namespaced, self-registered under this package's own namespace.
    expect(claim.type).toBe("@cinatra-ai/audio-artifact:recording");
    expect(claim.type.startsWith(`${pkg.name}:`)).toBe(true);
    expect(claim.claim).toBe("dedicated");

    // Artifact-safe projection; an uploaded audio blob is an immutable record,
    // snapshotted by metadata (not its bytes) and not pinnable into context.
    expect(claim.dispositions).toEqual({
      projection: "artifact-safe",
      pinnable: false,
      snapshotPolicy: "metadata",
      sensitivity: "normal",
      mutability: "record",
    });

    // The claim ships an inline schema (a self-registered type still ships one)
    // matching the persisted uploaded-object metadata shape (ArtifactObjectData).
    expect(claim.schema?.type).toBe("object");
    const props = claim.schema?.properties ?? {};
    for (const key of ["artifactType", "mime", "size", "originKind", "latestRepresentationRevisionId"]) {
      expect(key in props).toBe(true);
    }
    expect(claim.schema?.required).toEqual([
      "artifactType",
      "mime",
      "size",
      "originKind",
      "latestRepresentationRevisionId",
    ]);
  });

  it("CLAIMS EXACTLY audio/* and nothing else", () => {
    expect(pkg.cinatra.artifact.accepts.file.mimeTypes).toEqual(["audio/*"]);
    expect(pkg.cinatra.artifact.ui.renderers.detail.representations).toEqual(["audio/*"]);
  });

  it("declares a strict v1 ui block bound to the host SDK ABI", () => {
    const ui = pkg.cinatra.artifact.ui;
    expect(ui.abiVersion).toBe(1);
    expect(ui.sdkAbiRange).toBe("^2.4.0");
    expect(Object.keys(ui.renderers)).toEqual(["detail"]);
  });

  it("the detail renderer requests NO host ports (v1 no-ports contract)", () => {
    const detail = pkg.cinatra.artifact.ui.renderers.detail;
    for (const k of Object.keys(detail)) {
      expect(ARTIFACT_UI_RENDERER_ALLOWED_KEYS.has(k)).toBe(true);
    }
    expect(detail.propsApiVersion).toBe(1);
  });

  it("points the detail entry at a package-contained subpath that exists", () => {
    const entry = pkg.cinatra.artifact.ui.renderers.detail.entry;
    expect(entry).toBe("./src/renderers/detail.tsx");
    expect(entry.startsWith("./")).toBe(true);
    expect(entry.includes("..")).toBe(false);
    // The entry file is present in the package.
    const resolved = fileURLToPath(new URL(`../${entry.slice(2)}`, import.meta.url));
    expect(() => readFileSync(resolved, "utf8")).not.toThrow();
  });

  it("keeps the typed src manifest in agreement with package.json", () => {
    expect(audioArtifactManifest.accepts).toEqual(pkg.cinatra.artifact.accepts);
    expect(audioArtifactManifest.ui).toEqual(pkg.cinatra.artifact.ui);
  });
});
