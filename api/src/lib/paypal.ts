/**
 * PayPal REST API client (fetch-based, Cloudflare Workers compatible)
 * Replaces @paypal/paypal-server-sdk which uses axios (incompatible with Workers)
 */

const SANDBOX_BASE = 'https://api-m.sandbox.paypal.com';
const LIVE_BASE = 'https://api-m.paypal.com';

interface PayPalTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

interface PayPalOrderRequest {
  intent: 'CAPTURE' | 'AUTHORIZE';
  purchase_units: Array<{
    amount: { currency_code: string; value: string };
    description?: string;
    custom_id?: string;
  }>;
  application_context?: {
    return_url?: string;
    cancel_url?: string;
    brand_name?: string;
    user_action?: string;
  };
}

interface PayPalOrder {
  id: string;
  status: string;
  links: Array<{ href: string; rel: string; method: string }>;
  purchase_units?: Array<{
    payments?: {
      captures?: Array<{ id: string; status: string; custom_id?: string }>;
    };
    custom_id?: string;
  }>;
}

interface PayPalRefundRequest {
  amount?: { currency_code: string; value: string };
}

interface PayPalRefund {
  id: string;
  status: string;
}

export class PayPalClient {
  private baseUrl: string;
  private clientId: string;
  private clientSecret: string;
  private cachedToken: { token: string; expiresAt: number } | null = null;

  constructor(env: Env) {
    this.baseUrl = env.PAYPAL_MODE === 'live' ? LIVE_BASE : SANDBOX_BASE;
    this.clientId = env.PAYPAL_CLIENT_ID;
    this.clientSecret = env.PAYPAL_CLIENT_SECRET;
  }

  /**
   * Get OAuth2 access token using client credentials grant
   */
  async getAccessToken(): Promise<string> {
    // Return cached token if still valid (with 60s buffer)
    if (this.cachedToken && Date.now() < this.cachedToken.expiresAt - 60000) {
      return this.cachedToken.token;
    }

    const credentials = btoa(`${this.clientId}:${this.clientSecret}`);
    const res = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`PayPal auth failed (${res.status}): ${text}`);
    }

    const data: PayPalTokenResponse = await res.json();
    this.cachedToken = {
      token: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    };
    return data.access_token;
  }

  /**
   * Create a PayPal order
   */
  async createOrder(order: PayPalOrderRequest): Promise<PayPalOrder> {
    const token = await this.getAccessToken();
    const res = await fetch(`${this.baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(order),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`PayPal createOrder failed (${res.status}): ${text}`);
    }

    return res.json();
  }

  /**
   * Capture an approved PayPal order
   */
  async captureOrder(orderId: string): Promise<PayPalOrder> {
    const token = await this.getAccessToken();
    const res = await fetch(`${this.baseUrl}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`PayPal captureOrder failed (${res.status}): ${text}`);
    }

    return res.json();
  }

  /**
   * Get order details
   */
  async getOrder(orderId: string): Promise<PayPalOrder> {
    const token = await this.getAccessToken();
    const res = await fetch(`${this.baseUrl}/v2/checkout/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`PayPal getOrder failed (${res.status}): ${text}`);
    }

    return res.json();
  }

  /**
   * Refund a captured payment
   */
  async refundCapture(captureId: string, refund: PayPalRefundRequest): Promise<PayPalRefund> {
    const token = await this.getAccessToken();
    const res = await fetch(`${this.baseUrl}/v2/payments/captures/${captureId}/refund`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(refund),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`PayPal refundCapture failed (${res.status}): ${text}`);
    }

    return res.json();
  }

  /**
   * Verify webhook signature (for webhook authentication)
   */
  async verifyWebhook(headers: Record<string, string>, body: string): Promise<boolean> {
    const token = await this.getAccessToken();
    const res = await fetch(`${this.baseUrl}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        auth_algo: headers['paypal-auth-algo'] || '',
        cert_url: headers['paypal-cert-url'] || '',
        transmission_id: headers['paypal-transmission-id'] || '',
        transmission_sig: headers['paypal-transmission-sig'] || '',
        transmission_time: headers['paypal-transmission-time'] || '',
        webhook_id: '', // Will be set by caller
        webhook_event: JSON.parse(body),
      }),
    });

    if (!res.ok) return false;
    const data = await res.json() as { verification_status: string };
    return data.verification_status === 'SUCCESS';
  }
}
