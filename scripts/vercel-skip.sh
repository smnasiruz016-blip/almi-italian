#!/usr/bin/env bash
# Vercel "Ignore Build Step" command. Exit 0 = SKIP build, exit 1 = BUILD.
#
# Skips a deploy whose only changes are docs / tests / CI / editor config, so a
# README or *.test.ts push does not trigger a full rebuild + ISR cache flush.
#
# This logic used to live inline in vercel.json's "ignoreCommand". Vercel caps
# that field at 256 chars and the pathspec list was 260 — Vercel rejected the
# config and EVERY deploy errored (not the DB, not next build). Moved to a script
# so the field is ~25 chars and can never hit the limit again. One file, all forks.
#
# --- CASE 1: A REDEPLOY OF THE COMMIT THAT IS ALREADY LIVE -------------------
# On a redeploy - the dashboard's "Redeploy" button, or any deploy of a commit
# already deployed - Vercel sets VERCEL_GIT_PREVIOUS_SHA to the SAME commit being
# deployed. A `git diff` of a commit against itself is empty no matter what the
# pathspec says: the exclusion list is never even consulted. The old logic exited
# 0 and the deploy cancelled at 1s - Canceled, not Failed, because the build never
# started.
#
# That silently defeats every ENV-ONLY change. Vercel applies dashboard environment
# variables to NEW deployments; a cancelled deploy creates none, so production keeps
# serving the previous build with the old or missing value. CRON_SECRET was added and
# redeployed twice, both cancelled, and /api/cron/cleanup-audio kept returning 401 -
# the variable was set and the thing it was set for never happened. RESEND_API_KEY,
# STRIPE_WEBHOOK_SECRET and the Neon password are queued behind the same trap.
#
# A redeploy is always a deliberate human act, so it always builds. Chosen over a
# FORCE_BUILD variable because that needs someone to remember it at precisely the
# moment they are thinking about a secret and not about this script.
#
# --- CASE 2: EVERYTHING ELSE - UNCHANGED ------------------------------------
# The script's exit status is `git diff --quiet`'s: 0 when nothing outside the
# excluded paths changed (skip), 1 when real source changed (build).

PREV="${VERCEL_GIT_PREVIOUS_SHA:-}"

# CASE 1. Resolved commit ids are compared, so an abbreviated SHA still matches. If
# PREV cannot be resolved (shallow clone) this is simply false and CASE 2 decides -
# and there `git diff` against an unreachable SHA errors non-zero, which also builds.
if [ -n "$PREV" ]; then
  HEAD_SHA="$(git rev-parse HEAD)"
  PREV_SHA="$(git rev-parse --verify --quiet "${PREV}^{commit}" || true)"
  if [ "$PREV" = "$HEAD_SHA" ] || [ "$PREV_SHA" = "$HEAD_SHA" ]; then
    exit 1 # redeploy of the live commit - always build
  fi
fi

# CASE 2 - unchanged.
git diff --quiet "${PREV:-HEAD^}" HEAD -- . ':(exclude)*.md' ':(exclude)docs/**' ':(exclude)**/*.test.ts' ':(exclude)**/*.test.tsx' ':(exclude)**/*.spec.ts' ':(exclude).github/**' ':(exclude)README*' ':(exclude)LICENSE*' ':(exclude).vscode/**'
