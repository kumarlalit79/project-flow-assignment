import { useEffect, useState } from "react";
import { api } from "../lib/axios";
import { Link } from "react-router-dom";

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

 

  if (loading) return <div>Loading projects...</div>;

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Projects</h1>

      {projects.length === 0 ? (
        <p>No projects found</p>
      ) : (
        <div className="space-y-3">
          {projects.map((project) => (
            <Link
              key={project._id}
              to={`/projects/${project._id}`}
              className="block border p-3 rounded hover:bg-gray-50"
            >
              <h2 className="font-medium">{project.name}</h2>
              <p className="text-sm text-gray-600">{project.description}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
