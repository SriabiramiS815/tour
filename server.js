
import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Resolve __dirname provided by module wrapper in CommonJS, but we are in ESM (package.json has "type": "module")
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Email Transporter Configuration
const createTransporter = () => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_SERVER || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS?.replace(/ /g, ''),
    },
    tls: {
      rejectUnauthorized: false // Helps with some local dev certificate issues
    }
  });
  return transporter;
};

// Verify connection on startup (optional but good for debugging)
try {
  const transporter = createTransporter();
  transporter.verify(function (error, success) {
    if (error) {
      console.log('Server is ready but SMTP connection failed:', error);
    } else {
      console.log('SMTP Server is ready to take our messages');
    }
  });
} catch (e) {
  console.log('Error creating transporter:', e);
}

// Supabase (Simulated or Real)
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL || 'https://placeholder.supabase.co', process.env.SUPABASE_ANON_KEY || 'placeholder');

app.post('/api/create-booking', async (req, res) => {
  const {
    destination,
    duration,
    package_type,
    travel_date,
    customer_name,
    customer_mobile,
    customer_email
  } = req.body;

  console.log("Received booking request:", req.body);

  // 1. Save to Supabase
  let dbStatus = "skipped";
  if (process.env.SUPABASE_URL && !process.env.SUPABASE_URL.includes("your-project")) {
    const { data, error } = await supabase
      .from('bookings')
      .insert([{
        destination,
        duration,
        package_type,
        travel_date,
        customer_name,
        customer_mobile,
        customer_email,
        status: 'confirmed',
        created_at: new Date()
      }]);

    if (error) {
      console.error("Supabase Error:", error);
      dbStatus = "failed";
    } else {
      dbStatus = "saved";
    }
  }

  // 2. Send Confirmation Email
  try {
    const transporter = createTransporter();

    const emailBody = `
Dear ${customer_name},

Thank you for choosing Sri Tours! We are delighted to confirm your upcoming trip.

TRIP DETAILS:
----------------------------------------
Destination: ${destination}
Duration: ${duration}
Package: ${package_type}
Start Date: ${travel_date}
----------------------------------------

Our travel expert will contact you shortly at ${customer_mobile} to finalize the itinerary details.

Warm Regards,
Sri Tours Team
        `;

    // Professional HTML Template
    const htmlTemplate = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Helvetica', 'Arial', sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; }
            .header { background: linear-gradient(135deg, #0f766e, #0e7490); color: white; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; font-weight: 300; letter-spacing: 1px; }
            .content { padding: 30px; background-color: #ffffff; }
            .booking-box { background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; border-radius: 6px; margin: 20px 0; }
            .booking-item { margin-bottom: 10px; }
            .label { font-weight: bold; color: #0f766e; width: 100px; display: inline-block; }
            .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Booking Confirmed!</h1>
              <p>Get ready for ${destination}</p>
            </div>
            <div class="content">
              <p>Dear <strong>${customer_name}</strong>,</p>
              <p>We are thrilled to confirm your booking with Sri Tours. Your adventure awaits!</p>
              
              <div class="booking-box">
                <div class="booking-item"><span class="label">Destination:</span> ${destination}</div>
                <div class="booking-item"><span class="label">Duration:</span> ${duration}</div>
                <div class="booking-item"><span class="label">Package:</span> ${package_type}</div>
                <div class="booking-item"><span class="label">Date:</span> ${travel_date}</div>
              </div>

              <p>Our travel expert will be in touch with you at <strong>${customer_mobile}</strong> shortly to handle the finer details.</p>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                 <p>Questions? Reply to this email or call us anytime.</p>
              </div>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Sri Tours. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
        `;

    const info = await transporter.sendMail({
      from: `"Sri Tours Assistant" <${process.env.EMAIL_USER}>`,
      to: customer_email,
      subject: `Booking Confirmed: Trip to ${destination} - Sri Tours`,
      text: emailBody,
      html: htmlTemplate,
    });

    console.log('Email sent: %s', info.messageId);
    res.json({
      success: true,
      message: 'Booking processed successfully',
      dbStatus,
      emailStatus: "sent"
    });

  } catch (error) {
    console.error('Error processing booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process booking',
      dbStatus,
      error: error.message
    });
  }
});

// Deprecated: Simple email send (keeping for backward compatibility if needed)
app.post('/api/send-email', async (req, res) => {
  const { to_email, subject, body } = req.body;

  if (!to_email || !subject || !body) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  try {
    const transporter = createTransporter();

    // Create a professional HTML template
    const htmlTemplate = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Helvetica', 'Arial', sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; }
            .header { background: linear-gradient(135deg, #0f766e, #0e7490); color: white; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; font-weight: 300; letter-spacing: 1px; }
            .content { padding: 30px; background-color: #ffffff; }
            .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
            .button { display: inline-block; padding: 12px 24px; background-color: #0f766e; color: white; text-decoration: none; border-radius: 4px; font-weight: bold; margin-top: 20px; }
            .highlight { color: #0f766e; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Sri Tours & Travels</h1>
              <p>Your Trip, Your Way</p>
            </div>
            <div class="content">
              ${body.replace(/\n\n/g, '<p>').replace(/\n/g, '<br>')}
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                 <p>Need help? Contact us at <a href="mailto:sriabirami168@gmail.com" style="color: #0f766e;">sriabirami168@gmail.com</a></p>
              </div>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Sri Tours. All rights reserved.</p>
              <p>India's Most Trusted Travel Partner</p>
            </div>
          </div>
        </body>
        </html>
        `;

    const info = await transporter.sendMail({
      from: `"Sri Tours Assistant" <${process.env.EMAIL_USER}>`, // sender address
      to: to_email, // list of receivers
      subject: subject, // Subject line
      text: body, // plain text body
      html: htmlTemplate, // html body
    });

    console.log('Message sent: %s', info.messageId);
    res.json({ success: true, message: 'Email sent successfully', messageId: info.messageId });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ success: false, message: 'Failed to send email', error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
