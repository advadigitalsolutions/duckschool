import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, BookOpen, Edit, Save, Trash2, Plus, Search, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Framework {
  id: string;
  name: string;
  description: string;
  region: string;
  grade_levels: string[];
  subjects: string[];
  standards: any[];
  legal_requirements: any;
  created_at: string;
  is_approved: boolean;
}

export default function StandardsFrameworks() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [selectedFramework, setSelectedFramework] = useState<Framework | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingStandard, setEditingStandard] = useState<any>(null);

  useEffect(() => {
    loadFrameworks();
  }, []);

  const loadFrameworks = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('custom_frameworks')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFrameworks((data || []).map(f => ({
        ...f,
        standards: Array.isArray(f.standards) ? f.standards : []
      })));
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteFramework = async (id: string) => {
    if (!confirm('Are you sure you want to delete this framework?')) return;

    try {
      const { error } = await supabase
        .from('custom_frameworks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Framework Deleted",
        description: "The framework has been removed."
      });

      setFrameworks(frameworks.filter(f => f.id !== id));
      if (selectedFramework?.id === id) {
        setSelectedFramework(null);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const updateFramework = async (id: string, updates: Partial<Framework>) => {
    try {
      const { error } = await supabase
        .from('custom_frameworks')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Framework Updated",
        description: "Changes have been saved."
      });

      loadFrameworks();
      if (selectedFramework?.id === id) {
        setSelectedFramework({ ...selectedFramework, ...updates });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const filteredStandards = selectedFramework?.standards.filter(s =>
    searchQuery === "" ||
    s.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.subject?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-4xl font-bold flex items-center gap-2">
                <BookOpen className="h-8 w-8" />
                Standards & Frameworks
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage your custom educational frameworks and standards
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Frameworks List */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Your Frameworks ({frameworks.length})</CardTitle>
              <CardDescription>Select a framework to view details</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] pr-4">
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : frameworks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No frameworks yet. Create one from a student's profile.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {frameworks.map((framework) => (
                      <Card
                        key={framework.id}
                        className={`cursor-pointer transition-colors hover:bg-accent ${
                          selectedFramework?.id === framework.id ? 'bg-accent' : ''
                        }`}
                        onClick={() => setSelectedFramework(framework)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold mb-1">{framework.name}</h3>
                              <div className="flex flex-wrap gap-1 mb-2">
                                <Badge variant="outline">{framework.region}</Badge>
                                {framework.grade_levels.map(g => (
                                  <Badge key={g} variant="secondary">{g}</Badge>
                                ))}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {framework.standards.length} standards
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteFramework(framework.id);
                              }}
                              className="h-8 w-8 text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Framework Details */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>
                {selectedFramework ? selectedFramework.name : 'Select a Framework'}
              </CardTitle>
              {selectedFramework && (
                <CardDescription>{selectedFramework.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {!selectedFramework ? (
                <div className="text-center py-12 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a framework from the list to view and edit standards</p>
                </div>
              ) : (
                <Tabs defaultValue="standards" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="standards">
                      Standards ({selectedFramework.standards.length})
                    </TabsTrigger>
                    <TabsTrigger value="legal">Legal Requirements</TabsTrigger>
                    <TabsTrigger value="details">Details</TabsTrigger>
                  </TabsList>

                  <TabsContent value="standards" className="space-y-4">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search standards by code, subject, or text..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="icon">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add Standard</DialogTitle>
                            <DialogDescription>
                              Manually add a new standard to this framework
                            </DialogDescription>
                          </DialogHeader>
                          {/* Add form fields here */}
                        </DialogContent>
                      </Dialog>
                    </div>

                    <ScrollArea className="h-[500px]">
                      <div className="space-y-2">
                        {filteredStandards.map((standard, idx) => (
                          <Card key={idx} className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge>{standard.code}</Badge>
                                  <Badge variant="outline">{standard.subject}</Badge>
                                  {standard.domain && (
                                    <span className="text-xs text-muted-foreground">
                                      {standard.domain}
                                    </span>
                                  )}
                                  <Badge variant="secondary">{standard.gradeLevel}</Badge>
                                </div>
                                <p className="text-sm">{standard.text}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setEditingStandard(standard)}
                                className="h-8 w-8"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="legal" className="space-y-4">
                    <ScrollArea className="h-[500px]">
                      {selectedFramework.legal_requirements ? (
                        <div className="space-y-6">
                          {Object.entries(selectedFramework.legal_requirements).map(([category, items]: [string, any]) => (
                            <Card key={category} className="p-4">
                              <h3 className="font-semibold mb-3 capitalize">
                                {category.replace(/_/g, ' ')}
                              </h3>
                              {Array.isArray(items) ? (
                                <ul className="space-y-2">
                                  {items.map((item: any, idx: number) => (
                                    <li key={idx} className="text-sm flex items-start gap-2">
                                      <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                      {typeof item === 'string' ? item : item.requirement || JSON.stringify(item)}
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-sm">{JSON.stringify(items, null, 2)}</p>
                              )}
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12 text-muted-foreground">
                          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No legal requirements documented</p>
                        </div>
                      )}
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="details" className="space-y-4">
                    <div className="space-y-4">
                      <div>
                        <Label>Framework Name</Label>
                        <Input
                          value={selectedFramework.name}
                          onChange={(e) =>
                            updateFramework(selectedFramework.id, { name: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={selectedFramework.description || ''}
                          onChange={(e) =>
                            updateFramework(selectedFramework.id, { description: e.target.value })
                          }
                          rows={4}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Region</Label>
                          <Input value={selectedFramework.region} disabled />
                        </div>
                        <div>
                          <Label>Grade Levels</Label>
                          <div className="flex gap-1 flex-wrap mt-2">
                            {selectedFramework.grade_levels.map(g => (
                              <Badge key={g}>{g}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div>
                        <Label>Subjects</Label>
                        <div className="flex gap-1 flex-wrap mt-2">
                          {selectedFramework.subjects.map(s => (
                            <Badge key={s} variant="outline">{s}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
