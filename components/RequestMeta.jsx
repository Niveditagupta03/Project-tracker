import { getRequestMetadata } from '../lib/request-types';

export default function RequestMeta({ project, compact = false }) {
  const metadata = getRequestMetadata(project);
  const classification = metadata.requestClass
    ? `${metadata.requestClass} · ${metadata.requestLabel}`
    : metadata.requestLabel;

  return (
    <div className={`request-metadata${compact ? ' request-metadata-compact' : ''}`}>
      <span className={`request-class-tag request-class-${(metadata.requestClass || 'other').toLowerCase()}`}>
        {classification}
      </span>
      {metadata.requestNumber && <span className="request-number-tag">{metadata.requestNumber}</span>}
    </div>
  );
}
