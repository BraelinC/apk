"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { Id } from "../../convex/_generated/dataModel";

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ProjectCard({
  project,
  onSelect,
}: {
  project: {
    _id: Id<"projects">;
    name: string;
    description?: string;
    packageName: string;
    createdAt: number;
  };
  onSelect: (id: Id<"projects">) => void;
}) {
  const latestApk = useQuery(api.apks.getLatest, { projectId: project._id });

  return (
    <div
      className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border border-gray-200"
      onClick={() => onSelect(project._id)}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">{project.name}</h3>
          <p className="text-sm text-gray-500 font-mono">{project.packageName}</p>
        </div>
        <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
          {latestApk ? `v${latestApk.version}` : "No builds"}
        </div>
      </div>
      {project.description && (
        <p className="mt-2 text-gray-600 text-sm">{project.description}</p>
      )}
      {latestApk && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            Latest: {latestApk.fileName} ({formatFileSize(latestApk.fileSize)})
          </p>
          <p className="text-xs text-gray-400">
            {formatDate(latestApk.createdAt)}
          </p>
        </div>
      )}
    </div>
  );
}

function ApkList({ projectId }: { projectId: Id<"projects"> }) {
  const project = useQuery(api.projects.get, { id: projectId });
  const apks = useQuery(api.apks.listByProject, { projectId });

  if (!project) return <div className="text-gray-500">Loading...</div>;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{project.name}</h2>
        <p className="text-gray-500 font-mono text-sm">{project.packageName}</p>
        {project.description && (
          <p className="text-gray-600 mt-2">{project.description}</p>
        )}
      </div>

      <div className="space-y-4">
        {apks?.length === 0 && (
          <p className="text-gray-500 text-center py-8">
            No APK builds yet for this project.
          </p>
        )}
        {apks?.map((apk) => (
          <div
            key={apk._id}
            className="bg-white rounded-lg shadow p-4 border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">
                    v{apk.version}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      apk.buildType === "release"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {apk.buildType}
                  </span>
                </div>
                <p className="text-sm text-gray-500">{apk.fileName}</p>
                <p className="text-xs text-gray-400">
                  {formatFileSize(apk.fileSize)} &bull; {formatDate(apk.createdAt)}
                </p>
                {apk.notes && (
                  <p className="text-sm text-gray-600 mt-2">{apk.notes}</p>
                )}
              </div>
              <a
                href={apk.downloadUrl || "#"}
                download
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                onClick={(e) => {
                  if (!apk.downloadUrl) {
                    e.preventDefault();
                    alert("Download URL not available");
                  }
                }}
              >
                Download
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AddProjectModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const createProject = useMutation(api.projects.create);
  const [name, setName] = useState("");
  const [packageName, setPackageName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !packageName) return;

    setLoading(true);
    try {
      await createProject({
        name,
        packageName,
        description: description || undefined,
      });
      setName("");
      setPackageName("");
      setDescription("");
      onClose();
    } catch (error) {
      console.error("Failed to create project:", error);
      alert("Failed to create project");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Add New Project</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="HealthyMama"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Package Name
              </label>
              <input
                type="text"
                value={packageName}
                onChange={(e) => setPackageName(e.target.value)}
                placeholder="com.healthymama.app"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Recipe management app for healthy eating"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Home() {
  const projects = useQuery(api.projects.list);
  const [selectedProject, setSelectedProject] = useState<Id<"projects"> | null>(
    null
  );
  const [showAddProject, setShowAddProject] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {selectedProject && (
              <button
                onClick={() => setSelectedProject(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
            )}
            <h1 className="text-xl font-bold text-gray-900">APK Distribution</h1>
          </div>
          {!selectedProject && (
            <button
              onClick={() => setShowAddProject(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              + Add Project
            </button>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {selectedProject ? (
          <ApkList projectId={selectedProject} />
        ) : (
          <>
            {projects === undefined && (
              <div className="text-center py-12 text-gray-500">Loading...</div>
            )}
            {projects?.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">No projects yet.</p>
                <button
                  onClick={() => setShowAddProject(true)}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Add your first project
                </button>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects?.map((project) => (
                <ProjectCard
                  key={project._id}
                  project={project}
                  onSelect={setSelectedProject}
                />
              ))}
            </div>
          </>
        )}
      </main>

      <AddProjectModal
        isOpen={showAddProject}
        onClose={() => setShowAddProject(false)}
      />
    </div>
  );
}
