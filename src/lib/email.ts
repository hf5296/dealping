import { Resend } from "resend";

// Initialize Resend client (will use API key from environment)
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export interface PriceDropEmailData {
  userEmail: string;
  userName?: string;
  productName: string;
  productImage?: string;
  currentPrice: number;
  previousPrice: number;
  retailer: string;
  productUrl: string;
  percentOff: number;
}

export async function sendPriceDropEmail(data: PriceDropEmailData) {
  if (!resend) {
    console.log("📧 [DEV] Would send price drop email:", data);
    return { success: true, dev: true };
  }

  try {
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "DealPing <onboarding@resend.dev>",
      to: data.userEmail,
      subject: `🔔 Price Drop! ${data.productName} is now £${data.currentPrice.toFixed(2)}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 24px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">💰 Price Drop Alert!</h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 24px;">
              <p style="color: #374151; font-size: 16px;">Hi${data.userName ? ` ${data.userName}` : ""},</p>
              <p style="color: #374151; font-size: 16px;">Great news! A product you're watching just dropped in price.</p>
              
              <!-- Product card -->
              <div style="background-color: #f9fafb; border-radius: 12px; padding: 20px; margin: 20px 0;">
                <h2 style="color: #111827; margin: 0 0 12px 0; font-size: 18px;">${data.productName}</h2>
                <p style="color: #6b7280; margin: 0 0 16px 0; font-size: 14px;">at ${data.retailer}</p>
                
                <!-- Price comparison -->
                <div style="display: flex; align-items: center; gap: 12px;">
                  <span style="font-size: 28px; font-weight: bold; color: #10b981;">£${data.currentPrice.toFixed(2)}</span>
                  <span style="font-size: 18px; color: #ef4444; text-decoration: line-through;">£${data.previousPrice.toFixed(2)}</span>
                  <span style="background-color: #10b981; color: white; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: bold;">-${data.percentOff}%</span>
                </div>
              </div>
              
              <!-- CTA Button -->
              <a href="${data.productUrl}" style="display: block; background-color: #10b981; color: white; text-align: center; padding: 16px 24px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px; margin-top: 20px;">
                View Deal →
              </a>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f3f4f6; padding: 16px 24px; text-align: center;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                You received this email because you set up a price alert on DealPing.
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/alerts" style="color: #10b981;">Manage alerts</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error("Failed to send email:", error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error("Email send error:", error);
    return { success: false, error };
  }
}
