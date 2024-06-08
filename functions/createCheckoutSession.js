exports.handler = async function (event, context) {

  // Doku unter: https://stripe.com/docs/payments/accept-a-payment?integration=checkout
  const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);


  const referer = event.headers.referer;
  const origin = event.headers.origin;
  // JSON.parse doesn't work here
  const params = new URLSearchParams(event.body);
  const price_id = params.get("price_id");
  const shipping_rate_id = params.get("shipping_rate_id");
  const quantity = params.get("quantity");

  // console.log("context:", context);

  // console.log("event:", event);

  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        price: price_id,
        quantity: quantity,
      },
    ],
    mode: "payment",
    // TODO: customize thanks page with order details https://stripe.com/docs/payments/checkout/custom-success-page
    success_url: origin+"/thanks.html",
    // go back to page that they were on
    cancel_url: referer,
    invoice_creation:
      {
        enabled: true,
      },
    shipping_address_collection:
      {
        allowed_countries: ["AT", "DE", "CH"],
      },
    shipping_options: [
      {
        shipping_rate: shipping_rate_id,
      }
    ],
  });

  return {
    statusCode: 303,
    headers: {
      Location: session.url,
    },
  };
};

// TODO:
// switch test/prod mode automatically
// handle errors - e.g., missing 'mode'
// customize thank you page https://stripe.com/docs/payments/checkout/custom-success-page
// Webhook - https://stripe.com/docs/webhooks
// Webhook signature for security https://stripe.com/docs/webhooks/signatures
