import { Resend } from 'resend';

// Construct the Resend client LAZILY — `new Resend(undefined)` throws at
// module scope, which breaks env-less `next build` (CI page-data collection
// imports every route module). The client is only created on first property
// access, so importing this module never needs RESEND_API_KEY.
let client: Resend | undefined;

const getResend = () => {
  if (!client) {
    client = new Resend(process.env.RESEND_API_KEY);
  }
  return client;
};

const resend: Resend = new Proxy({} as Resend, {
  get(_target, prop, receiver) {
    return Reflect.get(getResend() as object, prop, receiver);
  },
});

export default resend;
