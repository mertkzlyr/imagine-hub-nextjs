/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'http',
                hostname: 'localhost',
                port: '5169',
                pathname: '/profile_pics/**',
            },
            {
                protocol: 'http',
                hostname: 'localhost',
                port: '5169',
                pathname: '/post_pics/**',
            },
        ],
    },
};

module.exports = nextConfig; 