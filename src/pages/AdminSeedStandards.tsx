import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle, AlertCircle, FileText, Database, ShieldAlert } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AdminSeedStandards() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSeeding, setIsSeeding] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadSubject, setUploadSubject] = useState<string>('Mathematics');
  const [isUploading, setIsUploading] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();
      
      if (!data) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access this area.",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      console.error('Error checking admin access:', error);
      navigate('/');
    }
  };

  if (isAdmin === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <ShieldAlert className="h-16 w-16 text-destructive" />
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">You don't have permission to access this area.</p>
        <Button onClick={() => navigate('/')}>Return Home</Button>
      </div>
    );
  }

  const handleFileUpload = async () => {
    if (!uploadedFile) return;

    setIsUploading(true);
    setResults(null);
    try {
      const fileContent = await uploadedFile.text();
      
      toast({
        title: "Import Started",
        description: `Importing ${uploadSubject} standards from ${uploadedFile.name}...`,
      });

      const { data, error } = await supabase.functions.invoke('import-standards-from-json', {
        body: {
          jsonContent: fileContent,
          subject: uploadSubject,
          framework: 'CA CCSS'
        }
      });

      if (error) throw error;

      setResults({
        summary: {
          successful: data.imported || 0,
          failed: data.failed || 0,
          skipped: data.skipped || 0
        },
        results: [{
          subject: data.subject,
          status: 'success',
          count: data.imported
        }]
      });

      toast({
        title: "Import Successful",
        description: `Imported ${data.imported} ${uploadSubject} standards`,
      });

      setUploadedFile(null);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const startSeeding = async (mode: 'test' | 'california' | 'all' | 'local-pdfs') => {
    setIsSeeding(true);
    setResults(null);

    try {
      let functionName = 'seed-all-states';
      let payload: any = {};
      
      if (mode === 'local-pdfs') {
        functionName = 'seed-local-pdfs';
        payload = { state: 'California' };
        toast({
          title: "Seeding Started",
          description: "Parsing California PDF files with AI validation...",
        });
      } else if (mode === 'test') {
        // Test with just California, Grade 3, Math
        payload = {
          states: ['California'],
          gradeLevels: ['3'],
          subjects: ['Mathematics'],
          batchSize: 1
        };
      } else if (mode === 'california') {
        // All California grades and subjects
        payload = {
          states: ['California'],
          batchSize: 1
        };
        toast({
          title: "Seeding Started",
          description: "Processing California. This may take a while...",
        });
      } else {
        // mode === 'all' sends empty payload to process all states
        toast({
          title: "Seeding Started",
          description: "Processing all 50 states. This may take a while...",
        });
      }

      const { data, error } = await supabase.functions.invoke(functionName, {
        body: payload
      });

      if (error) throw error;

      setResults(data);
      
      const successCount = data.summary?.successful || data.results?.success?.length || 0;
      toast({
        title: "Seeding Complete",
        description: `Successfully seeded ${successCount} standards sets`,
      });

    } catch (error) {
      console.error('Seeding error:', error);
      toast({
        title: "Seeding Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Admin: Seed Standards Library</h1>
          <p className="text-muted-foreground">
            Populate the standards library with official state standards for all 50 states.
            This is a one-time setup process that makes standards instantly available to all parents.
          </p>
        </div>

        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              📁 Direct JSON File Import
            </CardTitle>
            <CardDescription>
              Upload JSON files from ASN to import standards directly - no API calls, instant results
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Subject</label>
              <select
                value={uploadSubject}
                onChange={(e) => setUploadSubject(e.target.value)}
                className="w-full p-2 border rounded-md bg-background"
              >
                <option value="Mathematics">Mathematics</option>
                <option value="English Language Arts">English Language Arts</option>
                <option value="Science">Science</option>
                <option value="History-Social Science">History-Social Science</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Marketing & Sales">Marketing & Sales</option>
                <option value="Business">Business</option>
                <option value="Information Technology">Information Technology</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Upload JSON File</label>
              <input
                type="file"
                accept=".json"
                onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
                onClick={(e) => (e.currentTarget.value = '')}
                className="w-full p-2 border rounded-md bg-background"
              />
              {uploadedFile && (
                <p className="text-xs text-muted-foreground">
                  Selected: {uploadedFile.name} ({(uploadedFile.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>

            <Button
              onClick={handleFileUpload}
              disabled={!uploadedFile || isUploading}
              className="w-full"
              size="lg"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                'Import Standards from File'
              )}
            </Button>

            <p className="text-xs text-muted-foreground">
              Download JSON files from <a href="http://asn.desire2learn.com/resources/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">ASN (D2513639 for CA Math, D2513640 for CA ELA)</a>
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Achievement Standards Network (ASN)
            </CardTitle>
            <CardDescription>
              Import verified California standards from the trusted Achievement Standards Network by D2L
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={async () => {
                    setIsSeeding(true);
                    setResults(null);
                    try {
                      toast({
                        title: "Import Started",
                        description: "Fetching Common Core Math and ELA standards from ASN...",
                      });

                      const { data, error } = await supabase.functions.invoke('import-asn-standards', {
                        body: { subjects: null } // null = all subjects
                      });

                      if (error) throw error;

                      setResults({
                        summary: {
                          successful: data.imported || 0,
                          failed: data.failed || 0,
                          skipped: data.skipped || 0
                        },
                        results: data.details
                      });
                      
                      toast({
                        title: "Import Complete",
                        description: `Successfully imported ${data.imported} standards`,
                      });
                    } catch (error: any) {
                      console.error('Import error:', error);
                      toast({
                        title: "Import Failed",
                        description: error.message,
                        variant: "destructive",
                      });
                    } finally {
                      setIsSeeding(false);
                    }
                  }}
                  disabled={isSeeding}
                  variant="default"
                >
                  {isSeeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Import CCSS Math & ELA
                </Button>
                
                <Button
                  onClick={async () => {
                    setIsSeeding(true);
                    setResults(null);
                    try {
                      toast({
                        title: "Import Started",
                        description: "Fetching Common Core Math standards from ASN...",
                      });

                      const { data, error } = await supabase.functions.invoke('import-asn-standards', {
                        body: { subjects: ['Mathematics'] }
                      });

                      if (error) throw error;

                      setResults({
                        summary: {
                          successful: data.imported || 0,
                          failed: data.failed || 0,
                          skipped: data.skipped || 0
                        },
                        results: data.details
                      });
                      
                      toast({
                        title: "Import Complete",
                        description: `Successfully imported ${data.imported} Math standards`,
                      });
                    } catch (error: any) {
                      console.error('Import error:', error);
                      toast({
                        title: "Import Failed",
                        description: error.message,
                        variant: "destructive",
                      });
                    } finally {
                      setIsSeeding(false);
                    }
                  }}
                  disabled={isSeeding}
                  variant="outline"
                >
                  {isSeeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Math Only
                </Button>

                <Button
                  onClick={async () => {
                    setIsSeeding(true);
                    setResults(null);
                    try {
                      toast({
                        title: "Import Started",
                        description: "Fetching Common Core ELA standards from ASN...",
                      });

                      const { data, error } = await supabase.functions.invoke('import-asn-standards', {
                        body: { subjects: ['English Language Arts'] }
                      });

                      if (error) throw error;

                      setResults({
                        summary: {
                          successful: data.imported || 0,
                          failed: data.failed || 0,
                          skipped: data.skipped || 0
                        },
                        results: data.details
                      });
                      
                      toast({
                        title: "Import Complete",
                        description: `Successfully imported ${data.imported} ELA standards`,
                      });
                    } catch (error: any) {
                      console.error('Import error:', error);
                      toast({
                        title: "Import Failed",
                        description: error.message,
                        variant: "destructive",
                      });
                    } finally {
                      setIsSeeding(false);
                    }
                  }}
                  disabled={isSeeding}
                  variant="outline"
                >
                  {isSeeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  ELA Only
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                Imports Common Core State Standards (CCSS) for Mathematics and English Language Arts from Achievement Standards Network (ASN) - the trusted, D2L-maintained repository
              </p>
            </div>
          </CardContent>
        </Card>

        {isSeeding && (
          <Card>
            <CardHeader>
              <CardTitle>Processing...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <Loader2 className="h-8 w-8 animate-spin" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    Scraping state education websites and extracting standards...
                    <br />
                    This process uses AI to identify sources, scrape content, and extract standards.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {results && (
          <Card>
            <CardHeader>
              <CardTitle>Seeding Results</CardTitle>
              <CardDescription>
                {results.summary.successful} successful, {results.summary.failed} failed, {results.summary.skipped} skipped
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">{results.summary.successful}</p>
                    <p className="text-sm text-muted-foreground">Successful</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <XCircle className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="text-2xl font-bold">{results.summary.failed}</p>
                    <p className="text-sm text-muted-foreground">Failed</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="text-2xl font-bold">{results.summary.skipped}</p>
                    <p className="text-sm text-muted-foreground">Skipped</p>
                  </div>
                </div>
              </div>

              {/* Handle both response formats */}
              {(results.results?.success?.length > 0 || (results.results && Array.isArray(results.results))) && (
                <div>
                  <h3 className="font-semibold mb-2">Successfully Seeded:</h3>
                  <ScrollArea className="h-48 border rounded p-2">
                    {(results.results?.success || results.results?.filter((r: any) => r.status === 'success') || []).map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between py-1">
                        <span className="text-sm">
                          {item.state ? `${item.state} - Grade ${item.grade} - ${item.subject}` : `${item.subject} - Grade ${item.gradeLevel}`}
                        </span>
                        <Badge variant="secondary">{item.count || item.standardsCount || 0} standards</Badge>
                      </div>
                    ))}
                  </ScrollArea>
                </div>
              )}

              {(results.results?.failed?.length > 0 || (results.results && Array.isArray(results.results) && results.results.some((r: any) => r.status === 'failed'))) && (
                <div>
                  <h3 className="font-semibold mb-2 text-red-600">Failed:</h3>
                  <ScrollArea className="h-48 border rounded p-2">
                    {(results.results?.failed || results.results?.filter((r: any) => r.status === 'failed') || []).map((item: any, idx: number) => (
                      <div key={idx} className="py-1">
                        <span className="text-sm">
                          {item.state ? `${item.state} - Grade ${item.grade} - ${item.subject}` : `${item.subject} - Grade ${item.gradeLevel}`}
                        </span>
                        <p className="text-xs text-muted-foreground">{item.error || item.reason || item.message}</p>
                      </div>
                    ))}
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>How This Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              <strong>Phase 1:</strong> AI identifies official state education department URLs for standards documents
            </p>
            <p>
              <strong>Phase 2:</strong> System scrapes content from identified sources (PDFs and web pages)
            </p>
            <p>
              <strong>Phase 3:</strong> AI extracts legal/homeschool requirements from state sources
            </p>
            <p>
              <strong>Phase 4:</strong> AI parses and extracts individual standards with codes, descriptions, and metadata
            </p>
            <p className="pt-2">
              <strong>Result:</strong> Standards are stored in the <code>standards_library</code> table, making them instantly available to all parents via dropdown selection in the wizard.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
