import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Video, Users } from "lucide-react";

interface Project {
  id: string;
  name: string;
  status: string;
  created_at: string;
  _count?: {
    prospects: number;
  };
}

const Dashboard = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select(`
          id,
          name,
          status,
          created_at,
          prospects (count)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const projectsWithCounts = data?.map(project => ({
        ...project,
        _count: {
          prospects: project.prospects?.length || 0
        }
      })) || [];

      setProjects(projectsWithCounts);
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les projets",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createNewProject = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("projects")
        .insert([
          {
            name: `Projet ${new Date().toLocaleDateString()}`,
            status: "draft",
            user_id: user.id
          }
        ])
        .select()
        .single();

      if (error) throw error;

      navigate(`/project/${data.id}`);
    } catch (error) {
      console.error("Error creating project:", error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le projet",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "text-green-600 bg-green-100";
      case "processing": return "text-blue-600 bg-blue-100";
      case "error": return "text-red-600 bg-red-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "draft": return "Brouillon";
      case "processing": return "En cours";
      case "completed": return "Terminé";
      case "error": return "Erreur";
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Mes Projets Vidéo</h1>
          <p className="text-muted-foreground">
            Gérez vos campagnes de vidéos personnalisées
          </p>
        </div>
        <Button onClick={createNewProject} size="lg" className="gap-2">
          <Plus className="h-5 w-5" />
          Nouveau Projet
        </Button>
      </div>

      {projects.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Video className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Aucun projet créé</h3>
            <p className="text-muted-foreground mb-6">
              Commencez par créer votre premier projet de vidéos personnalisées
            </p>
            <Button onClick={createNewProject} className="gap-2">
              <Plus className="h-5 w-5" />
              Créer mon premier projet
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card 
              key={project.id} 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(`/project/${project.id}`)}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                    {getStatusText(project.status)}
                  </span>
                </div>
                <CardDescription>
                  Créé le {new Date(project.created_at).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{project._count?.prospects || 0} prospects</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;