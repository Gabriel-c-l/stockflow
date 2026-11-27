import { translate, useI18n } from '../../lib/i18n';
import type { ReactNode } from 'react';

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: ReactNode }) {
  const { language } = useI18n();
  return (
    <div className="page-header">
      <div className="page-heading">
        {eyebrow && <div className="page-eyebrow">{translate(eyebrow, language)}</div>}
        <h1>{translate(title, language)}</h1>
        {description && <p>{translate(description, language)}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}
