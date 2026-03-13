import './InlineLoader.css';

interface InlineLoaderProps {
  size?: number;
  className?: string;
}

export default function InlineLoader({ size = 16, className = '' }: InlineLoaderProps) {
  return (
    <span
      className={`inline-loader ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
