import logo from '@/assets/sporthub-logo.jpeg';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'h-8',
  md: 'h-10',
  lg: 'h-14',
  xl: 'h-20',
};

export function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img 
        src={logo} 
        alt="SportHub" 
        className={`${sizeClasses[size]} w-auto object-contain rounded-lg`}
      />
    </div>
  );
}

// SVG Logo Icon for use without the full logo image
export function LogoIcon({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center rounded-full bg-secondary ${className}`}>
      <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        className="w-1/2 h-1/2 text-secondary-foreground"
      >
        <path d="M7 17L17 7" />
        <path d="M7 7L17 17" />
      </svg>
    </div>
  );
}
