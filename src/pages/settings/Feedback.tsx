import { Link } from 'react-router-dom';
import { Lightbulb, Bug, Map, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function Feedback() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Feedback</h1>
        <p className="text-muted-foreground mt-2">
          Help us improve by sharing your ideas, reporting bugs, or checking out what's coming next.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="hover:bg-accent/50 transition-colors">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Lightbulb className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Feature Requests</CardTitle>
            </div>
            <CardDescription>
              Share your ideas and vote on features you'd like to see
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link to="/feature-requests">
                View Feature Requests
                <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:bg-accent/50 transition-colors">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <Bug className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle>Report a Bug</CardTitle>
            </div>
            <CardDescription>
              Let us know if something isn't working as expected
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link to="/feature-requests?category=bug">
                Report Bug
                <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:bg-accent/50 transition-colors md:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Map className="h-6 w-6 text-blue-500" />
              </div>
              <CardTitle>Product Roadmap</CardTitle>
            </div>
            <CardDescription>
              See what we're working on and what's planned for the future
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="secondary" className="w-full">
              <Link to="/roadmap">
                View Roadmap
                <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}