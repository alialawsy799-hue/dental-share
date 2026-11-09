export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite" className="space-y-4">
      <p className="sr-only">جارٍ التحميل</p>
      <div className="h-28 animate-pulse rounded-card bg-white" />
      <div className="h-44 animate-pulse rounded-card bg-white" />
    </div>
  );
}
