import Stripe from "stripe";

const key = process.env.STRIPE_KEY!;
const stripe = new Stripe(key, { apiVersion: '2022-11-15' });

export default stripe;

