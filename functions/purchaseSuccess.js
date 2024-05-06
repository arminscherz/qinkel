
const environment = process.env.CONTEXT;

const environmentKeys = {
  production: {
    STRIPE_KEY: process.env.STRIPE_SECRET_KEY,
    WEBHOOK_KEY: process.env.STRIPE_WEBHOOK_SECRET,
  },
  other: {
    STRIPE_KEY: process.env.STRIPE_TEST_KEY,
    WEBHOOK_KEY: process.env.STRIPE_WEBHOOK_SECRET_TEST,
  },
};
const apiKeys =
  environment !== "production"
    ? environmentKeys.other
    : environmentKeys.production;
const stripe = require("stripe")(apiKeys.STRIPE_KEY);

exports.handler = async function (event, context) {
  console.log("purchaseSuccess START");

  const { body, headers } = event;

  try {
    // 1. Check that the request is really from Stripe
    const stripeEvent = stripe.webhooks.constructEvent(
      body,
      headers["stripe-signature"],
      apiKeys.WEBHOOK_KEY
    );

    // 2. Handle successful payments
    if (stripeEvent.type === "checkout.session.completed") {
      // Extract the checkout object itself from the event
      const eventObject = stripeEvent.data.object;
      //console.log("eventObject: ", eventObject);

      const items = await stripe.checkout.sessions.listLineItems(
        eventObject.id,
        { expand: ["data.price.product"] }
      );

      //console.log("items: ", items);

      //console.log("price: ", items.data[0]["price"]);

      const product = items.data[0]["price"]["product"];

      //console.log("product: ", product);

      const itemName = product.name;


      const emailSenderEmail = process.env.SENDER_EMAIL;
      const emailSenderName = process.env.SENDER_NAME;

      const emailRecipientEmail = process.env.RECIPIENT_EMAIL;
      const emailRecipientName = process.env.RECIPIENT_NAME;

      const emailReplyToEmail = process.env.RECIPIENT_EMAIL;
      const emailReplyToName = process.env.RECIPIENT_NAME;

      const ccReceivers = [];
      //ccReceivers.push({ Email: senderEmail, Name: senderName });

      const emailBetreff =`${process.env.OPERATION_MODE}Neue Qinkel Bestellung`;

      const emailText =`${process.env.OPERATION_MODE}Neue Webshop-Bestellung für:
Produkt: ${product.name}
Anzahl: ${items.data[0].quantity}

Kunde: ${eventObject.customer_details.name} 
Kunden-Email: ${eventObject.customer_details.email} 

Liefer-Adresse: 
${eventObject.customer_details.address.line1} 
${eventObject.customer_details.address.line2}
${eventObject.customer_details.address.postal_code} ${eventObject.customer_details.address.city} 
${eventObject.customer_details.address.state}, ${eventObject.customer_details.address.country}`;

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

      console.log("purchaseSuccess END");
    }

    // Response sent back to stripe - everything is ok!
    return {
      statusCode: 200,
      body: JSON.stringify({ received: true }),
    };
  } catch (err) {
    console.log(`Stripe webhook failed with ${err}`);

    return {
      statusCode: 400,
      body: `Webhook Error: ${err.message}`,
    };
  }
};
