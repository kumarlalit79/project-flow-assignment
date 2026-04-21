import { useEffect, useState } from "react";
import { api } from "../lib/axios";
import { getSocket } from "../services/socket.service";

interface Project {
  _id: string;
  name: string;
  description: string;
}

const ProjectsPage = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchProjects = async () => {
      try {
        const res = await api.get("/projects");

        if (isMounted) {
          setProjects(res.data.data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProjects();

    return () => {
      isMounted = false;
    };
  }, []);

  // 🔥 SOCKET LOGIC
  useEffect(() => {
    const socket = getSocket();

    if (!socket) return;

    // Join all project rooms
    projects.forEach((project) => {
      socket.emit("join:project", { projectId: project._id });
    });

    // Listen for task updates
    socket.on("task:updated", (data) => {
      console.log("Task updated:", data);
    });

    socket.on("task:created", (data) => {
      console.log("Task created:", data);
    });

    socket.on("task:deleted", (data) => {
      console.log("Task deleted:", data);
    });

    return () => {
      socket.off("task:updated");
      socket.off("task:created");
      socket.off("task:deleted");
    };
  }, [projects]);

  if (loading) return <div>Loading projects...</div>;

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Projects</h1>

      {projects.length === 0 ? (
        <p>No projects found</p>
      ) : (
        <div className="space-y-3">
          {projects.map((project) => (
            <div key={project._id} className="border p-3 rounded">
              <h2 className="font-medium">{project.name}</h2>
              <p className="text-sm text-gray-600">
                {project.description}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;