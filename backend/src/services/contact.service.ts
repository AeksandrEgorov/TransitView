// This service sends contact form emails through Resend.
// It prepares a readable email, uses reply-to for the sender, and checks required email env values.

import type { ContactInput } from "../validators/contact.validator.js";

type ResendResponse = {
  id?: string;
  message?: string;
  name?: string;
};

const contactTypeLabels: Record<ContactInput["contactType"], string> = {
  account: "Kasutajakonto taotlus",
  question: "Küsimus",
  bug: "Veateade",
  suggestion: "Ettepanek",
};

function getRecipients() {
  return (process.env.CONTACT_TO_EMAIL ?? "")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildSubject(data: ContactInput) {
  return `TransitView: ${contactTypeLabels[data.contactType]} - ${data.topic}`;
}

function buildText(data: ContactInput) {
  return [
    `Päringu tüüp: ${contactTypeLabels[data.contactType]}`,
    `Teema: ${data.topic}`,
    `Nimi: ${data.fullName}`,
    `E-post: ${data.email}`,
    "",
    data.message,
  ].join("\n");
}

function buildHtml(data: ContactInput) {
  const safeMessage = escapeHtml(data.message).replace(/\n/g, "<br />");

  return `
    <h2>TransitView kontaktivorm</h2>
    <p><strong>Päringu tüüp:</strong> ${escapeHtml(
      contactTypeLabels[data.contactType]
    )}</p>
    <p><strong>Teema:</strong> ${escapeHtml(data.topic)}</p>
    <p><strong>Nimi:</strong> ${escapeHtml(data.fullName)}</p>
    <p><strong>E-post:</strong> ${escapeHtml(data.email)}</p>
    <hr />
    <p>${safeMessage}</p>
  `;
}

export async function sendContactMessage(data: ContactInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FROM_EMAIL;
  const recipients = getRecipients();

  if (!apiKey || !from || recipients.length === 0) {
    throw new Error("Contact email is not configured");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: recipients,
      subject: buildSubject(data),
      text: buildText(data),
      html: buildHtml(data),
      reply_to: data.email,
    }),
  });

  const result = (await response.json().catch(() => ({}))) as ResendResponse;

  if (!response.ok) {
    throw new Error(result.message || result.name || "Email sending failed");
  }

  return result.id ?? null;
}
