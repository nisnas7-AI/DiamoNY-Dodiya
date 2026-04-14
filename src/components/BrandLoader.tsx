import { motion } from "framer-motion";

interface BrandLoaderProps {
  isLoading?: boolean;
  onComplete?: () => void;
}

const SUPABASE_BASE_URL = import.meta.env.VITE_SUPABASE_URL
  || (import.meta.env.VITE_SUPABASE_PROJECT_ID
    ? `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co`
    : "");
const BRAND_SVG = `${SUPABASE_BASE_URL}/storage/v1/object/public/vip-assets//Diamony Site Logo.svg`;

export const BrandLoader = ({ isLoading = true }: BrandLoaderProps) => {
  if (!isLoading) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none"
      style={{ backgroundColor: 'rgba(248, 249, 250, 0.97)' }}
    >
      <motion.img
        src={BRAND_SVG}
        alt="DiamoNY"
        className="w-20 h-20 object-contain"
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />
    </div>
  );
};

export default BrandLoader;
