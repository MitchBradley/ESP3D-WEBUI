# How to release a tablet/ESP3D-WEBUI change into FluidNC

This is the process for getting a fix or feature that lives in the `tablet`
submodule (or elsewhere in this repo) all the way into FluidNC's bundled
WebUI. It's three separate commits across three repos, in order.

## 1. Make and test the change

Edit source under `tablet/src/tablet/` (or `www/` for the rest of the UI)
as usual.

## 2. Build the package

From the `ESP3D-WEBUI` root (not `tablet/`):

```bash
npx gulp package --lang en
```

**Always pass `--lang en`.** A plain `gulp package` bundles every
translation and produces a file too large to fit in a real ESP32's
`littlefs`/SPIFFS partition.

This writes `index.html.gz` at the repo root (the gulp `compress` task
targets `gulp.dest('.')`). Note: the file's on-disk mtime may not update in
some sandboxed environments even though the content did -- verify by
content (md5/diff), not by timestamp.

## 3. Test on real hardware before committing anything

Upload the freshly built `index.html.gz` to a test board's WebDAV flash
mount (**not** `/localfs` or `/littlefs` -- those are read-only aliases for
GET; writes go through the WebDAV mount, which is `/flash` for
`LocalFS`/littlefs and `/sd` for the SD card):

```bash
curl -T index.html.gz http://<test-board-ip>/flash/index.html.gz
```

If you get `507 Insufficient Storage`, the board's flash filesystem doesn't
have room for old+new to coexist momentarily. Delete the old file first
(**only on a testbed you're comfortable risking** -- see the safety note
below), then re-PUT:

```bash
curl -X DELETE http://<test-board-ip>/flash/index.html.gz
curl -T index.html.gz http://<test-board-ip>/flash/index.html.gz
```

Reload the page in a browser (a plain navigate may serve a cached copy --
force a fresh fetch, e.g. with a cache-busting query string) and exercise
the change. For the tablet visualizer specifically, load the relevant
`.nc` file(s) from `/sd/...` and check the browser console for unexpected
errors alongside the visual result.

**Safety note:** only do the delete-then-PUT dance on a testbed machine
that can't hurt itself if left without a working WebUI. On a live/production
machine, let whoever owns it handle the actual deployment once the change
is verified elsewhere.

## 4. Commit and push the `tablet` submodule

```bash
cd tablet
git add -A
git commit -m "..."
git push origin <branch>
```

## 5. Commit and push `ESP3D-WEBUI` itself

This picks up both the submodule pointer bump and the rebuilt
`index.html.gz`:

```bash
cd ..
git add index.html.gz tablet
git commit -m "..."
git push <your-fork-remote> <branch>
```

Only stage `index.html.gz` and `tablet` explicitly -- the working tree
commonly has unrelated untracked scratch/editor files that shouldn't be
swept in with `git add -A`.

## 6. Land the rebuilt bundle in FluidNC

FluidNC vendors a prebuilt copy at `FluidNC/data/index.html.gz`; it does
not build ESP3D-WEBUI itself. From a FluidNC checkout:

```bash
git checkout main && git pull --ff-only
git checkout -b <branch-name>
cp /path/to/ESP3D-WEBUI/index.html.gz FluidNC/data/index.html.gz
git add FluidNC/data/index.html.gz
git commit -m "..."
git push -u origin <branch-name>
gh pr create --base main --head <branch-name> --title "..." --body "..."
```

## Why the three-repo split

- `tablet` is its own submodule/repo (`WebUI-tablet-extension`) so it can be
  developed and versioned independently of the rest of the WebUI.
- `ESP3D-WEBUI` builds the full bundle (tablet UI + dashboard + everything
  else) into one gzipped `index.html.gz`.
- `FluidNC` just vendors that one build artifact under `FluidNC/data/` --
  it has no build step of its own for the WebUI, so someone has to run
  step 2 and copy the result over by hand.
