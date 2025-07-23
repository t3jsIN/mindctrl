import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';

export default defineConfig({
	plugins: [
		sveltekit(),
		SvelteKitPWA({
			strategies: 'generateSW',
			registerType: 'autoUpdate',
			workbox: {
				globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2}'],
				runtimeCaching: [
					{
						urlPattern: /^https:\/\/fonts\.googleapis\.com\//,
						handler: 'StaleWhileRevalidate',
						options: {
							cacheName: 'google-fonts-stylesheets',
						}
					},
					{
						urlPattern: /^https:\/\/fonts\.gstatic\.com\//,
						handler: 'CacheFirst',
						options: {
							cacheName: 'google-fonts-webfonts',
							expiration: {
								maxEntries: 30,
								maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
							}
						}
					}
				]
			},
			manifest: {
				name: 'MindCTRL - Take Control of Your Mind',
				short_name: 'MindCTRL',
				description: 'Comprehensive life management system with hydration tracking, sleep monitoring, and task management',
				theme_color: '#000000',
				background_color: '#000000',
				display: 'standalone',
				scope: '/',
				start_url: '/',
				orientation: 'portrait',
				icons: [
					{
						src: '/icon-192.png',
						sizes: '192x192',
						type: 'image/png',
						purpose: 'any maskable'
					},
					{
						src: '/icon-512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'any maskable'
					}
				],
				categories: ['productivity', 'health', 'lifestyle']
			},
			devOptions: {
				enabled: true,
				type: 'module'
			}
		})
	],
	server: {
		port: 5173,
		host: true
	},
	// Add better TypeScript support
	esbuild: {
		target: 'esnext'
	}
});