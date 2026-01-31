'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { OrderStatus } from '@prisma/client';
import { useState, useEffect } from 'react';

const statusOptions: { value: OrderStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'RECEIVED', label: 'Received' },
  { value: 'REVIEWING', label: 'Reviewing' },
  { value: 'READY_FOR_PRINT', label: 'Ready for Print' },
  { value: 'SENT_TO_PRINTER', label: 'Sent to Printer' },
  { value: 'COMPLETED', label: 'Completed' },
];

export function OrderStatusFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentStatus = searchParams.get('status') || 'ALL';
  const currentSearch = searchParams.get('search') || '';
  const [search, setSearch] = useState(currentSearch);

  useEffect(() => {
    setSearch(currentSearch);
  }, [currentSearch]);

  const handleStatusChange = (status: string) => {
    const params = new URLSearchParams(searchParams);
    if (status === 'ALL') {
      params.delete('status');
    } else {
      params.set('status', status);
    }
    router.push(`?${params.toString()}`);
  };

  const handleSearch = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set('search', value);
    } else {
      params.delete('search');
    }
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Search orders, customers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch(search);
            }
          }}
          className="max-w-sm"
        />
        <Button onClick={() => handleSearch(search)}>Search</Button>
        {(currentSearch || currentStatus !== 'ALL') && (
          <Button
            variant="outline"
            onClick={() => {
              setSearch('');
              router.push('/admin/orders');
            }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        {statusOptions.map((option) => (
          <Badge
            key={option.value}
            variant={currentStatus === option.value ? 'default' : 'outline'}
            className="cursor-pointer hover:bg-primary/80"
            onClick={() => handleStatusChange(option.value)}
          >
            {option.label}
          </Badge>
        ))}
      </div>
    </div>
  );
}
