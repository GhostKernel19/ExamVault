/**
 * ExamVault - Frontend API Service
 * 
 * Communicates with the Express backend endpoints for paper encryption,
 * key release, and audit trail queries.
 */

const API_BASE = import.meta.env?.VITE_API_URL || '/api/paper';

export async function uploadPaperToBackend(fileOrFormData, paperId, metadata = {}) {
  let body;

  if (fileOrFormData instanceof FormData) {
    body = fileOrFormData;
  } else {
    body = new FormData();
    body.append('paper', fileOrFormData);
    if (paperId) body.append('paperId', paperId);
    if (metadata.title) body.append('title', metadata.title);
    if (metadata.releaseTime) body.append('releaseTime', metadata.releaseTime);
  }

  const response = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `Upload failed with status ${response.status}`);
  }

  return data;
}

export async function fetchReleaseKey(paperId, centerId) {
  const response = await fetch(`${API_BASE}/${paperId}/release-key?centerId=${encodeURIComponent(centerId)}`);
  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.error || 'Failed to obtain release key');
    error.statusCode = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export async function fetchBackendAuditLogs(paperFilter = '') {
  const url = paperFilter 
    ? `${API_BASE}/${paperFilter}/audit-log` 
    : `${API_BASE}/all/audit-log`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      // If 404 on paperFilter or empty, return empty array gracefully
      return [];
    }

    return data.auditTrail || [];
  } catch (err) {
    console.warn('Could not fetch backend audit logs:', err.message);
    return [];
  }
}

export async function fetchAuthorizedCenters() {
  try {
    const response = await fetch(`${API_BASE}/centers`);
    const data = await response.json();
    return data.centers || [];
  } catch (err) {
    console.warn('Could not fetch authorized centers:', err.message);
    return [];
  }
}

export async function simulateReleasePassed(paperId) {
  const response = await fetch(`${API_BASE}/${paperId}/simulate-release`, {
    method: 'POST'
  });
  return response.json();
}
