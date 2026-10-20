import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

/**
 * Shows the proof of payment a student uploaded (receipt screenshot or PDF)
 * inside the portal, instead of only linking out to the raw file.
 */
export default function ProofDialog({ url, onClose, title = 'Proof of Payment' }) {
  if (!url) return null;

  const isPdf = /\.pdf(\?|$)/i.test(url);

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl">
        <DialogHeader className="px-5 pt-5">
          <DialogTitle className="text-base">{title}</DialogTitle>
        </DialogHeader>

        <div className="px-5">
          {isPdf ? (
            <iframe
              src={url}
              title="Proof of payment"
              className="w-full h-[60vh] rounded-xl border border-gray-200"
            />
          ) : (
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-2">
              <img
                src={url}
                alt="Proof of payment uploaded by student"
                className="w-full max-h-[60vh] object-contain mx-auto rounded-lg"
              />
            </div>
          )}
        </div>

        <div className="px-5 pb-5 pt-4">
          <Button asChild variant="outline" className="w-full rounded-xl">
            <a href={url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" /> Open full size
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}