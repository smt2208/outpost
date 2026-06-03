// generating the email for email verification
import Mailgen from "mailgen";
import { Resend } from "resend";

const senderEmail = async (options) => {
  const resend = new Resend(process.env.RESEND_API_KEY || "re_dummykey");
  const mailGenerator = new Mailgen({
    theme: "default",
    product: {
      name: "Project Management App",
      link: process.env.CORS_ORIGIN || "http://localhost:3000",
    },
  });

  const emailtextual = mailGenerator.generatePlaintext(options.mailgenContent);
  const emailhtml = mailGenerator.generate(options.mailgenContent);

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: options.email,
      subject: options.subject,
      text: emailtextual,
      html: emailhtml,
    });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

//generating email templates
const EmailVerificationMailGenerator = (username,verificationUrl) => {
  return{
    body:{
      name: username,
      intro: "Welcome to our project management app! We're excited to have you on board.",
      action: {
        instructions: "Click the button below to verify your email address:",
        button: {
          color: "#22BC66",
          text: "Verify Email",
          link: verificationUrl
        },
      },
      outro: "If you did not sign up for this account, please ignore this email."
    }
  }
}

//generating email templates
const forgotPasswordEmail = (username, resetUrl) => {
  return{
    body:{
      name: username,
      intro: "You have requested to reset your password.",
      action: {
        instructions: "Click the button below to reset your password:",
        button: {
          color: "#FF6F6F",
          text: "Reset Password",
          link: resetUrl
        }
      },
      outro: "If you did not request this, please ignore this email."
    }
  }
} 


export {EmailVerificationMailGenerator, forgotPasswordEmail,senderEmail};