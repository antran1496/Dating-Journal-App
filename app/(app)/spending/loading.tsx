import { LoadingSkeleton } from '@/components/ui/loading-skeleton';

export default function SpendingLoading() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
      <LoadingSkeleton variant="rect" height="40px" width="220px" className="rounded-lg" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <LoadingSkeleton variant="rect" height="110px" className="rounded-xl" />
        <LoadingSkeleton variant="rect" height="110px" className="rounded-xl" />
        <LoadingSkeleton variant="rect" height="110px" className="rounded-xl" />
      </div>
      <LoadingSkeleton variant="rect" height="260px" className="rounded-xl" />
    </div>
  );
}
