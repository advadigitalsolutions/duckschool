import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, TrendingUp, Clock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { FeatureRequestCard } from '@/components/feedback/FeatureRequestCard';
import { FeatureRequestDialog } from '@/components/feedback/FeatureRequestDialog';

export default function FeatureRequests() {
  const [searchParams] = useSearchParams();
  const categoryFromUrl = searchParams.get('category') || 'feature';
  
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [category, setCategory] = useState(categoryFromUrl);

  useEffect(() => {
    fetchRequests();
  }, [category]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('feature_requests')
        .select(`
          *,
          feature_request_votes(vote_type)
        `)
        .eq('category', category)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter(req =>
    req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">
            {category === 'bug' ? 'Bug Reports' : 'Feature Requests'}
          </h1>
          <p className="text-muted-foreground mt-2">
            Share your ideas and help us prioritize what to build next
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {category === 'bug' ? 'Report Bug' : 'Request Feature'}
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search requests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Tabs value={category} onValueChange={setCategory}>
        <TabsList>
          <TabsTrigger value="feature">
            <TrendingUp className="mr-2 h-4 w-4" />
            Features
          </TabsTrigger>
          <TabsTrigger value="bug">
            <Clock className="mr-2 h-4 w-4" />
            Bugs
          </TabsTrigger>
          <TabsTrigger value="improvement">
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Improvements
          </TabsTrigger>
        </TabsList>

        <TabsContent value={category} className="space-y-4 mt-6">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              Loading...
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchQuery ? 'No matching requests found.' : 'No requests yet. Be the first to submit one!'}
              </p>
            </div>
          ) : (
            filteredRequests.map((request) => (
              <FeatureRequestCard 
                key={request.id} 
                request={request}
                onUpdate={fetchRequests}
              />
            ))
          )}
        </TabsContent>
      </Tabs>

      <FeatureRequestDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={category as 'feature' | 'bug' | 'improvement'}
        onSuccess={fetchRequests}
      />
    </div>
  );
}