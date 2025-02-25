/** @type {import('next').NextConfig} */
const config = {
  images: {
    domains: ["i.ytimg.com", "img.youtube.com", "yt3.ggpht.com"],
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": `${process.cwd()}/src`,
    };

    // Ignore punycode deprecation warning
    config.ignoreWarnings = [
      { module: /node_modules\/punycode/ },
      {
        message:
          /Critical dependency: the request of a dependency is an expression/,
      },
    ];

    return config;
  },
};

module.exports = config;
