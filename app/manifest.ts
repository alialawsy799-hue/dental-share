import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "دينتال شير",
    short_name: "Dental Share",
    description: "عيادتك، خدماتك، مجتمعك",
    start_url: "/app",
    scope: "/",
    display: "standalone",
    lang: "ar",
    dir: "rtl",
    background_color: "#F4F0FF",
    theme_color: "#7C3AED",
    icons: [
      { src: "/brand/logo-mark.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
