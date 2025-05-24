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
            {
                protocol: 'http',
                hostname: 'localhost',
                port: '5169',
                pathname: '/ai_pics/**',
            },
            {
                protocol: 'http',
                hostname: '192.168.1.104',
                port: '5169',
                pathname: '/profile_pics/**',
            },
            {
                protocol: 'http',
                hostname: '192.168.1.104',
                port: '5169',
                pathname: '/post_pics/**',
            },
            {
                protocol: 'http',
                hostname: '192.168.1.104',
                port: '5169',
                pathname: '/ai_pics/**',
            }
        ],
    },
    allowedDevOrigins: [
        'http://192.168.1.104:3000',
        'http://localhost:3000'
    ],
};

module.exports = nextConfig; 