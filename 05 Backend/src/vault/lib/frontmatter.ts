import matter from "gray-matter";
import { z } from "zod";

export const FrontmatterSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  type: z.enum(["inbox", "hyperfixation", "atomic-concept", "content-project", "moc"]),
  status: z.enum(["raw", "active", "parked", "synthesized", "drafting", "published", "archived"]),
  created: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  updated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  tags: z.array(z.string()).default([]),
  aliases: z.array(z.string()).default([]),
  resume_point: z
    .object({
      last_explored: z.string().default(""),
      current_thought: z.string().default(""),
      next_step: z.string().default(""),
    })
    .default({ last_explored: "", current_thought: "", next_step: "" }),
  content_potential: z
    .object({
      suggested_format: z.enum(["essay", "video", "newsletter", "thread", "guide", "podcast", "none"]).default("none"),
      confidence_score: z.number().min(0).max(1).default(0.0),
    })
    .default({ suggested_format: "none", confidence_score: 0.0 }),
});

export type Frontmatter = z.infer<typeof FrontmatterSchema>;

/** Lenient parse: validates known fields, preserves unknown. Returns errors instead of throwing. */
export function parseFrontmatter(raw: string, filePath: string): { data: any; content: string; errors: string[]; matterResult: matter.GrayMatterFile<string> } {
  let result: matter.GrayMatterFile<string>;
  try {
    result = matter(raw);
  } catch (e: any) {
    return { data: {}, content: raw, errors: [`${filePath}: YAML parse error — ${e.message}`], matterResult: { data: {}, content: raw, excerpt: "", orig: raw } as any };
  }
  const parsed = FrontmatterSchema.safeParse(result.data);
  if (!parsed.success) {
    const errs = parsed.error.issues.map((i) => `${filePath}: frontmatter.${i.path.join(".")}: ${i.message}`);
    return { data: result.data, content: result.content, errors: errs, matterResult: result };
  }
  return { data: parsed.data, content: result.content, errors: [], matterResult: result };
}

export function validateFile(raw: string, filePath: string): string[] {
  return parseFrontmatter(raw, filePath).errors;
}

export function stringifyWithFrontmatter(data: Frontmatter, content: string): string {
  return matter.stringify(content, data as any);
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function generateId(): string {
  const ts = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
  const rand = Math.random().toString(36).slice(2, 6);
  return `${ts}-${rand}`;
}
