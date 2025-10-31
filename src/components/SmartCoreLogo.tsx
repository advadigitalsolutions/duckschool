import smartcoreLogo from '@/assets/smartcore-logo.png';

export function SmartCoreLogo({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <img 
      src={smartcoreLogo} 
      alt="SmartCore Education" 
      className={`${className} dark:brightness-125 dark:contrast-125`}
    />
  );
}
