// Which time zone pages write dates in. The server cannot know the viewer's, and a date written in
// one zone by the server and another by the browser would not hydrate: so UTC until the root layout
// is mounted, then the device's own (`undefined`), and the dates re-render once.
let hydrated = $state(false);

export const markHydrated = () => {
	hydrated = true;
};

export const timeZone = (): string | undefined => (hydrated ? undefined : 'UTC');
