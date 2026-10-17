// Post the next Short from plan/buffer-youtube-queue.json to the Bananafest
// Destiny YouTube channel, now, through Buffer's API.
//
// Since 2026-10-16 the channel sits in a Buffer account it shares with other
// projects, on the free plan's 10 scheduled posts, and those slots are theirs.
// "Share now" doesn't hold a scheduled slot, so this posts one at a time on the
// day instead of queueing ten ahead. The key is in .buffer/key (git-excluded).
//
//   node app/scripts/buffer-share.mjs          # dry run: shows what's next
//   node app/scripts/buffer-share.mjs --post   # posts it, records the link
import { readFileSync, writeFileSync } from "node:fs";

const root = new URL("../../", import.meta.url).pathname;
const QUEUE = root + "plan/buffer-youtube-queue.json";
const CHANNEL = "6ad1bfde778b240e2f25622f"; // Bananafest Destiny, YouTube
const key = readFileSync(root + ".buffer/key", "utf8").trim();

const gql = async (query, variables) => {
  const r = await fetch("https://api.buffer.com", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const j = await r.json();
  if (j.errors) throw new Error(JSON.stringify(j.errors));
  return j.data;
};

const queue = JSON.parse(readFileSync(QUEUE, "utf8"));
const next = queue.find((s) => !s.posted && !s.retired && s.text);
if (!next) { console.log("Nothing left to post that has its text in the queue file."); process.exit(0); }
console.log(`next: ${next.title}\n      ${next.video}`);
if (!process.argv.includes("--post")) { console.log("dry run; pass --post to post it"); process.exit(0); }

const head = await fetch(next.video, { headers: { range: "bytes=0-0" } });
if (!head.ok) throw new Error(`video is ${head.status}, not posting`);

const { createPost } = await gql(
  `mutation($i: CreatePostInput!) { createPost(input: $i) { __typename
     ... on PostActionSuccess { post { id status } } ... on MutationError { message } } }`,
  { i: { channelId: CHANNEL, text: next.text, schedulingType: "automatic", mode: "shareNow",
         assets: [{ video: { url: next.video } }],
         metadata: { youtube: { title: next.title, categoryId: "26", madeForKids: false, privacy: "public" } } } },
);
if (!createPost.post) throw new Error(`Buffer refused: ${createPost.message}`);

// Buffer hands the upload to YouTube and fills in the link once it lands.
let link = null;
for (let i = 0; i < 12 && !link; i++) {
  await new Promise((r) => setTimeout(r, 15000));
  const { post } = await gql(`query($id: PostId!) { post(input: { id: $id }) { status externalLink error { message } } }`, { id: createPost.post.id });
  if (post.error) throw new Error(`Buffer: ${post.error.message}`);
  link = post.externalLink;
}
next.posted = { at: new Date().toISOString().slice(0, 16) + "Z", youtube: link };
writeFileSync(QUEUE, JSON.stringify(queue, null, 2) + "\n");
console.log(link ? `posted: ${link}` : "posted, but no YouTube link after 3 minutes; check the channel");
