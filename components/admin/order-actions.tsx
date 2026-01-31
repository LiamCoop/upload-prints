'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export function OrderActions({ orderId }: { orderId: string }) {
  const [actionsOpen, setActionsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyOrderId = async () => {
    try {
      await navigator.clipboard.writeText(orderId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };


  return (
    <>
      <Dialog open={actionsOpen} onOpenChange={setActionsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">Actions</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Order Actions</DialogTitle>
            <DialogDescription>Select an action for this order.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Button variant="secondary" onClick={handleCopyOrderId}>
              {copied ? 'Copied Order ID' : 'Copy Order ID'}
            </Button>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setActionsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </>
  );
}
