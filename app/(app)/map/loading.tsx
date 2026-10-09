import { LoadingSkeleton } from '@/components/ui/loading-skeleton';

export default function MapLoading() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
      <LoadingSkeleton variant="rect" height="40px" width="260px" className="rounded-lg" />
      <LoadingSkeleton variant="rect" height="550px" className="rounded-2xl" />
    </div>
  );
}
