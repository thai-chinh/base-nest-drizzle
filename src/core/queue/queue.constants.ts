/**
 * Queue names - add more as needed
 */
export const QUEUES = {
  EMAIL: 'email',
  NOTIFICATION: 'notification',
  REPORT: 'report',
  FACE_TEMPLATES: 'face-templates',
} as const;

export const JOBS = {
  FACE_TEMPLATES: {
    CREATE: 'create',
  },
} as const;

export type QueueName = (typeof QUEUES)[keyof typeof QUEUES];
