import { describe, it, expect } from "vitest";
import { parseFrontmatter } from "../src/vault/lib/frontmatter.js";

const valid = `---
id: "20260831-test"
title: "Test"
type: "hyperfixation"
status: "active"
created: "2026-08-31"
updated: "2026-08-31"
tags: []
aliases: []
resume_point: { last_explored: "", current_thought: "", next_step: "" }
content_potential: { suggested_format: "none", confidence_score: 0.0 }
---
Body`;

describe("frontmatter", () => {
  it("validates correct file", () => {
    const { errors, data } = parseFrontmatter(valid, "test.md");
    expect(errors).toEqual([]);
    expect(data.type).toBe("hyperfixation");
  });
  it("rejects bad dates", () => {
    const bad = valid.replace("2026-08-31", "31-08-2026");
    const { errors } = parseFrontmatter(bad, "bad.md");
    expect(errors.length).toBeGreaterThan(0);
  });
});
