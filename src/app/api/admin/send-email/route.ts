import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// SMTP config — can be overridden by env vars
const SMTP_HOST = process.env.SMTP_HOST || 'a-digital-net.correoseguro.dinaserver.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465', 10);
const SMTP_USER = process.env.SMTP_USER || 'info@a-digital.net';
const SMTP_PASS = process.env.SMTP_PASS || 'tSoTd1;951./';
const SMTP_FROM_NAME = process.env.SMTP_FROM_NAME || 'Show United';
const SMTP_FROM_EMAIL = process.env.SMTP_FROM_EMAIL || SMTP_USER;

interface Recipient {
  name?: string;
  email: string;
}

interface SendEmailRequest {
  to: Recipient[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body_html: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SendEmailRequest = await request.json();
    const { to, cc, bcc, subject, body_html } = body;

    if (!to || to.length === 0) {
      return NextResponse.json({ error: 'At least one recipient is required' }, { status: 400 });
    }
    if (!subject?.trim()) {
      return NextResponse.json({ error: 'Subject is required' }, { status: 400 });
    }
    if (!body_html?.trim()) {
      return NextResponse.json({ error: 'Email body is required' }, { status: 400 });
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465, // SSL for 465, STARTTLS for 587
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const recipient of to) {
      try {
        await transporter.sendMail({
          from: `"${SMTP_FROM_NAME}" <${SMTP_FROM_EMAIL}>`,
          to: recipient.name ? `"${recipient.name}" <${recipient.email}>` : recipient.email,
          cc: cc?.join(', ') || undefined,
          bcc: bcc?.join(', ') || undefined,
          subject,
          html: body_html,
        });
        sent++;
      } catch (err: any) {
        failed++;
        errors.push(`${recipient.email}: ${err.message}`);
      }
    }

    return NextResponse.json({ sent, failed, errors });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
