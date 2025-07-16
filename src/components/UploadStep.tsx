import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Play, Eye, FileText } from "lucide-react";
import Papa from "papaparse";

interface UploadStepProps {
  projectId: string;
  onNext: () => void;
}

interface CSVData {
  headers: string[];
  data: any[][];
  preview: any[];
}

interface FileUpload {
  file: File | null;
  url: string | null;
  preview: string | null;
}

const UploadStep = ({ projectId, onNext }: UploadStepProps) => {
  const [csvData, setCsvData] = useState<CSVData | null>(null);
  const [columnMapping, setColumnMapping] = useState({
    firstName: "",
    lastName: "",
    company: "",
    websiteUrl: ""
  });
  const [video1, setVideo1] = useState<FileUpload>({ file: null, url: null, preview: null });
  const [video2, setVideo2] = useState<FileUpload>({ file: null, url: null, preview: null });
  const [isLoading, setIsLoading] = useState(false);

  const csvInputRef = useRef<HTMLInputElement>(null);
  const video1InputRef = useRef<HTMLInputElement>(null);
  const video2InputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      complete: (results) => {
        const headers = results.data[0] as string[];
        const data = results.data.slice(1) as any[][];
        const preview = data.slice(0, 5);

        setCsvData({ headers, data, preview });
        toast({
          title: "CSV chargé avec succès",
          description: `${data.length} lignes détectées`,
        });
      },
      header: false,
      skipEmptyLines: true,
      error: (error) => {
        toast({
          title: "Erreur de lecture CSV",
          description: error.message,
          variant: "destructive",
        });
      }
    });
  };

  const handleVideoUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    videoNumber: 1 | 2
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un fichier vidéo",
        variant: "destructive",
      });
      return;
    }

    const url = URL.createObjectURL(file);
    const videoState = { file, url, preview: url };

    if (videoNumber === 1) {
      setVideo1(videoState);
    } else {
      setVideo2(videoState);
    }

    toast({
      title: `Vidéo ${videoNumber} chargée`,
      description: file.name,
    });
  };

  const removeFile = (type: "csv" | "video1" | "video2") => {
    switch (type) {
      case "csv":
        setCsvData(null);
        setColumnMapping({ firstName: "", lastName: "", company: "", websiteUrl: "" });
        if (csvInputRef.current) csvInputRef.current.value = "";
        break;
      case "video1":
        if (video1.url) URL.revokeObjectURL(video1.url);
        setVideo1({ file: null, url: null, preview: null });
        if (video1InputRef.current) video1InputRef.current.value = "";
        break;
      case "video2":
        if (video2.url) URL.revokeObjectURL(video2.url);
        setVideo2({ file: null, url: null, preview: null });
        if (video2InputRef.current) video2InputRef.current.value = "";
        break;
    }
  };

  const canProceed = () => {
    return csvData && 
           video1.file && 
           columnMapping.firstName && 
           columnMapping.lastName && 
           columnMapping.company && 
           columnMapping.websiteUrl;
  };

  const handleNext = () => {
    if (canProceed()) {
      onNext();
    }
  };

  return (
    <div className="space-y-6">
      {/* CSV Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Fichier CSV des prospects
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="csv-upload">
              Sélectionnez votre fichier CSV
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <div className="flex items-center gap-4">
              <Input
                ref={csvInputRef}
                id="csv-upload"
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
                className="flex-1"
              />
              {csvData && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeFile("csv")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {csvData && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Aperçu du CSV ({csvData.data.length} lignes)</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        {csvData.headers.map((header, index) => (
                          <th key={index} className="text-left p-2 border-b">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {csvData.preview.map((row, index) => (
                        <tr key={index}>
                          {row.map((cell: any, cellIndex: number) => (
                            <td key={cellIndex} className="p-2 border-b">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Prénom <span className="text-red-500">*</span></Label>
                  <Select 
                    value={columnMapping.firstName} 
                    onValueChange={(value) => setColumnMapping(prev => ({ ...prev, firstName: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {csvData.headers.map((header, index) => (
                        <SelectItem key={index} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Nom <span className="text-red-500">*</span></Label>
                  <Select 
                    value={columnMapping.lastName} 
                    onValueChange={(value) => setColumnMapping(prev => ({ ...prev, lastName: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {csvData.headers.map((header, index) => (
                        <SelectItem key={index} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Entreprise <span className="text-red-500">*</span></Label>
                  <Select 
                    value={columnMapping.company} 
                    onValueChange={(value) => setColumnMapping(prev => ({ ...prev, company: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {csvData.headers.map((header, index) => (
                        <SelectItem key={index} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>URL du site <span className="text-red-500">*</span></Label>
                  <Select 
                    value={columnMapping.websiteUrl} 
                    onValueChange={(value) => setColumnMapping(prev => ({ ...prev, websiteUrl: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {csvData.headers.map((header, index) => (
                        <SelectItem key={index} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Video 1 Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Vidéo 1 - Introduction personnalisée
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="video1-upload">
              Votre vidéo d'introduction
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <div className="flex items-center gap-4">
              <Input
                ref={video1InputRef}
                id="video1-upload"
                type="file"
                accept="video/*"
                onChange={(e) => handleVideoUpload(e, 1)}
                className="flex-1"
              />
              {video1.file && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeFile("video1")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {video1.preview && (
            <div className="space-y-2">
              <Label>Aperçu</Label>
              <video 
                src={video1.preview} 
                controls 
                className="w-full max-w-md h-48 rounded-lg"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Video 2 Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Vidéo 2 - Contenu générique (optionnel)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="video2-upload">
              Vidéo de démonstration ou contenu générique
            </Label>
            <div className="flex items-center gap-4">
              <Input
                ref={video2InputRef}
                id="video2-upload"
                type="file"
                accept="video/*"
                onChange={(e) => handleVideoUpload(e, 2)}
                className="flex-1"
              />
              {video2.file && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeFile("video2")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {video2.preview && (
            <div className="space-y-2">
              <Label>Aperçu</Label>
              <video 
                src={video2.preview} 
                controls 
                className="w-full max-w-md h-48 rounded-lg"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Next Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleNext} 
          disabled={!canProceed()} 
          size="lg"
          className="gap-2"
        >
          <Play className="h-5 w-5" />
          Lancer la génération
        </Button>
      </div>
    </div>
  );
};

export default UploadStep;