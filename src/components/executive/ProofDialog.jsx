import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExternalLink, Loader2 } from 'lucide-react';

/**
 * Shows the proof of payment a student uploaded (receipt screenshot or PDF)
 * inside the portal. Receipts are stored privately, so a short-lived link is
 * created each time one is opened. Older receipts saved as plain links still work.
 */
export default function ProofDialog({ url, onClose, title = 'Proof of Payment' }) {
  const isPrivate = Boolean(url) && !/^https?:\/\//i.test(url);
  const signed = useQuery({
    queryKey: ['proof-signed-url', url],
    enabled: isPrivate,
    staleTime: 4 * 60 * 1000,
    queryFn: async () => (await base44.integrations.Core.CreateFileSignedUrl({ file_uri: url, expires_in: 300 })).signed_url,
  });
  if (!url) return null;

  const viewUrl = isPrivate ? signed.data : url;
  const isPdf = /\.pdf(\?|$)/i.test(url);

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl">
        <DialogHeader className="px-5 pt-5">
          <DialogTitle className="text-base">{title}</DialogTitle>
        </DialogHeader>

        <div className="px-5">
          {!viewUrl ? (
            <div className="h-48 flex items-center justify-center text-sm text-gray-500">
              {signed.error ? 'Could not open the receipt. Please try again.' : <Loader2 className="w-5 h-5 animate-spin" />}
            </div>
          ) : isPdf ? (
            <iframe src={viewUrl} title="Proof of payment" className="w-full h-[60vh] rounded-xl border border-gray-200" />
          ) : (
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-2">
              <img src={viewUrl} alt="Proof of payment uploaded by student" className="w-full max-h-[60vh] object-contain mx-auto rounded-lg" />
            </div>
          )}
        </div>

        {viewUrl && (
          <div className="px-5 pb-5 pt-4">
            <Button asChild variant="outline" className="w-full rounded-xl">
              <a href={viewUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" /> Open full size
              </a>
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}