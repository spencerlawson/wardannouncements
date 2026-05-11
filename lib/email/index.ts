import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.EMAIL_FROM ?? "Ward Announcements <noreply@wardannouncements.com>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function sendApprovalRequestEmail({
  to,
  announcementTitle,
  announcementId,
  wardName,
  submittedBy,
}: {
  to: string[];
  announcementTitle: string;
  announcementId: string;
  wardName: string;
  submittedBy: string;
}) {
  const url = `${APP_URL}/dashboard/announcements/${announcementId}`;
  return resend.emails.send({
    from: FROM,
    to,
    subject: `New announcement needs approval: "${announcementTitle}"`,
    html: `
      <p>A new announcement has been submitted for <strong>${wardName}</strong> and is awaiting your approval.</p>
      <p><strong>Title:</strong> ${announcementTitle}</p>
      <p><strong>Submitted by:</strong> ${submittedBy}</p>
      <p><a href="${url}">Review Announcement →</a></p>
    `,
  });
}

export async function sendApprovedEmail({
  to,
  announcementTitle,
  wardName,
  approvedBy,
}: {
  to: string;
  announcementTitle: string;
  wardName: string;
  approvedBy: string;
}) {
  return resend.emails.send({
    from: FROM,
    to: [to],
    subject: `Your announcement has been approved: "${announcementTitle}"`,
    html: `
      <p>Great news! Your announcement "<strong>${announcementTitle}</strong>" for <strong>${wardName}</strong> has been approved by ${approvedBy}.</p>
      <p>It will appear on the ward page during the scheduled display period.</p>
    `,
  });
}

export async function sendRevisionRequestedEmail({
  to,
  announcementTitle,
  announcementId,
  wardName,
  notes,
  reviewedBy,
}: {
  to: string;
  announcementTitle: string;
  announcementId: string;
  wardName: string;
  notes: string;
  reviewedBy: string;
}) {
  const url = `${APP_URL}/dashboard/announcements/${announcementId}`;
  return resend.emails.send({
    from: FROM,
    to: [to],
    subject: `Revision requested for your announcement: "${announcementTitle}"`,
    html: `
      <p>Your announcement "<strong>${announcementTitle}</strong>" for <strong>${wardName}</strong> needs revisions before it can be approved.</p>
      <p><strong>Notes from ${reviewedBy}:</strong></p>
      <blockquote style="border-left:3px solid #ccc;padding-left:12px;color:#555">${notes}</blockquote>
      <p><a href="${url}">Edit Announcement →</a></p>
    `,
  });
}
