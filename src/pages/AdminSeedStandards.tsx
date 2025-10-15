import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle, AlertCircle, FileText, Database } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AdminSeedStandards() {
  const { toast } = useToast();
  const [isSeeding, setIsSeeding] = useState(false);
  const [results, setResults] = useState<any>(null);

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
      
      toast({
        title: "Seeding Complete",
        description: `Successfully seeded ${data.results.success.length} standards sets`,
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

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                California PDFs (Recommended)
              </CardTitle>
              <CardDescription>
                Parse existing CA PDF files with full AI validation. Most reliable method.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => startSeeding('local-pdfs')}
                disabled={isSeeding}
                className="w-full"
                variant="default"
              >
                {isSeeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Parse CA PDFs
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Web Scraping Test
              </CardTitle>
              <CardDescription>
                Test web scraping for CA Grade 3 Math (may have PDF issues)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => startSeeding('test')}
                disabled={isSeeding}
                className="w-full"
                variant="outline"
              >
                {isSeeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Test Web Scrape
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>California Only (Web)</CardTitle>
              <CardDescription>
                All grades & subjects via web scraping
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => startSeeding('california')}
                disabled={isSeeding}
                className="w-full"
                variant="secondary"
              >
                {isSeeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Scrape California
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>All 50 States</CardTitle>
              <CardDescription>
                Complete database population
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => startSeeding('all')}
                disabled={isSeeding}
                className="w-full"
                variant="default"
              >
                {isSeeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Seed All States
              </Button>
            </CardContent>
          </Card>
        </div>

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

              {results.results.success.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Successfully Seeded:</h3>
                  <ScrollArea className="h-48 border rounded p-2">
                    {results.results.success.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between py-1">
                        <span className="text-sm">
                          {item.state} - Grade {item.grade} - {item.subject}
                        </span>
                        <Badge variant="secondary">{item.count} standards</Badge>
                      </div>
                    ))}
                  </ScrollArea>
                </div>
              )}

              {results.results.failed.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2 text-red-600">Failed:</h3>
                  <ScrollArea className="h-48 border rounded p-2">
                    {results.results.failed.map((item: any, idx: number) => (
                      <div key={idx} className="py-1">
                        <span className="text-sm">
                          {item.state} - Grade {item.grade} - {item.subject}
                        </span>
                        <p className="text-xs text-muted-foreground">{item.error || item.reason}</p>
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
