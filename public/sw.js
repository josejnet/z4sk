const CACHE="z4sk-shell-v4";
const SHELL=["/","/manifest.webmanifest","/favicon.ico","/favicon-32.png","/icon-192.png","/icon-512.png"];
self.addEventListener("install",event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL))));
self.addEventListener("activate",event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))));
self.addEventListener("fetch",event=>{const url=new URL(event.request.url);if(event.request.method!=="GET"||url.pathname.startsWith("/api/")||url.pathname.startsWith("/p/")||url.pathname.startsWith("/g/"))return;event.respondWith(fetch(event.request).catch(()=>caches.match(event.request).then(hit=>hit||caches.match("/"))))});
self.addEventListener("push",event=>{const data=event.data?.json?.()||{title:"Z4SK",body:"Your invitation has an update."};event.waitUntil(self.registration.showNotification(data.title,{body:data.body,icon:"/icon-192.png",badge:"/favicon-32.png",data:{url:data.url||"/"}}))});
self.addEventListener("notificationclick",event=>{event.notification.close();event.waitUntil(clients.openWindow(event.notification.data?.url||"/"))});
