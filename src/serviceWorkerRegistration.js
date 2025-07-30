// // src/serviceWorkerRegistration.js

// const isLocalhost = Boolean(
//   window.location.hostname === 'localhost' ||
//   window.location.hostname === '[::1]' ||
//   window.location.hostname.match(
//     /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
//   )
// );

// export function register() {
//   if ('serviceWorker' in navigator) {
//     window.addEventListener('load', () => {
//       navigator.serviceWorker
//         .register('/service-worker.js')
//         .then((reg) => console.log('SW registered', reg))
//         .catch((err) => console.error('SW registration failed', err));
//     });
//   }
// }


// // export function register(config) {
// //   if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
// //     const publicUrl = new URL(process.env.PUBLIC_URL, window.location.href);
// //     if (publicUrl.origin !== window.location.origin) return;

// //     window.addEventListener('load', () => {
// //       const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;

// //       if (isLocalhost) {
// //         checkValidServiceWorker(swUrl, config);
// //         navigator.serviceWorker.ready.then(() => {
// //           console.log('This web app is being served cache-first by a service worker.');
// //         });
// //       } else {
// //         registerValidSW(swUrl, config);
// //       }
// //     });
// //   }
// // }

// function registerValidSW(swUrl, config) {
//   navigator.serviceWorker
//     .register(swUrl)
//     .then(registration => {
//       registration.onupdatefound = () => {
//         const installingWorker = registration.installing;
//         if (!installingWorker) return;
//         installingWorker.onstatechange = () => {
//           if (installingWorker.state === 'installed') {
//             if (navigator.serviceWorker.controller) {
//               console.log('New content is available; please refresh.');
//               if (config && config.onUpdate) config.onUpdate(registration);
//             } else {
//               console.log('Content is cached for offline use.');
//               if (config && config.onSuccess) config.onSuccess(registration);
//             }
//           }
//         };
//       };
//     })
//     .catch(error => {
//       console.error('Error during service worker registration:', error);
//     });
// }

// function checkValidServiceWorker(swUrl, config) {
//   fetch(swUrl, { headers: { 'Service-Worker': 'script' } })
//     .then(response => {
//       const contentType = response.headers.get('content-type');
//       if (
//         response.status === 404 ||
//         (contentType && contentType.indexOf('javascript') === -1)
//       ) {
//         navigator.serviceWorker.ready.then(registration => {
//           registration.unregister().then(() => {
//             window.location.reload();
//           });
//         });
//       } else {
//         registerValidSW(swUrl, config);
//       }
//     })
//     .catch(() => {
//       console.log('No internet connection found. App is running in offline mode.');
//     });
// }

// export function unregister() {
//   if ('serviceWorker' in navigator) {
//     navigator.serviceWorker.ready.then(registration => {
//       registration.unregister();
//     });
//   }
// }


// src/serviceWorkerRegistration.js

// export function register(config) {
//   if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
//     const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;

//     window.addEventListener('load', () => {
//       registerValidSW(swUrl, config);
//     });
//   }
// }

// function registerValidSW(swUrl, config) {
//   navigator.serviceWorker
//     .register(swUrl)
//     .then(registration => {
//       registration.onupdatefound = () => {
//         const installingWorker = registration.installing;
//         if (!installingWorker) return;
//         installingWorker.onstatechange = () => {
//           if (installingWorker.state === 'installed') {
//             if (navigator.serviceWorker.controller) {
//               console.log('New content is available; please refresh.');
//               if (config && config.onUpdate) config.onUpdate(registration);
//             } else {
//               console.log('Content is cached for offline use.');
//               if (config && config.onSuccess) config.onSuccess(registration);
//             }
//           }
//         };
//       };
//     })
//     .catch(error => {
//       console.error('Error during service worker registration:', error);
//     });
// }

// export function unregister() {
//   if ('serviceWorker' in navigator) {
//     navigator.serviceWorker.ready.then(registration => {
//       registration.unregister();
//     });
//   }
// }





// src/serviceWorkerRegistration.js

// export function register(config) {
//   if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
//     const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;

//     window.addEventListener('load', () => {
//       navigator.serviceWorker
//         .register(swUrl)
//         .then((registration) => {
//           console.log('✅ Service Worker registered:', registration);

//           registration.onupdatefound = () => {
//             const installingWorker = registration.installing;
//             if (!installingWorker) return;

//             installingWorker.onstatechange = () => {
//               if (installingWorker.state === 'installed') {
//                 if (navigator.serviceWorker.controller) {
//                   console.log('🔄 New content available');
//                   if (config?.onUpdate) config.onUpdate(registration);
//                 } else {
//                   console.log('📦 Content cached for offline use');
//                   if (config?.onSuccess) config.onSuccess(registration);
//                 }
//               }
//             };
//           };
//         })
//         .catch((error) => {
//           console.error('❌ Error during SW registration:', error);
//         });
//     });
//   }
// }
export function register() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then(reg => console.log('✅ SW registered:', reg))
        .catch(err => console.error('❌ SW error:', err));
    });
  }
}


export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.unregister();
    });
  }
}
