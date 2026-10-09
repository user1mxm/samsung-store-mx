# Premium storefront and television studio

This release builds on the deployed PR17 commit e85facb8f8a6d3ca827fd2a1468cf664374fab38. It must pass the deployment source-baseline guard before replacing production. The deploy script preserves images, backs up application and MySQL, validates additive migrations, runs isolated and domain health checks, and restores the previous bundle and dependencies on failure. Payments remain disabled.

## Television recreation

The interactive viewer uses actual Three.js WebGL geometry, physically based materials, studio lighting, contact shadows, OrbitControls, camera presets, zoom, optional rotation, keyboard controls, and light/dark studios. It downloads only after activation; rendering pauses when hidden or outside the viewport. WebGL failure leaves an illustrated preview and retry control. It is a visual recreation, not manufacturer CAD or a promise of exact connector layout.

Only UN75DU8000 receives the documented dimensions: 1676.7 x 960.3 x 26.6 mm without stand, 1003.4 mm total height, 331.9 mm stand depth, 1266.8 mm stand span and 400 x 400 mm VESA. Other models use an explicitly illustrative profile, without copying unrelated specifications.

Reference: https://www.samsung.com/mx/tvs/uhd-4k-tv/du8000-75-inch-crystal-uhd-4k-tizen-os-smart-tv-un75du8000fxzx/

The screen landscape is generated demonstration imagery, not a photograph of the sold unit. Image generation mode: new text-to-image, opaque background, no reference image. Consumed assets: public/viewer/alpine-screen-v1.webp and public/viewer/alpine-screen-v1-960.webp.

Generation prompt:
> Use case: photorealistic-natural. Asset type: demonstration screen texture inside an interactive 3D television on a premium Samsung retailer website. Generate a stunning lifelike high resolution wide 16:9 nature photograph filling the entire image edge to edge: a crystalline turquoise alpine lake with exquisitely detailed snow capped dramatic mountains, dark evergreen trees at the edges, delicate warm sunrise light on mountain tops, soft clouds and reflected sky. Natural photographic detail, subtle cinematic color grading, premium TV showroom demo photography, convincing fine textures, beautiful deep contrast, clean sharp image with no oversharpening. Camera straight landscape horizon. No television, no frame, no screen border, no room, no product, no humans, no typography, no logos, no watermark. This is only the landscape content that will be mapped to the display, not a picture of a display.

## Delivery and layout

Initial JavaScript decreased from the deployed build's 1350.32 KB to approximately 696.53 KB (48.4% raw); gzip decreased from 378.62 KB to approximately 213.19 KB (43.7%). Viewer and account/admin routes are separate deferred chunks. These are build sizes, not a measured production Lighthouse score or download-time guarantee.

Twenty bundled catalog images totalled 20,169,839 original bytes; their 960px WebP variants total 994,496 bytes (95.1% smaller). Native responsive image sources choose 480/960px derivatives where available and preserve originals. Dynamic upload images are not included in this estimate. Static files support prebuilt Brotli/gzip with immutable hashed-asset caching; HTML revalidates and API responses remain private/no-store.

The storefront uses a responsive pearl/navy product studio, static readable heading, searchable product grid, touch-accessible controls, and reduced-motion support. Homepage display does not wait for account lookup; protected routes retain authentication guards.

## Verification

Node unit/contract/recovery/model tests, TypeScript, production build, HTTP smoke checks and compiled-browser checks are included. Browser checks cover 1440/390/320px, deferred viewer loading, WebGL rendering, camera and lighting controls, model-code search, stock-one cart cap, subtotal, disabled checkout and WebGL-unavailable fallback. Browser catalog/auth responses are isolated fixtures; no live accounts, inventory, payments or emails are modified. CI additionally runs the existing MySQL integration suite. Visual screenshots are reviewed separately because document overflow checks cannot detect every clipped child.
