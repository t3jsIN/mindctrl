import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';

export default defineConfig({
	plugins: [
		sveltekit(),
		SvelteKitPWA({
			strategies: 'generateSW',
			registerType: 'autoUpdate',
			// Fix: Disable dev mode for production
			devOptions: {
				enabled: false, // Changed from true
				type: 'module'
			},
			workbox: {
				globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2}'],
				// Fix: Add proper navigation fallback
				navigateFallback: null, // Let SvelteKit handle routing
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
								maxAgeSeconds: 60 * 60 * 24 * 365
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
			}
		})
	],
	server: {
		port: 5173,
		host: true
	},
	build: {
		// Fix: Ensure proper build output
		target: 'esnext',
		sourcemap: false // Disable sourcemaps for production
	}
});