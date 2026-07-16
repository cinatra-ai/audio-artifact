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

  it("declares only the allowed cinatra.* keys (no matcher/objectTypes claim)", () => {
    for (const k of Object.keys(pkg.cinatra)) {
      expect(ARTIFACT_ALLOWED_CINATRA_KEYS.has(k)).toBe(true);
    }
    // A renderer artifact ships no matcher skill bundle.
    expect("skills" in pkg.cinatra.artifact).toBe(false);
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
