import React from 'react';

type Props = React.SVGProps<SVGSVGElement> & { size?: number };

export default function AskPipIcon({ size = 24, className, ...props }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path
        d="M16 2C8.26801 2 2 8.26801 2 16V36C2 43.732 8.26801 50 16 50H25.5L32 58L38.5 50H48C55.732 50 62 43.732 62 36V16C62 8.26801 55.732 2 48 2H16Z"
        fill="#FFD700"
      />
      <path
        d="M32 12C32 20.5 27 25.5 18 25.5C27 25.5 32 30.5 32 39C32 30.5 37 25.5 46 25.5C37 25.5 32 20.5 32 12Z"
        fill="white"
      />
    </svg>
  );
}
