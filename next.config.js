/** @type {import('next').NextConfig} */
const config = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ["i.ytimg.com", "img.youtube.com"],
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": `${process.cwd()}/src`,
    };
    return config;
  },
};

export default config;
