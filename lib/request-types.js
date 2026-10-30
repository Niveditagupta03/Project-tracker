const REQUEST_TYPE_LABELS = {
  CR: 'Change Request',
  SR: 'Service Request',
  BAU: 'Business as Usual',
};

export function getRequestClass(type) {
  const normalized = String(type || '').trim().toLowerCase();

  if (/^cr(?:\b|[/:_-])/.test(normalized) || normalized.includes('change request')) {
    return 'CR';
  }
  if (/^sr(?:\b|[/:_-])/.test(normalized) || normalized.includes('service request') || normalized === 'support') {
    return 'SR';
  }
  if (normalized === 'bau' || normalized === 'business as usual') {
    return 'BAU';
  }
  return normalized ? 'OTHER' : '';
}

export function normalizeRequestType(type) {
  const requestClass = getRequestClass(type);
  return requestClass && requestClass !== 'OTHER' ? requestClass : String(type || '');
}

export function getRequestMetadata(project) {
  const requestClass = getRequestClass(project?.type);
  const requestLabel = REQUEST_TYPE_LABELS[requestClass] || String(project?.type || 'Other');
  const requestNumber = requestClass === 'CR' && project?.id != null
    ? `CR-${String(project.id).padStart(4, '0')}`
    : null;

  return { requestClass, requestLabel, requestNumber };
}

export function withRequestMetadata(project) {
  return { ...project, ...getRequestMetadata(project) };
}
