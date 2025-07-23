import adapter from '@sveltejs/adapter-netlify';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter({
			// Use edge functions for better performance
			edge: false,
			// Ensure proper splitting
			split: true
		}),
		// Important: Configure service worker properly
		serviceWorker: {
			register: false // Let vite-pwa handle this
		}
	}
};

export default config;