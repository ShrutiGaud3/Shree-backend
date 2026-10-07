// SMTP email utility (nodemailer).
// Contract: NEVER throws — returns true on send, false when unconfigured
// or on failure (callers must not fail a request because email failed).

import nodemailer from "nodemailer";
import { STORE_NAME } from "../config/storeConfig.js";
import logger from "./logger.js";

let transporter = null;

const getTransporter = () => {
  if (!process.env.SMTP_HOST) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth:
        process.env.SMTP_USER && process.env.SMTP_PASS
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
    });
  }
  return transporter;
};

export const sendEmail = async ({ to, subject, text, html }) => {
  if (!to) return false;
  const tx = getTransporter();
  if (!tx) {
    logger.debug({ to, subject }, `[${STORE_NAME}] email skipped (SMTP unconfigured)`);
    return false;
  }
  try {
    await tx.sendMail({
      from: process.env.SMTP_FROM || `Shree <support@shree.in>`,
      to,
      subject: subject ? `[${STORE_NAME}] ${subject}` : STORE_NAME,
      text,
      html,
    });
    return true;
  } catch (error) {
    logger.error({ to, subject, err: error.message }, "sendEmail failed");
    return false;
  }
};

export default sendEmail;
