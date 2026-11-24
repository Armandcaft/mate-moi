import { text } from '@sveltejs/kit';

/** Fly.io's health check. */
export const GET = () => text('ok');
