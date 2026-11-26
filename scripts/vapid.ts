// Keys for Web Push: prints the line that sets them on Fly.io.
//   npm run vapid
// Generate them once: changing them later silently cuts off every subscribed phone.
import { generateVAPIDKeys } from 'web-push';

const { publicKey, privateKey } = generateVAPIDKeys();
console.log(`fly secrets set VAPID_PUBLIC_KEY=${publicKey} VAPID_PRIVATE_KEY=${privateKey}`);
