// Builds or serves the public live demo: the eight demo pendants, the full lighting experience, the cart, and nothing else.
//   npm run build:demo   then   npm run start:demo   (extra arguments go to Next.js, e.g. npm run start:demo -- -p 4000)
//
// Every Supabase, Stripe and checkout setting is set to empty for Next.js, so values from .env.local (or the host) can't reach the
// build; LUMIERE_PUBLIC_DEMO is then fixed into the build by next.config.ts. Plain Node, so it works the same on every OS.
import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const [command, ...rest] = process.argv.slice(2);
if (command !== "build" && command !== "start") {
  console.error("Usage: node scripts/public-demo.mjs build|start [next options]");
  process.exit(1);
}

const BLANKED = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SECRET_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_API_BASE",
  "CHECKOUT_SHIPPING_COUNTRIES",
  "CHECKOUT_SHIPPING_CENTS",
  "CHECKOUT_TAX",
  "CHECKOUT_CURRENCY",
  "CHECKOUT_ALLOW_LIVE_PAYMENTS",
];
const env = { ...process.env, LUMIERE_PUBLIC_DEMO: "true" };
for (const name of BLANKED) env[name] = ""; // defined but empty: Next.js then never loads it from an .env file

const next = createRequire(import.meta.url).resolve("next/dist/bin/next");
const child = spawn(process.execPath, [next, command, ...rest], { env, stdio: "inherit" });
child.on("exit", (code, signal) => (signal ? process.kill(process.pid, signal) : process.exit(code ?? 1)));
