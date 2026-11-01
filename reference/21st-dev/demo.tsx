"use client";

import PendantLampRail from "@/components/ui/pendant-lamp-rail";
import type { PendantLamp } from "@/components/ui/pendant-lamp-rail";

export const LAMP_DEMO_ITEMS: PendantLamp[] = [
  {
    id: "dome-enamel",
    name: "Enamel dome · Forest",
    tag: "$180",
    drop: 0.62,
    description: "Glossy forest-green enamel over steel, with a bright white reflector inside.",
    details: ["E27 · 4 W filament LED", "Ø 38 cm shade", "1.5 m fabric cord"],
    image: "https://cdn.21st.dev/assets/mirror/fc/fcfdfbf3d62f14d97eb23453aa9fe6772f7c09b521226442621e4f187d79b4d6.webp",
    imageOn: "https://cdn.21st.dev/assets/mirror/2d/2d2990c7f5d56e69848237695a204baf6a366d180facb94c62b78cdc3e37dd13.webp",
  },
  {
    id: "glass-globe",
    name: "Glass globe · Clear",
    tag: "$210",
    drop: 0.9,
    description: "Hand-blown clear glass around an exposed filament and a brass socket.",
    details: ["E27 · 4 W filament LED", "Ø 25 cm globe", "Brass socket"],
    image: "https://cdn.21st.dev/assets/mirror/ba/ba2f12a44156865baeb4c1173a7d320384edc5156dcaf1d4e44e684ae780ba57.webp",
    imageOn: "https://cdn.21st.dev/assets/mirror/a5/a55502eb9cf6cac0bd52969eb61bb546a478e861f3568aad6875e4dad5c03f6e.webp",
  },
  {
    id: "cone-brass",
    name: "Brass cone · Brushed",
    tag: "$240",
    drop: 0.74,
    description: "A tall cone of brushed brass that throws a tight pool of light.",
    details: ["GU10 · 5 W LED", "Ø 22 × 34 cm", "Brushed brass"],
    image: "https://cdn.21st.dev/assets/mirror/96/968b92c5f3adc4a3f45d627f339fa2c4017a70a0d57f7c68b8a0c5b4ace6aef3.webp",
    imageOn: "https://cdn.21st.dev/assets/mirror/cc/cc2aa1c7f32e04bc950f63274f28986c573a8ad2c27f84eef148191a1178d424.webp",
  },
  {
    id: "rattan-weave",
    name: "Rattan weave · Natural",
    tag: "$150",
    drop: 1,
    description: "Hand-woven rattan in a wide bell that scatters soft, patterned light.",
    details: ["E27 · 6 W LED", "Ø 45 cm bell", "Natural rattan"],
    image: "https://cdn.21st.dev/assets/mirror/12/1237597f711ee8334bad09432954cf04fe8cc104877dece6d0986441e59030a9.webp",
    imageOn: "https://cdn.21st.dev/assets/mirror/39/394b02f1dff0096ebace53699c42c4d817dfffd5aff943d888454a83036ce1fb.webp",
  },
  {
    id: "paper-lantern",
    name: "Paper lantern · Washi",
    tag: "$120",
    drop: 0.68,
    description: "White paper over a fine bamboo frame for a soft, even glow.",
    details: ["E27 · 4 W LED", "Ø 40 cm sphere", "Bamboo frame"],
    image: "https://cdn.21st.dev/assets/mirror/dd/dd85e367f381884fa9147495c1025af4faed8a2f7ec1bc3cd82bbdc9a3c2815b.webp",
    imageOn: "https://cdn.21st.dev/assets/mirror/a9/a9e6b40b11b3abca1a39acd32489b66f6094f3ecb5361862c16a1d36599ad60c.webp",
  },
  {
    id: "concrete-cone",
    name: "Concrete cone · Ash",
    tag: "$260",
    drop: 0.86,
    description: "Cast grey concrete with a pale inner face and a wide, low cone.",
    details: ["E27 · 6 W LED", "Ø 40 cm shade", "Cast concrete"],
    image: "https://cdn.21st.dev/assets/mirror/a8/a89caec23d33213a849f40b76789ead7c88f0c2d91eb7e91e60987c72e566032.webp",
    imageOn: "https://cdn.21st.dev/assets/mirror/b1/b17f53b4eb8ff9d544bc2ce66802e46c7134d760cd225f9059aec2f7799ffbb7.webp",
  },
  {
    id: "fluted-glass",
    name: "Fluted glass · Opal",
    tag: "$190",
    drop: 0.58,
    description: "Ribbed opal glass that softens the bulb into a column of light.",
    details: ["E27 · 4 W LED", "Ø 18 × 22 cm", "Opal glass"],
    image: "https://cdn.21st.dev/assets/mirror/14/14f8418ed6724766526e9d3efb7130163b8f6bc8cd784452ea4afdcaa980d818.webp",
    imageOn: "https://cdn.21st.dev/assets/mirror/14/141699616e79db6eeb2667ff7dcd106822e1cb408dd4ea2c7fe5c42fa52b957f.webp",
  },
  {
    id: "copper-bell",
    name: "Copper bell · Polished",
    tag: "$390",
    drop: 0.8,
    description: "Polished copper outside and a white enamel bell inside.",
    details: ["E27 · 6 W LED", "Ø 36 cm bell", "Polished copper"],
    image: "https://cdn.21st.dev/assets/mirror/3d/3d6d7c813c8d408fff25a92204f49cfcfa3cdf445e27b21b350c666177380c47.webp",
    imageOn: "https://cdn.21st.dev/assets/mirror/bf/bf643df2bd7d8eb4af9aeeffa53c5ff6dca49f702b88bde2a584697ca82aa862.webp",
  },
];

export default function PendantLampRailDemo({ autoplay = true }: { autoplay?: boolean }) {
  return (
    <div data-lamp-demo className="flex min-h-svh w-full items-center justify-center bg-background text-foreground">
      <PendantLampRail
        items={LAMP_DEMO_ITEMS}
        eyebrow="Lighting studio · Eight pendants"
        heading="A lighting store you can switch on, right on the page."
        caption="Brush along the track to light a pendant, slide it along, lift it to dim."
        autoplay={autoplay}
        action={
          <button type="button" className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background shadow-sm outline-none transition-[transform,box-shadow] hover:-translate-y-px hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none">
            Shop lighting
          </button>
        }
      />
    </div>
  );
}

