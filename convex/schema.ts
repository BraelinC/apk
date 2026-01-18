import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  projects: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    packageName: v.string(), // e.g., com.healthymama.app
    createdAt: v.number(),
  }).index("by_name", ["name"]),

  apks: defineTable({
    projectId: v.id("projects"),
    version: v.string(), // e.g., "1.0.0"
    buildNumber: v.optional(v.number()),
    fileName: v.string(),
    fileSize: v.number(), // in bytes
    storageId: v.optional(v.string()), // R2 storage ID
    downloadUrl: v.optional(v.string()), // Direct URL if stored externally
    buildType: v.union(v.literal("debug"), v.literal("release")),
    notes: v.optional(v.string()), // Release notes
    createdAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_project_version", ["projectId", "version"]),
});
