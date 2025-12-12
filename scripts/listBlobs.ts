import { list } from "@vercel/blob";

async function main() {
  const result = await list({ prefix: "blog/" });
  console.log(result.blobs);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
