import { X, ExternalLink, AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { useState, useEffect } from 'react';

interface ResourceIframeViewerProps {
  url: string;
  title: string;
  onClose: () => void;
}

export function ResourceIframeViewer({ url, title, onClose }: ResourceIframeViewerProps) {
  const [iframeError, setIframeError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if URL is likely to be blocked
  const isLikelyBlocked = url.includes('khanacademy.org') || 
                          url.includes('youtube.com/watch') ||
                          url.includes('facebook.com') ||
                          url.includes('twitter.com') ||
                          url.includes('instagram.com');

  useEffect(() => {
    // Reset states when URL changes
    setIframeError(false);
    setIsLoading(true);
    
    // Set a timeout to detect if iframe isn't loading
    const timer = setTimeout(() => {
      setIsLoading(false);
      if (isLikelyBlocked) {
        setIframeError(true);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [url, isLikelyBlocked]);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base truncate flex-1 mr-2">{title}</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              asChild
            >
              <a href={url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 relative">
        {iframeError || isLikelyBlocked ? (
          <div className="p-4 h-full flex flex-col items-center justify-center gap-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {isLikelyBlocked 
                  ? `${title.split('/')[0] || 'This website'} blocks embedding for security. Click below to open in a new tab.`
                  : 'This website cannot be displayed in an embedded viewer. Click the button below to open it in a new tab.'}
              </AlertDescription>
            </Alert>
            <Button asChild>
              <a href={url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in New Tab
              </a>
            </Button>
          </div>
        ) : (
          <>
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  <p className="text-sm text-muted-foreground">Loading resource...</p>
                </div>
              </div>
            )}
            <iframe
              src={url}
              className="w-full h-full border-0"
              title={title}
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setIframeError(true);
                setIsLoading(false);
              }}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
