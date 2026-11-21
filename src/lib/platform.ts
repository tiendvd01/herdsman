/** macOS window with an overlay title bar: the traffic lights float over the top-left of the app. */
export const IS_MAC = typeof navigator !== 'undefined' && /Mac/.test(navigator.userAgent);
/** Horizontal space reserved for the traffic lights (x 18 + three buttons). */
export const TRAFFIC_LIGHTS_PAD = 'pl-[84px]';
