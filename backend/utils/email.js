const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

async function envoyerCodeReinitialisation(email, prenom, code) {
  try {
    await resend.emails.send({
      from: 'ENAExams <onboarding@resend.dev>',
      to: email,
      subject: 'Code de réinitialisation de mot de passe — ENAExams',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:24px;">
          <h2 style="color:#6B1A2A;">ENAExams</h2>
          <p>Bonjour <strong>${prenom}</strong>,</p>
          <p>Voici votre code de réinitialisation de mot de passe :</p>
          <div style="background:#F2F2F0;border:2px solid #6B1A2A;border-radius:10px;padding:24px;text-align:center;margin:24px 0;">
            <span style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#6B1A2A;">${code}</span>
          </div>
          <p style="color:#7A5040;">Ce code expire dans <strong>15 minutes</strong>.</p>
          <p style="color:#7A5040;">Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
          <hr style="border:none;border-top:1px solid #E8E8E4;margin:24px 0;">
          <p style="font-size:12px;color:#aaa;">École Nationale d'Administration du Bénin</p>
        </div>
      `
    });
    return true;
  } catch (err) {
    console.error('Erreur envoi email:', err);
    return false;
  }
}

module.exports = { envoyerCodeReinitialisation };