import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

/**
 * Email Service for sending notifications
 * Supports SMTP, SendGrid, Resend, etc.
 */

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailConfig {
  from: string;
  replyTo?: string;
  transportType: "smtp" | "sendgrid" | "resend";
  
  // SMTP config
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  smtpSecure?: boolean;
  
  // API keys
  sendgridApiKey?: string;
  resendApiKey?: string;
}

class EmailService {
  private transporter: Transporter | null = null;
  private config: EmailConfig;

  constructor(config?: Partial<EmailConfig>) {
    this.config = {
      from: process.env.EMAIL_FROM || "noreply@lendpro-admin.com",
      replyTo: process.env.EMAIL_REPLY_TO,
      transportType: (process.env.EMAIL_TRANSPORT_TYPE as any) || "smtp",
      
      // SMTP
      smtpHost: process.env.SMTP_HOST || "smtp.gmail.com",
      smtpPort: parseInt(process.env.SMTP_PORT || "587"),
      smtpUser: process.env.SMTP_USER,
      smtpPass: process.env.SMTP_PASS,
      smtpSecure: process.env.SMTP_SECURE === "true",
      
      // API keys
      sendgridApiKey: process.env.SENDGRID_API_KEY,
      resendApiKey: process.env.RESEND_API_KEY,
      
      ...config,
    };

    this.initializeTransporter();
  }

  private initializeTransporter() {
    try {
      if (this.config.transportType === "smtp") {
        if (!this.config.smtpUser || !this.config.smtpPass) {
          console.warn("[Email] SMTP credentials not configured. Email sending will be disabled.");
          return;
        }

        this.transporter = nodemailer.createTransport({
          host: this.config.smtpHost,
          port: this.config.smtpPort,
          secure: this.config.smtpSecure,
          auth: {
            user: this.config.smtpUser,
            pass: this.config.smtpPass,
          },
        });

        console.log("[Email] SMTP transporter initialized");
      } else if (this.config.transportType === "sendgrid") {
        if (!this.config.sendgridApiKey) {
          console.warn("[Email] SendGrid API key not configured.");
          return;
        }

        // SendGrid uses SMTP
        this.transporter = nodemailer.createTransport({
          host: "smtp.sendgrid.net",
          port: 587,
          auth: {
            user: "apikey",
            pass: this.config.sendgridApiKey,
          },
        });

        console.log("[Email] SendGrid transporter initialized");
      } else if (this.config.transportType === "resend") {
        if (!this.config.resendApiKey) {
          console.warn("[Email] Resend API key not configured.");
          return;
        }

        // Resend uses SMTP
        this.transporter = nodemailer.createTransport({
          host: "smtp.resend.com",
          port: 587,
          auth: {
            user: "resend",
            pass: this.config.resendApiKey,
          },
        });

        console.log("[Email] Resend transporter initialized");
      }
    } catch (error) {
      console.error("[Email] Failed to initialize transporter:", error);
    }
  }

  async send(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
    if (!this.transporter) {
      console.warn("[Email] Transporter not initialized. Skipping email send.");
      return { success: false, error: "Email service not configured" };
    }

    try {
      const info = await this.transporter.sendMail({
        from: this.config.from,
        replyTo: this.config.replyTo,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      console.log("[Email] Sent successfully:", info.messageId);
      return { success: true };
    } catch (error) {
      console.error("[Email] Send failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async sendDeploymentSuccess(to: string, clientName: string, serviceUrl?: string) {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #10b981; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Deployment Successful</h1>
            </div>
            <div class="content">
              <h2>Client: ${clientName}</h2>
              <p>Your client deployment has completed successfully!</p>
              ${serviceUrl ? `<p><strong>Service URL:</strong> <a href="${serviceUrl}">${serviceUrl}</a></p>` : ""}
              <p>The application is now live and ready to use.</p>
              <a href="${serviceUrl || "https://railway.app"}" class="button">View Deployment</a>
            </div>
            <div class="footer">
              <p>LendPro Admin Portal - Automated Deployment Notification</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.send({
      to,
      subject: `✅ Deployment Successful: ${clientName}`,
      html,
      text: `Deployment successful for ${clientName}. Service URL: ${serviceUrl || "N/A"}`,
    });
  }

  async sendDeploymentFailure(to: string, clientName: string, error: string) {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #ef4444; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .error-box { background: #fee2e2; border-left: 4px solid #ef4444; padding: 16px; margin: 20px 0; }
            .button { display: inline-block; background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>❌ Deployment Failed</h1>
            </div>
            <div class="content">
              <h2>Client: ${clientName}</h2>
              <p>Unfortunately, the deployment failed. Please review the error details below:</p>
              <div class="error-box">
                <strong>Error:</strong><br>
                ${error}
              </div>
              <p>Please check your configuration and try again. If the problem persists, contact support.</p>
              <a href="https://railway.app" class="button">View Logs</a>
            </div>
            <div class="footer">
              <p>LendPro Admin Portal - Automated Deployment Notification</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.send({
      to,
      subject: `❌ Deployment Failed: ${clientName}`,
      html,
      text: `Deployment failed for ${clientName}. Error: ${error}`,
    });
  }

  async sendWeeklySummary(
    to: string,
    data: {
      totalClients: number;
      activeClients: number;
      totalRevenue: number;
      totalOrders: number;
      successfulDeployments: number;
      failedDeployments: number;
    }
  ) {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3b82f6; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 20px 0; }
            .stat-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
            .stat-value { font-size: 32px; font-weight: bold; color: #3b82f6; }
            .stat-label { font-size: 14px; color: #666; margin-top: 8px; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📊 Weekly Summary</h1>
              <p>Your LendPro Admin Portal Performance</p>
            </div>
            <div class="content">
              <div class="stats">
                <div class="stat-card">
                  <div class="stat-value">${data.totalClients}</div>
                  <div class="stat-label">Total Clients</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">${data.activeClients}</div>
                  <div class="stat-label">Active Clients</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">$${data.totalRevenue.toFixed(2)}</div>
                  <div class="stat-label">Total Revenue</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">${data.totalOrders}</div>
                  <div class="stat-label">Total Orders</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value" style="color: #10b981;">${data.successfulDeployments}</div>
                  <div class="stat-label">Successful Deployments</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value" style="color: #ef4444;">${data.failedDeployments}</div>
                  <div class="stat-label">Failed Deployments</div>
                </div>
              </div>
              <p style="margin-top: 30px;">Keep up the great work! 🚀</p>
            </div>
            <div class="footer">
              <p>LendPro Admin Portal - Weekly Performance Summary</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.send({
      to,
      subject: "📊 Weekly Summary - LendPro Admin Portal",
      html,
      text: `Weekly Summary: ${data.totalClients} total clients, $${data.totalRevenue} revenue, ${data.totalOrders} orders`,
    });
  }
}

// Singleton instance
let emailService: EmailService | null = null;

export function getEmailService(): EmailService {
  if (!emailService) {
    emailService = new EmailService();
  }
  return emailService;
}

export { EmailService };
