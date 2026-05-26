import nodemailer from 'nodemailer';

const createTransporter = () =>
  nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_PORT === '465',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

const baseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, sans-serif; background: #0d0f14; color: #e8eaf0; margin: 0; padding: 40px 20px; }
    .container { max-width: 560px; margin: 0 auto; background: #161b24; border: 1px solid #ffffff12; border-radius: 12px; padding: 40px; }
    .logo { font-size: 22px; font-weight: 700; color: #4f8ef7; margin-bottom: 32px; }
    h2 { font-size: 20px; margin: 0 0 12px; }
    p { color: #9ca3af; line-height: 1.6; margin: 0 0 20px; }
    .btn { display: inline-block; background: #4f8ef7; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; }
    .footer { margin-top: 32px; padding-top: 24px; border-top: 1px solid #ffffff12; font-size: 12px; color: #6b7590; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">TeamFlow</div>
    ${content}
    <div class="footer">© 2024 TeamFlow. You received this because you have an account.</div>
  </div>
</body>
</html>
`;

export const sendVerificationEmail = async (email, name, token) => {
  const url = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
  const transporter = createTransporter();

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Verify your TeamFlow account',
    html: baseTemplate(`
      <h2>Welcome, ${name}!</h2>
      <p>Thanks for signing up. Please verify your email to get started.</p>
      <a href="${url}" class="btn">Verify Email</a>
      <p style="margin-top:20px;font-size:13px">This link expires in 24 hours. If you didn't sign up, you can ignore this email.</p>
    `),
  });
};

export const sendPasswordResetEmail = async (email, name, token) => {
  const url = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
  const transporter = createTransporter();

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Reset your TeamFlow password',
    html: baseTemplate(`
      <h2>Password Reset</h2>
      <p>Hi ${name}, we received a request to reset your password.</p>
      <a href="${url}" class="btn">Reset Password</a>
      <p style="margin-top:20px;font-size:13px">This link expires in 10 minutes. If you didn't request a reset, please ignore this email.</p>
    `),
  });
};

export const sendWorkspaceInviteEmail = async (email, inviterName, workspaceName, token) => {
  const url = `${process.env.CLIENT_URL}/invite?token=${token}`;
  const transporter = createTransporter();

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: `${inviterName} invited you to ${workspaceName} on TeamFlow`,
    html: baseTemplate(`
      <h2>You're invited!</h2>
      <p><strong>${inviterName}</strong> has invited you to join the <strong>${workspaceName}</strong> workspace on TeamFlow.</p>
      <a href="${url}" class="btn">Accept Invitation</a>
      <p style="margin-top:20px;font-size:13px">This invitation expires in 7 days.</p>
    `),
  });
};

export const sendTaskAssignedEmail = async (email, name, taskTitle, projectName, taskUrl) => {
  const transporter = createTransporter();

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: `You've been assigned: ${taskTitle}`,
    html: baseTemplate(`
      <h2>New Task Assignment</h2>
      <p>Hi ${name}, you've been assigned a new task in <strong>${projectName}</strong>.</p>
      <p style="background:#1e2535;padding:16px;border-radius:8px;border-left:3px solid #4f8ef7;color:#e8eaf0">${taskTitle}</p>
      <a href="${taskUrl}" class="btn">View Task</a>
    `),
  });
};