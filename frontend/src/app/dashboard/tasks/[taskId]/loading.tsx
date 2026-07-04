export default function TaskDetailLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="glass p-6 rounded-2xl border border-white/10">
        <div className="h-3 w-24 bg-white/5 rounded mb-4" />
        <div className="h-7 w-64 bg-white/5 rounded mb-2" />
        <div className="h-4 w-96 bg-white/5 rounded" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass p-6 rounded-2xl border border-white/10 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3 py-3 border-b border-white/5">
              <div className="w-7 h-7 bg-white/5 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-2.5 w-20 bg-white/5 rounded" />
                <div className="h-3.5 w-48 bg-white/5 rounded" />
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-4">
          <div className="glass p-5 rounded-2xl border border-white/10 h-36" />
          <div className="glass p-5 rounded-2xl border border-white/10 h-36" />
          <div className="glass p-4 rounded-2xl border border-white/5 h-16" />
        </div>
      </div>
    </div>
  );
}
