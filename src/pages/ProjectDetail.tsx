import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import UploadStep from "@/components/UploadStep";
import { ArrowLeft, Settings, Play, Users, Video } from "lucide-react";

interface Project {
  id: string;
  name: string;
  status: string;
  created_at: string;
  csv_file_url?: string;
  video1_url?: string;
  video2_url?: string;
}

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [currentStep, setCurrentStep] = useState<"upload" | "processing" | "results">("upload");

  useEffect(() => {
    if (id) {
      fetchProject();
    }
  }, [id]);

  const fetchProject = async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      setProject(data);
      setProjectName(data.name);
      
      // Determine current step based on project status
      if (data.status === "draft") {
        setCurrentStep("upload");
      } else if (data.status === "processing") {
        setCurrentStep("processing");
      } else if (data.status === "completed") {
        setCurrentStep("results");
      }
    } catch (error) {
      console.error("Error fetching project:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger le projet",
        variant: "destructive",
      });
      navigate("/dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const updateProjectName = async () => {
    if (!project || !projectName.trim()) return;

    try {
      const { error } = await supabase
        .from("projects")
        .update({ name: projectName.trim() })
        .eq("id", project.id);

      if (error) throw error;

      setProject(prev => prev ? { ...prev, name: projectName.trim() } : null);
      setIsEditing(false);
      toast({
        title: "Nom du projet mis à jour",
      });
    } catch (error) {
      console.error("Error updating project:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le nom",
        variant: "destructive",
      });
    }
  };

  const handleStartProcessing = () => {
    setCurrentStep("processing");
    // TODO: Start the actual processing
    toast({
      title: "Traitement lancé",
      description: "La génération des vidéos a commencé",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "processing": return "bg-blue-100 text-blue-800";
      case "error": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
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
          <p>Chargement du projet...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/dashboard")}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour
              </Button>
              
              <div className="flex items-center gap-3">
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      className="font-semibold text-lg"
                      onKeyPress={(e) => e.key === "Enter" && updateProjectName()}
                    />
                    <Button size="sm" onClick={updateProjectName}>
                      Valider
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => {
                        setProjectName(project.name);
                        setIsEditing(false);
                      }}
                    >
                      Annuler
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold">{project.name}</h1>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                
                <Badge className={getStatusColor(project.status)}>
                  {getStatusText(project.status)}
                </Badge>
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              Créé le {new Date(project.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {currentStep === "upload" && (
          <UploadStep 
            projectId={project.id} 
            onNext={handleStartProcessing}
          />
        )}

        {currentStep === "processing" && (
          <Card className="text-center py-12">
            <CardContent>
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
              <h3 className="text-xl font-semibold mb-2">Génération en cours...</h3>
              <p className="text-muted-foreground">
                Nous créons vos vidéos personnalisées. Cela peut prendre quelques minutes.
              </p>
            </CardContent>
          </Card>
        )}

        {currentStep === "results" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Résultats de la génération
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Les résultats s'afficheront ici une fois la génération terminée.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ProjectDetail;