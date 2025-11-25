import type { NextConfig } from "next";
import { hostname } from "os";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,

  images:{
    remotePatterns:[
      {
        hostname:'avatars.githubusercontent.com',
        protocol: "https"
      },

      {
        hostname: '*.googleusercontent.com',
        protocol:"https",

      },
      {
        hostname:'avatar.vercel.sh',
        protocol : 'https',
      }
  ]
  }
};

export default nextConfig;
