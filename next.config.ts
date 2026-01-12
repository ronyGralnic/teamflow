import type { NextConfig } from "next";


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
      },
      {
        hostname: 'gksbd0k1mm.ufs.sh',
        protocol: 'https'
      }
  ]
  }
};

export default nextConfig;
