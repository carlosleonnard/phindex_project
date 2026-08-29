import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') ?? 'Phenotype Index <notifications@phenotypeindex.com>';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationEmailPayload {
  notification_id: string;
  user_id: string;
  type: string;
  message: string;
  profile_id?: string;
}

function getEmailSubject(type: string): string {
  switch (type) {
    case 'like':    return 'Someone liked your comment';
    case 'reply':   return 'Someone replied to your comment';
    case 'vote':    return 'Someone voted on your profile';
    case 'comment': return 'New comment on your profile';
    default:        return 'New notification on Phenotype Index';
  }
}

function getEmailIcon(type: string): string {
  switch (type) {
    case 'like':  return '❤️';
    case 'reply': return '💬';
    case 'vote':  return '🗳️';
    default:      return '🔔';
  }
}

function getEmailHtml(type: string, message: string, profileId?: string): string {
  const baseUrl = 'https://www.phenotypeindex.com';
  const profileUrl = profileId ? `${baseUrl}/profile/${profileId}` : baseUrl;
  const actionText = type === 'vote' ? 'View Profile' : 'View on Phenotype Index';
  const icon = getEmailIcon(type);
  const subject = getEmailSubject(type);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:#09090b;padding:20px 24px;text-align:center;">
              <span style="color:#ffffff;font-size:16px;font-weight:600;letter-spacing:0.5px;">Phenotype Index</span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 32px 28px;text-align:center;">
              <div style="font-size:40px;margin-bottom:16px;">${icon}</div>
              <h1 style="margin:0 0 10px;font-size:20px;font-weight:600;color:#09090b;">${subject}</h1>
              <p style="margin:0 0 28px;font-size:15px;color:#71717a;line-height:1.5;">${message}</p>
              <a href="${profileUrl}"
                 style="display:inline-block;background:#09090b;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:500;">
                ${actionText}
              </a>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px;border-top:1px solid #f4f4f5;text-align:center;">
              <p style="margin:0;font-size:12px;color:#a1a1aa;">
                You received this because you have email notifications enabled.
                <a href="${baseUrl}/settings" style="color:#71717a;text-decoration:underline;">Manage preferences</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY not set');
      return new Response(JSON.stringify({ error: 'Email service not configured' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload: NotificationEmailPayload = await req.json();
    const { notification_id, user_id, type, message, profile_id } = payload;

    if (!notification_id || !user_id || !type || !message) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify notification exists and belongs to user
    const { data: notification, error: notifError } = await supabase
      .from('notifications')
      .select('id, user_id')
      .eq('id', notification_id)
      .single();

    if (notifError || !notification || notification.user_id !== user_id) {
      return new Response(JSON.stringify({ error: 'Invalid notification' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check user's email notification preference
    const { data: profile } = await supabase
      .from('profiles')
      .select('email_notifications')
      .eq('id', user_id)
      .single();

    if (profile?.email_notifications === false) {
      return new Response(JSON.stringify({ skipped: 'Email notifications disabled by user' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user email from auth
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(user_id);

    if (userError || !userData?.user?.email) {
      console.error('Failed to get user email:', userError);
      return new Response(JSON.stringify({ error: 'User email not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userEmail = userData.user.email;
    const subject = getEmailSubject(type);
    const html = getEmailHtml(type, message, profile_id);

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [userEmail],
        subject,
        html,
      }),
    });

    if (!emailRes.ok) {
      const errBody = await emailRes.json();
      console.error('Resend error:', errBody);
      return new Response(JSON.stringify({ error: 'Failed to send email', details: errBody }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { id: emailId } = await emailRes.json();
    return new Response(JSON.stringify({ success: true, emailId }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('send-email-notification error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
