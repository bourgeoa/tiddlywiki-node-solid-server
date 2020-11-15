# Tiddlywiki-node-solid-server

Tiddlywiki SyncAdaptorModule for node-solid-server
To login to the Solid pod it uses [solid-file-widget](https://github.com/bourgeoa/solid-file-widget)

## Save your tiddlers to your [Solid pod](https://github.com/solid/node-solid-server)!

Tiddlers are saved as `turtle` files by default in `https://<yourPod>/public/tiddlers/main`

Works anywhere, just grab the plugin on [$:/plugins/bourgeoa/nodesolidserver](https://bourgeoa.solidcommunity.net/public/tiddlywiki/#%24%3A%2Fplugins%2Fbourgeoa%2Fnodesolidserver), save, reload, optionally change your preferences on [$:/plugins/bourgeoa/nodesolidserver/config](https://bourgeoa.solid.community/public/tiddlywiki/#%24%3A%2Fplugins%2Fbourgeoa%2Fnodesolidserver) and you'll be good to go.

Your tiddlers will be saved on your Solid Pod to `/public/tiddlers/<chosen-namespace>/`.

  * `<chosen-namespace>` defaults to `"main"`.

---
For any help on [tiddlywiki](https://tiddlywiki.com/).

---

## Just start using it now

If you're just starting a new TiddlyWiki you don't have to bother installing anything, just visit https://bourgeoa.solidcommunity.net/public/tiddlywiki
login to your Solid pod and start writing, everything will be saved on your Solid pod.

When you connect in the future you will find your 'tiddlers' listed under 'tags' or under 'untagged'.

## Acknowledgements

Many thanks for inspiration from https://github.com/remotestorage/remotestorage-widget, https://github.com/fiatjaf/tiddlywiki-remotestorage
and from https://github.com/jeff-zucker/solid-file-client
 

**copyright (c) 2019 Alain Bourgeois** may be freely used with MIT license