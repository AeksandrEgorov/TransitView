// This file sends contact form data to the backend.
// The backend validates the message and passes it to the email service.

import api from "./axios";

export interface ContactMessageRequest {
  contactType: "account" | "question" | "bug" | "suggestion";
  fullName: string;
  email: string;
  topic: string;
  message: string;
}

export async function sendContactMessage(data: ContactMessageRequest) {
  const response = await api.post("/contact", data);

  return response.data;
}
