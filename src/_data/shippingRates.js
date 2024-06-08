const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// One product can have multiple prices but for my use case, it's 1:1 so this works without having to massage the data
// TODO: add Expanding data docs link
async function getShippingRates() {
  const response = await stripe.shippingRates.list({
    limit: 3,
  });
  console.log("shippingRates:", response.data);
  return response.data.filter(shippingRate => shippingRate.active);
}

module.exports = async function () {
  return await getShippingRates();
};
