export default async ( request, context) => {

  console.log("registerGuarantee START");

  var formData;
  await request.formData().then((data) => {
      formData = data;
  });

  console.log("formData: ", formData);

  try {
    // 1. Check that the request is valid
    if ((!request.headers.get("referer").includes('localhost')) && (!request.headers.get("referer").includes('qinkel')))  {
        throw new Error('Security: Referer doesnt match');
    }

    // Falls das HoneyPot - Feld gefüllt ist
    if (formData.get("kundenNummer") !== "") {
        throw new Error('Security: Honeypot befüllt');
    }

    // 2. Handle successful registrations

    const emailSenderEmail = process.env.SENDER_EMAIL;
    const emailSenderName = process.env.SENDER_NAME;

    const emailRecipientEmail = process.env.RECIPIENT_EMAIL;
    const emailRecipientName = process.env.RECIPIENT_NAME;

    const ccReceivers = [];

    const emailReplyToEmail = process.env.RECIPIENT_EMAIL;
    const emailReplyToName = process.env.RECIPIENT_NAME;

    const emailBetreff =`${process.env.OPERATION_MODE}Neue Qinkel Bestellung`;
    console.log("emailBetreff: ", emailBetreff);

    const emailText =`${process.env.OPERATION_MODE}Neue Garantie-Registrierung mit folgenden Daten:
E-Mail: ${formData.get("EMAIL")}
Vorname: ${formData.get("FIRSTNAME")}
Nachname: ${formData.get("LASTNAME")}
Geburts-Monat: ${formData.get("BIRTHDAY[day]")}
Geburts-Tag: ${formData.get("BIRTHDAY[month]")}
EAN-Code: ${formData.get("EANCODE")}
Gehört von: ${formData.get("LEADCHANNEL")}`;
    console.log("emailText: ", emailText);

    // MailJet Basic Auth vorbereiten
    const api_key = process.env.MAILJET_API_KEY;
    const api_secret = process.env.MAILJET_SECRET_KEY;
    const auth = 'Basic ' + Buffer.from( api_key + ':' + api_secret).toString('base64');

    // Freigabe-Email per MailJet senden
    const response = await fetch(
    'https://api.mailjet.com/v3.1/send', 
    {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': auth
        },
        body: JSON.stringify({
            Messages: [
                {
                    From: {
                        Email: emailSenderEmail,
                        Name: emailSenderName
                    },
                    To: [
                        {
                            Email: emailRecipientEmail,
                            Name: emailRecipientName
                        }
                    ],
                    Cc: ccReceivers,
                    ReplyTo: {
                        Email: emailReplyToEmail,
                        Name: emailReplyToName
                    },
                    Subject: emailBetreff,
                    TextPart: emailText,
                }
            ]
        }),
      }
    );

    console.log('response: ', response);

    if (!response.ok) {
      throw new Error('Fehler beim Versenden durch Mailjet');
    }

    console.log('Email sent successfully!');

    console.log("registerGuarantee END");

    // Response with forward to thank-you page
    return new Response(
        "Submission successful.", 
        {  
            status: 302,  
            headers: 
                {
                    Location: "/garantie-registriert"
                }
        }
    );
  } catch (err) {
    console.log(`Notifcation about registering failed with ${err}`);

    return new Response(
        "Error during Submission.", 
        {  
            status: 500,  
            headers: 
                {
                    Location: "/garantie-registriert"
                }
        }
    );
  }
};
