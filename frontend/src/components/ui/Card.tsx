import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
