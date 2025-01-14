import Replicate from "replicate";
import { ReplicateStream, StreamingTextResponse } from "ai";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

if (!process.env.REPLICATE_API_TOKEN) {
  throw new Error(
    "The REPLICATE_API_TOKEN environment variable is not set. See README.md for instructions on how to set it."
  );
}

export const runtime = "edge";

export async function POST(req) {
  const params = await req.json();

  const response = params.image
    ? await runLlava(params)
    : params.audio
      ? await runSalmonn(params)
      : await runLlama(params);

  // Convert the response into a friendly text-stream
  const stream = await ReplicateStream(response);
  // Respond with the stream
  return new StreamingTextResponse(stream);
}

async function runLlama({
  prompt,
  systemPrompt,
  maxTokens,
  temperature,
  topP,
  version,
}) {
  console.log("running llama");
  return await replicate.predictions.create({
    // IMPORTANT! You must enable streaming.
    stream: true,
    input: {
      prompt: `${prompt}`,
      system_prompt: systemPrompt,
      max_new_tokens: maxTokens,
      temperature: temperature,
      repetition_penalty: 1,
      top_p: topP,
    },
    // IMPORTANT! The model must support streaming. See https://replicate.com/docs/streaming
    version: version,
  });
}

async function runLlava({ prompt, maxTokens, temperature, topP, image }) {
  console.log("running llava");

  return await replicate.predictions.create({
    // IMPORTANT! You must enable streaming.
    stream: true,
    input: {
      prompt: `${prompt}`,
      top_p: topP,
      temperature: temperature,
      max_tokens: maxTokens,
      image: image,
    },
    // IMPORTANT! The model must support streaming. See https://replicate.com/docs/streaming
    version: "2facb4a474a0462c15041b78b1ad70952ea46b5ec6ad29583c0b29dbd4249591", // hardcoded https://replicate.com/yorickvp/llava-13b/versions
  });
}

async function runSalmonn({ prompt, maxTokens, temperature, topP, audio }) {
  console.log("running salmonn");

  return await replicate.predictions.create({
    // IMPORTANT! You must enable streaming.
    stream: true,
    input: {
      prompt: `${prompt}`,
      top_p: topP,
      temperature: temperature,
      max_length: maxTokens,
      wav_path: audio,
    },
    // IMPORTANT! The model must support streaming. See https://replicate.com/docs/streaming
    version: "ad1d3f9d2bd683628242b68d890bef7f7bd97f738a7c2ccbf1743a594c723d83", // hardcoded https://replicate.com/yorickvp/llava-13b/versions
  });
}
