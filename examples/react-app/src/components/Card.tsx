import { ReactNode } from 'react';

interface CardProps {
  icon?: string;
  title: string;
  tag?: string;
  children: ReactNode;
}

export default function Card({ icon, title, tag, children }: CardProps) {
  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b-4 border-primary">
        {icon && <span className="text-3xl">{icon}</span>}
        <h2 className="text-2xl font-bold text-gray-800 flex-1">{title}</h2>
        {tag && (
          <span className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-600 font-semibold uppercase tracking-wider">
            {tag}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

