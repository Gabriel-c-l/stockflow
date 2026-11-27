import { translate, useI18n } from '../../lib/i18n';
import type { ReactNode } from 'react';
export function SectionHeading({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  const { language } = useI18n();
  return <div className="section-heading"><div><h2>{translate(title, language)}</h2>{description && <p>{translate(description, language)}</p>}</div>{action}</div>;
}
