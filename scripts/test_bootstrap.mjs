#!/usr/bin/env node
/** The two pieces of bootstrap.mjs that are logic rather than shelling out.
 *
 *     node scripts/test_bootstrap.mjs
 */
import assert from "node:assert/strict";
import { assetFor, mergeHooks, SERENA_HOOKS } from "./bootstrap.mjs";

// Per-platform asset names. Getting one wrong downloads a 404 page and extracts nothing.
assert.match(assetFor("uv", "linux", "x64").file, /x86_64-unknown-linux-gnu\.tar\.gz$/);
assert.match(assetFor("uv", "win32", "x64").file, /x86_64-pc-windows-msvc\.zip$/);
assert.match(assetFor("uv", "darwin", "arm64").file, /aarch64-apple-darwin\.tar\.gz$/);

// The release this one comes from has no Windows build, so the step must be
// skippable rather than fail — this null is what makes the script say so.
assert.equal(assetFor("codebase-memory-mcp", "win32", "x64"), null);
assert.match(assetFor("codebase-memory-mcp", "linux", "x64").file, /linux-amd64\.tar\.gz$/);

// Merging into empty settings adds all four hooks...
const settings = {};
const added = mergeHooks(settings, SERENA_HOOKS("/bin/serena-hooks"));
assert.equal(added.length, 4);
assert.equal(settings.hooks.PreToolUse.length, 2);

// ...and merging again adds none. Re-running the installer is the normal path.
assert.deepEqual(mergeHooks(settings, SERENA_HOOKS("/bin/serena-hooks")), []);

// An existing unrelated hook survives the merge.
const withOthers = { hooks: { SessionStart: [{ hooks: [{ type: "command", command: "beep" }] }] } };
mergeHooks(withOthers, SERENA_HOOKS("/bin/serena-hooks"));
assert.equal(withOthers.hooks.SessionStart.length, 2);
assert.equal(withOthers.hooks.SessionStart[0].hooks[0].command, "beep");

console.log("ok — 8 checks");
