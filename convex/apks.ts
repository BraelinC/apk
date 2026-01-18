import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const apks = await ctx.db.query("apks").order("desc").collect();

    // Enrich with project info
    const enriched = await Promise.all(
      apks.map(async (apk) => {
        const project = await ctx.db.get(apk.projectId);
        return {
          ...apk,
          projectName: project?.name ?? "Unknown",
          packageName: project?.packageName ?? "Unknown",
        };
      })
    );

    return enriched;
  },
});

export const listByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("apks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .collect();
  },
});

export const get = query({
  args: { id: v.id("apks") },
  handler: async (ctx, args) => {
    const apk = await ctx.db.get(args.id);
    if (!apk) return null;

    const project = await ctx.db.get(apk.projectId);
    return {
      ...apk,
      projectName: project?.name ?? "Unknown",
      packageName: project?.packageName ?? "Unknown",
    };
  },
});

export const getLatest = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("apks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .first();
  },
});

export const create = mutation({
  args: {
    projectId: v.id("projects"),
    version: v.string(),
    buildNumber: v.optional(v.number()),
    fileName: v.string(),
    fileSize: v.number(),
    storageId: v.optional(v.string()),
    downloadUrl: v.optional(v.string()),
    buildType: v.union(v.literal("debug"), v.literal("release")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("apks", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("apks"),
    version: v.optional(v.string()),
    buildNumber: v.optional(v.number()),
    notes: v.optional(v.string()),
    downloadUrl: v.optional(v.string()),
    storageId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );
    await ctx.db.patch(id, filtered);
  },
});

export const remove = mutation({
  args: { id: v.id("apks") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Generate upload URL for APK files
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Get download URL for stored file
export const getDownloadUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});
