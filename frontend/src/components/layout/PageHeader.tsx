import type { ReactNode } from "react";

interface Props {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  breadcrumb?: Array<{ label: string; href?: string }>;
}

export default function PageHeader({
  title,
  subtitle,
  actions,
  breadcrumb,
}: Props) {
  return (
    <div className="mb-6">
      {breadcrumb && breadcrumb.length > 0 && (
        <nav className="flex items-center gap-1.5 text-xs text-surface-400 mb-2">
          {breadcrumb.map((item, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <span>›</span>}
              {item.href ? (
                <a
                  href={item.href}
                  className="hover:text-dental-600 transition"
                >
                  {item.label}
                </a>
              ) : (
                <span className="text-surface-600 font-medium">
                  {item.label}
                </span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display font-bold text-2xl text-mint-700">
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm text-mint-600 mt-0.5">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-3 flex-shrink-0">{actions}</div>
        )}
      </div>
    </div>
  );
}
