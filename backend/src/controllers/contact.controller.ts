// This controller handles the public contact form endpoint.
// It validates the form body and asks the email service to send the message.

import type { Request, Response } from "express";

import { sendContactMessage } from "../services/contact.service.js";
import { contactSchema } from "../validators/contact.validator.js";

export async function sendContactMessageHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const parsed = contactSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const messageId = await sendContactMessage(parsed.data);

    res.status(200).json({
      message: "Message sent successfully",
      messageId,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Contact email is not configured"
    ) {
      res.status(503).json({
        message: "Contact email is not configured",
      });
      return;
    }

    console.error("Send contact message error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
