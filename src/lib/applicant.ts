/** Roles that may prepare, save and submit program applications. Parents and guardians apply on behalf of a student. */
export type ApplicantRole = 'STUDENT' | 'PARENT';

export function canApply(role: string | null | undefined): role is ApplicantRole {
  return role === 'STUDENT' || role === 'PARENT';
}

export function applicantRoleFromParam(value: string | null | undefined): ApplicantRole {
  return value === 'PARENT' ? 'PARENT' : 'STUDENT';
}
