import { motion } from "framer-motion";

type Props = {
  height?: number;
  className?: string;
};

export function SkeletonBlock({ height = 80, className = "" }: Props) {
  return (
    <motion.div
      animate={{ opacity: [0.5, 0.85, 0.5] }}
      transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      className={`rounded-xl bg-muted/80 ${className}`}
      style={{ height }}
    />
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        <SkeletonBlock height={36} className="!h-9 !w-9 rounded-lg" />
        <div>
          <SkeletonBlock height={14} className="!w-32" />
          <SkeletonBlock height={10} className="mt-1 !w-24" />
        </div>
      </div>
      <SkeletonBlock height={20} className="!w-12" />
    </div>
  );
}
