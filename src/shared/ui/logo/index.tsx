import { cn } from '../lib/utils';

interface LogoProps {
  /** 추가 CSS 클래스 */
  className?: string;
}

const Logo = ({ className = '' }: LogoProps) => {
  return (
    <span
      className={cn(
        'inline-flex justify-center items-center cursor-pointer select-none',
        className,
      )}
    >
      <img
        src="/icons/favicon-256x256.png"
        alt="Q-Asker"
        className="w-7 h-7 mr-2 mb-[5px] max-[480px]:w-[22px] max-[480px]:h-[22px] max-[480px]:mr-1.5 max-[480px]:mb-[3px]"
      />
      <span className="text-2xl text-indigo-500 font-bold whitespace-nowrap max-[480px]:text-lg">
        Q-Asker
      </span>
    </span>
  );
};

export default Logo;
