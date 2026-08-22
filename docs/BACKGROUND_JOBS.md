# Background Job & Asynchronous Processing Architecture

## 1. Architecture Overview

For decoupled, non-blocking execution of intensive tasks (such as sending email notifications, processing due-date reminders, generating sprint digest reports, and dispatching outgoing webhooks), **PulseFlow** leverages a Redis-backed job queue powered by **BullMQ**.

```
┌─────────────────────────┐       ┌─────────────────────────┐       ┌─────────────────────────┐
│     Express REST API    │ ───►  │     Redis Job Queue     │ ───►  │     Background Worker   │
│ (Produces Job Payloads) │       │ (BullMQ Priority Queue) │       │ (Processes Tasks Async) │
└─────────────────────────┘       └─────────────────────────┘       └────────────┬────────────┘
                                                                                 │
                                                                   ┌─────────────┴─────────────┐
                                                                   ▼                           ▼
                                                            SMTP / Resend               Outgoing Webhook
                                                            Email Gateway               Integration Hub
```

---

## 2. Dedicated Work Queues

| Queue Name | Responsibilities | Concurrency | Retry Policy |
|---|---|:---:|---|
| `email-queue` | Project invitations, password resets, @mentions in comments | 5 | Exponential backoff (5 attempts) |
| `notifications-queue` | In-app push notifications, task assignments, status alerts | 10 | Fixed interval retry (3 attempts) |
| `scheduled-tasks-queue` | Daily overdue task checks, 24h sprint summary emails | 1 | No retry (idempotent daily cron) |
| `webhooks-queue` | Dispatching events to third-party services (Slack, Discord) | 10 | Exponential backoff (3 attempts) |

---

## 3. Producer & Consumer Implementation Pattern

### 3.1 Producer: Enqueuing Jobs on Event
```javascript
import { Queue } from 'bullmq';

const emailQueue = new Queue('email-queue', { connection: redisConfig });

export const enqueueMemberInvitation = async ({ recipientEmail, projectName, inviterName, inviteLink }) => {
  await emailQueue.add(
    'send-invitation',
    {
      to: recipientEmail,
      subject: `You've been invited to join ${projectName} on PulseFlow`,
      template: 'project-invite',
      variables: { projectName, inviterName, inviteLink },
    },
    {
      attempts: 5,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: true,
      removeOnFail: 100,
    }
  );
};
```

### 3.2 Consumer: Resilient Worker Execution
```javascript
import { Worker } from 'bullmq';
import { sendEmailViaProvider } from '../services/mailService.js';

export const emailWorker = new Worker(
  'email-queue',
  async (job) => {
    const { to, subject, template, variables } = job.data;
    await sendEmailViaProvider({ to, subject, template, variables });
  },
  {
    connection: redisConfig,
    concurrency: 5,
    limiter: {
      max: 100,
      duration: 60000, // Rate limit: max 100 emails per minute
    },
  }
);

emailWorker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job.id} failed with error: ${err.message}`);
});
```

---

## 4. Scheduled Cron Jobs & Reminders

Using BullMQ Repeatable Jobs / Node-Cron:
1. **Daily Overdue Task Digest (08:00 AM UTC)**: Queries all tasks where `dueDate < Today` and `status != 'done'`, grouping tasks by assigned user and sending an actionable reminder email.
2. **Expired Session Cleanup (Hourly)**: Sweeps revoked refresh tokens older than 14 days to keep database storage lean and clean.
