import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function DashboardSearchFields({ search, onSearch, levelSearch, onLevelSearch, level, onLevel }) {
  return <>
    <div className="relative flex-1 min-w-48">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input aria-label="Search students and payments" value={search} onChange={e => onSearch(e.target.value)} placeholder="Search name, reg no, or 100 level..." className="pl-9 rounded-xl text-sm h-10" />
    </div>
    <div className="relative flex-1 min-w-40">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input aria-label="Search by level" value={levelSearch} onChange={e => onLevelSearch(e.target.value)} placeholder="Filter level: 100, 100L, 100 level" className="pl-9 rounded-xl text-sm h-10" />
    </div>
    <Select value={level} onValueChange={onLevel}>
      <SelectTrigger aria-label="Select student level" className="w-28 rounded-xl text-sm"><SelectValue /></SelectTrigger>
      <SelectContent><SelectItem value="all">All Levels</SelectItem>{['100', '200', '300', '400'].map(l => <SelectItem key={l} value={l}>{l}L</SelectItem>)}</SelectContent>
    </Select>
  </>;
}