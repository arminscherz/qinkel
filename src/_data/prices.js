const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// One product can have multiple prices but for my use case, it's 1:1 so this works without having to massage the data
// TODO: add Expanding data docs link
async function getPrices() {
  const response = await stripe.prices.list({
    expand: ["data.product"],
  });
  console.log("prices:", response.data);
  return response.data.filter(price => price.product.active);
}

module.exports = async function () {
  return await getPrices();
};
