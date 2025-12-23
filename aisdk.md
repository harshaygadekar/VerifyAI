
# AI SDK

The AI SDK is the TypeScript toolkit designed to help developers build AI-powered applications and agents with React, Next.js, Vue, Svelte, Node.js, and more.

## Why use the AI SDK?

Integrating large language models (LLMs) into applications is complicated and heavily dependent on the specific model provider you use.

The AI SDK standardizes integrating artificial intelligence (AI) models across [supported providers](/docs/foundations/providers-and-models). This enables developers to focus on building great AI applications, not waste time on technical details.

For example, here’s how you can generate text with various models using the AI SDK:

<PreviewSwitchProviders />

The AI SDK has two main libraries:

- **[AI SDK Core](/docs/ai-sdk-core):** A unified API for generating text, structured objects, tool calls, and building agents with LLMs.
- **[AI SDK UI](/docs/ai-sdk-ui):** A set of framework-agnostic hooks for quickly building chat and generative user interface.

## Model Providers

The AI SDK supports [multiple model providers](/providers).

<OfficialModelCards />

## Templates

We've built some [templates](https://vercel.com/templates?type=ai) that include AI SDK integrations for different use cases, providers, and frameworks. You can use these templates to get started with your AI-powered application.

### Starter Kits

<Templates type="starter-kits" />

### Feature Exploration

<Templates type="feature-exploration" />

### Frameworks

<Templates type="frameworks" />

### Generative UI

<Templates type="generative-ui" />

### Security

<Templates type="security" />

## Join our Community

If you have questions about anything related to the AI SDK, you're always welcome to ask our community on [the Vercel Community](https://community.vercel.com/c/ai-sdk/62).

## `llms.txt` (for Cursor, Windsurf, Copilot, Claude etc.)

You can access the entire AI SDK documentation in Markdown format at [ai-sdk.dev/llms.txt](/llms.txt). This can be used to ask any LLM (assuming it has a big enough context window) questions about the AI SDK based on the most up-to-date documentation.

### Example Usage

For instance, to prompt an LLM with questions about the AI SDK:

1. Copy the documentation contents from [ai-sdk.dev/llms.txt](/llms.txt)
2. Use the following prompt format:

```prompt
Documentation:
{paste documentation here}
---
Based on the above documentation, answer the following:
{your question}
```

# Groq Provider

The [Groq](https://groq.com/) provider contains language model support for the Groq API.

## Setup

The Groq provider is available via the `@ai-sdk/groq` module.
You can install it with

<Tabs items={['pnpm', 'npm', 'yarn', 'bun']}>
  <Tab>
    <Snippet text="pnpm add @ai-sdk/groq" dark />
  </Tab>
  <Tab>
    <Snippet text="npm install @ai-sdk/groq" dark />
  </Tab>
  <Tab>
    <Snippet text="yarn add @ai-sdk/groq" dark />
  </Tab>

  <Tab>
    <Snippet text="bun add @ai-sdk/groq" dark />
  </Tab>
</Tabs>

## Provider Instance

You can import the default provider instance `groq` from `@ai-sdk/groq`:

```ts
import { groq } from '@ai-sdk/groq';
```

If you need a customized setup, you can import `createGroq` from `@ai-sdk/groq`
and create a provider instance with your settings:

```ts
import { createGroq } from '@ai-sdk/groq';

const groq = createGroq({
  // custom settings
});
```

You can use the following optional settings to customize the Groq provider instance:

- **baseURL** _string_

  Use a different URL prefix for API calls, e.g. to use proxy servers.
  The default prefix is `https://api.groq.com/openai/v1`.

- **apiKey** _string_

  API key that is being sent using the `Authorization` header.
  It defaults to the `GROQ_API_KEY` environment variable.

- **headers** _Record&lt;string,string&gt;_

  Custom headers to include in the requests.

- **fetch** _(input: RequestInfo, init?: RequestInit) => Promise&lt;Response&gt;_

  Custom [fetch](https://developer.mozilla.org/en-US/docs/Web/API/fetch) implementation.
  Defaults to the global `fetch` function.
  You can use it as a middleware to intercept requests,
  or to provide a custom fetch implementation for e.g. testing.

## Language Models

You can create [Groq models](https://console.groq.com/docs/models) using a provider instance.
The first argument is the model id, e.g. `gemma2-9b-it`.

```ts
const model = groq('gemma2-9b-it');
```

### Reasoning Models

Groq offers several reasoning models such as `qwen-qwq-32b` and `deepseek-r1-distill-llama-70b`.
You can configure how the reasoning is exposed in the generated text by using the `reasoningFormat` option.
It supports the options `parsed`, `hidden`, and `raw`.

```ts
import { groq } from '@ai-sdk/groq';
import { generateText } from 'ai';

const result = await generateText({
  model: groq('qwen/qwen3-32b'),
  providerOptions: {
    groq: {
      reasoningFormat: 'parsed',
      reasoningEffort: 'default',
      parallelToolCalls: true, // Enable parallel function calling (default: true)
      user: 'user-123', // Unique identifier for end-user (optional)
      serviceTier: 'flex', // Use flex tier for higher throughput (optional)
    },
  },
  prompt: 'How many "r"s are in the word "strawberry"?',
});
```

The following optional provider options are available for Groq language models:

- **reasoningFormat** _'parsed' | 'raw' | 'hidden'_

  Controls how reasoning is exposed in the generated text. Only supported by reasoning models like `qwen-qwq-32b` and `deepseek-r1-distill-*` models.

  For a complete list of reasoning models and their capabilities, see [Groq's reasoning models documentation](https://console.groq.com/docs/reasoning).

- **reasoningEffort** _'low' | 'meduim' | 'high' | 'none' | 'default'_

  Controls the level of effort the model will put into reasoning.

  - `qwen/qwen3-32b`
    - Supported values:
      - `none`: Disable reasoning. The model will not use any reasoning tokens.
      - `default`: Enable reasoning.
  - `gpt-oss20b/gpt-oss120b`
    - Supported values:
      - `low`: Use a low level of reasoning effort.
      - `medium`: Use a medium level of reasoning effort.
      - `high`: Use a high level of reasoning effort.

  Defaults to `default` for `qwen/qwen3-32b.`

- **structuredOutputs** _boolean_

  Whether to use structured outputs.

  Defaults to `true`.

  When enabled, object generation will use the `json_schema` format instead of `json_object` format, providing more reliable structured outputs.

- **parallelToolCalls** _boolean_

  Whether to enable parallel function calling during tool use. Defaults to `true`.

- **user** _string_

  A unique identifier representing your end-user, which can help with monitoring and abuse detection.

- **serviceTier** _'on_demand' | 'flex' | 'auto'_

  Service tier for the request. Defaults to `'on_demand'`.

  - `'on_demand'`: Default tier with consistent performance and fairness
  - `'flex'`: Higher throughput tier (10x rate limits) optimized for workloads that can handle occasional request failures
  - `'auto'`: Uses on_demand rate limits first, then falls back to flex tier if exceeded

  For more details about service tiers and their benefits, see [Groq's Flex Processing documentation](https://console.groq.com/docs/flex-processing).

<Note>Only Groq reasoning models support the `reasoningFormat` option.</Note>

#### Structured Outputs

Structured outputs are enabled by default for Groq models.
You can disable them by setting the `structuredOutputs` option to `false`.

```ts
import { groq } from '@ai-sdk/groq';
import { generateObject } from 'ai';
import { z } from 'zod';

const result = await generateObject({
  model: groq('moonshotai/kimi-k2-instruct-0905'),
  schema: z.object({
    recipe: z.object({
      name: z.string(),
      ingredients: z.array(z.string()),
      instructions: z.array(z.string()),
    }),
  }),
  prompt: 'Generate a simple pasta recipe.',
});

console.log(JSON.stringify(result.object, null, 2));
```

You can disable structured outputs for models that don't support them:

```ts highlight="9"
import { groq } from '@ai-sdk/groq';
import { generateObject } from 'ai';
import { z } from 'zod';

const result = await generateObject({
  model: groq('gemma2-9b-it'),
  providerOptions: {
    groq: {
      structuredOutputs: false,
    },
  },
  schema: z.object({
    recipe: z.object({
      name: z.string(),
      ingredients: z.array(z.string()),
      instructions: z.array(z.string()),
    }),
  }),
  prompt: 'Generate a simple pasta recipe in JSON format.',
});

console.log(JSON.stringify(result.object, null, 2));
```

<Note type="warning">
  Structured outputs are only supported by newer Groq models like
  `moonshotai/kimi-k2-instruct-0905`. For unsupported models, you can disable
  structured outputs by setting `structuredOutputs: false`. When disabled, Groq
  uses the `json_object` format which requires the word "JSON" to be included in
  your messages.
</Note>

### Example

You can use Groq language models to generate text with the `generateText` function:

```ts
import { groq } from '@ai-sdk/groq';
import { generateText } from 'ai';

const { text } = await generateText({
  model: groq('gemma2-9b-it'),
  prompt: 'Write a vegetarian lasagna recipe for 4 people.',
});
```

### Image Input

Groq's multi-modal models like `meta-llama/llama-4-scout-17b-16e-instruct` support image inputs. You can include images in your messages using either URLs or base64-encoded data:

```ts
import { groq } from '@ai-sdk/groq';
import { generateText } from 'ai';

const { text } = await generateText({
  model: groq('meta-llama/llama-4-scout-17b-16e-instruct'),
  messages: [
    {
      role: 'user',
      content: [
        { type: 'text', text: 'What do you see in this image?' },
        {
          type: 'image',
          image: 'https://example.com/image.jpg',
        },
      ],
    },
  ],
});
```

You can also use base64-encoded images:

```ts
import { groq } from '@ai-sdk/groq';
import { generateText } from 'ai';
import { readFileSync } from 'fs';

const imageData = readFileSync('path/to/image.jpg', 'base64');

const { text } = await generateText({
  model: groq('meta-llama/llama-4-scout-17b-16e-instruct'),
  messages: [
    {
      role: 'user',
      content: [
        { type: 'text', text: 'Describe this image in detail.' },
        {
          type: 'image',
          image: `data:image/jpeg;base64,${imageData}`,
        },
      ],
    },
  ],
});
```

## Model Capabilities

| Model                                           | Image Input         | Object Generation   | Tool Usage          | Tool Streaming      |
| ----------------------------------------------- | ------------------- | ------------------- | ------------------- | ------------------- |
| `gemma2-9b-it`                                  | <Cross size={18} /> | <Check size={18} /> | <Check size={18} /> | <Check size={18} /> |
| `llama-3.1-8b-instant`                          | <Cross size={18} /> | <Check size={18} /> | <Check size={18} /> | <Check size={18} /> |
| `llama-3.3-70b-versatile`                       | <Cross size={18} /> | <Check size={18} /> | <Check size={18} /> | <Check size={18} /> |
| `meta-llama/llama-guard-4-12b`                  | <Check size={18} /> | <Check size={18} /> | <Check size={18} /> | <Check size={18} /> |
| `deepseek-r1-distill-llama-70b`                 | <Cross size={18} /> | <Check size={18} /> | <Check size={18} /> | <Check size={18} /> |
| `meta-llama/llama-4-maverick-17b-128e-instruct` | <Check size={18} /> | <Check size={18} /> | <Check size={18} /> | <Check size={18} /> |
| `meta-llama/llama-4-scout-17b-16e-instruct`     | <Check size={18} /> | <Check size={18} /> | <Check size={18} /> | <Check size={18} /> |
| `meta-llama/llama-prompt-guard-2-22m`           | <Cross size={18} /> | <Check size={18} /> | <Cross size={18} /> | <Cross size={18} /> |
| `meta-llama/llama-prompt-guard-2-86m`           | <Cross size={18} /> | <Check size={18} /> | <Cross size={18} /> | <Cross size={18} /> |
| `moonshotai/kimi-k2-instruct-0905`              | <Cross size={18} /> | <Check size={18} /> | <Check size={18} /> | <Check size={18} /> |
| `qwen/qwen3-32b`                                | <Cross size={18} /> | <Check size={18} /> | <Check size={18} /> | <Check size={18} /> |
| `llama-guard-3-8b`                              | <Cross size={18} /> | <Check size={18} /> | <Check size={18} /> | <Check size={18} /> |
| `llama3-70b-8192`                               | <Cross size={18} /> | <Check size={18} /> | <Check size={18} /> | <Check size={18} /> |
| `llama3-8b-8192`                                | <Cross size={18} /> | <Check size={18} /> | <Check size={18} /> | <Check size={18} /> |
| `mixtral-8x7b-32768`                            | <Cross size={18} /> | <Check size={18} /> | <Check size={18} /> | <Check size={18} /> |
| `qwen-qwq-32b`                                  | <Cross size={18} /> | <Check size={18} /> | <Check size={18} /> | <Check size={18} /> |
| `qwen-2.5-32b`                                  | <Cross size={18} /> | <Check size={18} /> | <Check size={18} /> | <Check size={18} /> |
| `deepseek-r1-distill-qwen-32b`                  | <Cross size={18} /> | <Check size={18} /> | <Check size={18} /> | <Check size={18} /> |
| `openai/gpt-oss-20b`                            | <Cross size={18} /> | <Check size={18} /> | <Check size={18} /> | <Check size={18} /> |
| `openai/gpt-oss-120b`                           | <Cross size={18} /> | <Check size={18} /> | <Check size={18} /> | <Check size={18} /> |

<Note>
  The tables above list the most commonly used models. Please see the [Groq
  docs](https://console.groq.com/docs/models) for a complete list of available
  models. You can also pass any available provider model ID as a string if
  needed.
</Note>

## Browser Search Tool

Groq provides a browser search tool that offers interactive web browsing capabilities. Unlike traditional web search, browser search navigates websites interactively, providing more detailed and comprehensive results.

### Supported Models

Browser search is only available for these specific models:

- `openai/gpt-oss-20b`
- `openai/gpt-oss-120b`

<Note type="warning">
  Browser search will only work with the supported models listed above. Using it
  with other models will generate a warning and the tool will be ignored.
</Note>

### Basic Usage

```ts
import { groq } from '@ai-sdk/groq';
import { generateText } from 'ai';

const result = await generateText({
  model: groq('openai/gpt-oss-120b'), // Must use supported model
  prompt:
    'What are the latest developments in AI? Please search for recent news.',
  tools: {
    browser_search: groq.tools.browserSearch({}),
  },
  toolChoice: 'required', // Ensure the tool is used
});

console.log(result.text);
```

### Streaming Example

```ts
import { groq } from '@ai-sdk/groq';
import { streamText } from 'ai';

const result = streamText({
  model: groq('openai/gpt-oss-120b'),
  prompt: 'Search for the latest tech news and summarize it.',
  tools: {
    browser_search: groq.tools.browserSearch({}),
  },
  toolChoice: 'required',
});

for await (const delta of result.fullStream) {
  if (delta.type === 'text-delta') {
    process.stdout.write(delta.text);
  }
}
```

### Key Features

- **Interactive Browsing**: Navigates websites like a human user
- **Comprehensive Results**: More detailed than traditional search snippets
- **Server-side Execution**: Runs on Groq's infrastructure, no setup required
- **Powered by Exa**: Uses Exa search engine for optimal results
- **Currently Free**: Available at no additional charge during beta

### Best Practices

- Use `toolChoice: 'required'` to ensure the browser search is activated
- Only supported on `openai/gpt-oss-20b` and `openai/gpt-oss-120b` models
- The tool works automatically - no configuration parameters needed
- Server-side execution means no additional API keys or setup required

### Model Validation

The provider automatically validates model compatibility:

```ts
// ✅ Supported - will work
const result = await generateText({
  model: groq('openai/gpt-oss-120b'),
  tools: { browser_search: groq.tools.browserSearch({}) },
});

// ❌ Unsupported - will show warning and ignore tool
const result = await generateText({
  model: groq('gemma2-9b-it'),
  tools: { browser_search: groq.tools.browserSearch({}) },
});
// Warning: "Browser search is only supported on models: openai/gpt-oss-20b, openai/gpt-oss-120b"
```

<Note>
  For more details about browser search capabilities and limitations, see the
  [Groq Browser Search
  Documentation](https://console.groq.com/docs/browser-search).
</Note>

## Transcription Models

You can create models that call the [Groq transcription API](https://console.groq.com/docs/speech-to-text)
using the `.transcription()` factory method.

The first argument is the model id e.g. `whisper-large-v3`.

```ts
const model = groq.transcription('whisper-large-v3');
```

You can also pass additional provider-specific options using the `providerOptions` argument. For example, supplying the input language in ISO-639-1 (e.g. `en`) format will improve accuracy and latency.

```ts highlight="6"
import { experimental_transcribe as transcribe } from 'ai';
import { groq } from '@ai-sdk/groq';
import { readFile } from 'fs/promises';

const result = await transcribe({
  model: groq.transcription('whisper-large-v3'),
  audio: await readFile('audio.mp3'),
  providerOptions: { groq: { language: 'en' } },
});
```

The following provider options are available:

- **timestampGranularities** _string[]_
  The granularity of the timestamps in the transcription.
  Defaults to `['segment']`.
  Possible values are `['word']`, `['segment']`, and `['word', 'segment']`.
  Note: There is no additional latency for segment timestamps, but generating word timestamps incurs additional latency.

- **language** _string_
  The language of the input audio. Supplying the input language in ISO-639-1 format (e.g. 'en') will improve accuracy and latency.
  Optional.

- **prompt** _string_
  An optional text to guide the model's style or continue a previous audio segment. The prompt should match the audio language.
  Optional.

- **temperature** _number_
  The sampling temperature, between 0 and 1. Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic. If set to 0, the model will use log probability to automatically increase the temperature until certain thresholds are hit.
  Defaults to 0.
  Optional.

### Model Capabilities

| Model                    | Transcription       | Duration            | Segments            | Language            |
| ------------------------ | ------------------- | ------------------- | ------------------- | ------------------- |
| `whisper-large-v3`       | <Check size={18} /> | <Check size={18} /> | <Check size={18} /> | <Check size={18} /> |
| `whisper-large-v3-turbo` | <Check size={18} /> | <Check size={18} /> | <Check size={18} /> | <Check size={18} /> |



# Prompts

Prompts are instructions that you give a [large language model (LLM)](/docs/foundations/overview#large-language-models) to tell it what to do.
It's like when you ask someone for directions; the clearer your question, the better the directions you'll get.

Many LLM providers offer complex interfaces for specifying prompts. They involve different roles and message types.
While these interfaces are powerful, they can be hard to use and understand.

In order to simplify prompting, the AI SDK supports text, message, and system prompts.

## Text Prompts

Text prompts are strings.
They are ideal for simple generation use cases,
e.g. repeatedly generating content for variants of the same prompt text.

You can set text prompts using the `prompt` property made available by AI SDK functions like [`streamText`](/docs/reference/ai-sdk-core/stream-text) or [`generateObject`](/docs/reference/ai-sdk-core/generate-object).
You can structure the text in any way and inject variables, e.g. using a template literal.

```ts highlight="3"
const result = await generateText({
  model: __MODEL__,
  prompt: 'Invent a new holiday and describe its traditions.',
});
```

You can also use template literals to provide dynamic data to your prompt.

```ts highlight="3-5"
const result = await generateText({
  model: __MODEL__,
  prompt:
    `I am planning a trip to ${destination} for ${lengthOfStay} days. ` +
    `Please suggest the best tourist activities for me to do.`,
});
```

## System Prompts

System prompts are the initial set of instructions given to models that help guide and constrain the models' behaviors and responses.
You can set system prompts using the `system` property.
System prompts work with both the `prompt` and the `messages` properties.

```ts highlight="3-6"
const result = await generateText({
  model: __MODEL__,
  system:
    `You help planning travel itineraries. ` +
    `Respond to the users' request with a list ` +
    `of the best stops to make in their destination.`,
  prompt:
    `I am planning a trip to ${destination} for ${lengthOfStay} days. ` +
    `Please suggest the best tourist activities for me to do.`,
});
```

<Note>
  When you use a message prompt, you can also use system messages instead of a
  system prompt.
</Note>

## Message Prompts

A message prompt is an array of user, assistant, and tool messages.
They are great for chat interfaces and more complex, multi-modal prompts.
You can use the `messages` property to set message prompts.

Each message has a `role` and a `content` property. The content can either be text (for user and assistant messages), or an array of relevant parts (data) for that message type.

```ts highlight="3-7"
const result = await generateText({
  model: __MODEL__,
  messages: [
    { role: 'user', content: 'Hi!' },
    { role: 'assistant', content: 'Hello, how can I help?' },
    { role: 'user', content: 'Where can I buy the best Currywurst in Berlin?' },
  ],
});
```

Instead of sending a text in the `content` property, you can send an array of parts that includes a mix of text and other content parts.

<Note type="warning">
  Not all language models support all message and content types. For example,
  some models might not be capable of handling multi-modal inputs or tool
  messages. [Learn more about the capabilities of select
  models](./providers-and-models#model-capabilities).
</Note>

### Provider Options

You can pass through additional provider-specific metadata to enable provider-specific functionality at 3 levels.

#### Function Call Level

Functions like [`streamText`](/docs/reference/ai-sdk-core/stream-text#provider-options) or [`generateText`](/docs/reference/ai-sdk-core/generate-text#provider-options) accept a `providerOptions` property.

Adding provider options at the function call level should be used when you do not need granular control over where the provider options are applied.

```ts
const { text } = await generateText({
  model: azure('your-deployment-name'),
  providerOptions: {
    openai: {
      reasoningEffort: 'low',
    },
  },
});
```

#### Message Level

For granular control over applying provider options at the message level, you can pass `providerOptions` to the message object:

```ts
import { ModelMessage } from 'ai';

const messages: ModelMessage[] = [
  {
    role: 'system',
    content: 'Cached system message',
    providerOptions: {
      // Sets a cache control breakpoint on the system message
      anthropic: { cacheControl: { type: 'ephemeral' } },
    },
  },
];
```

#### Message Part Level

Certain provider-specific options require configuration at the message part level:

```ts
import { ModelMessage } from 'ai';

const messages: ModelMessage[] = [
  {
    role: 'user',
    content: [
      {
        type: 'text',
        text: 'Describe the image in detail.',
        providerOptions: {
          openai: { imageDetail: 'low' },
        },
      },
      {
        type: 'image',
        image:
          'https://github.com/vercel/ai/blob/main/examples/ai-core/data/comic-cat.png?raw=true',
        // Sets image detail configuration for image part:
        providerOptions: {
          openai: { imageDetail: 'low' },
        },
      },
    ],
  },
];
```

<Note type="warning">
  AI SDK UI hooks like [`useChat`](/docs/reference/ai-sdk-ui/use-chat) return
  arrays of `UIMessage` objects, which do not support provider options. We
  recommend using the
  [`convertToModelMessages`](/docs/reference/ai-sdk-ui/convert-to-core-messages)
  function to convert `UIMessage` objects to
  [`ModelMessage`](/docs/reference/ai-sdk-core/model-message) objects before
  applying or appending message(s) or message parts with `providerOptions`.
</Note>

### User Messages

#### Text Parts

Text content is the most common type of content. It is a string that is passed to the model.

If you only need to send text content in a message, the `content` property can be a string,
but you can also use it to send multiple content parts.

```ts highlight="7-10"
const result = await generateText({
  model: __MODEL__,
  messages: [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: 'Where can I buy the best Currywurst in Berlin?',
        },
      ],
    },
  ],
});
```

#### Image Parts

User messages can include image parts. An image can be one of the following:

- base64-encoded image:
  - `string` with base-64 encoded content
  - data URL `string`, e.g. `data:image/png;base64,...`
- binary image:
  - `ArrayBuffer`
  - `Uint8Array`
  - `Buffer`
- URL:
  - http(s) URL `string`, e.g. `https://example.com/image.png`
  - `URL` object, e.g. `new URL('https://example.com/image.png')`

##### Example: Binary image (Buffer)

```ts highlight="8-11"
const result = await generateText({
  model,
  messages: [
    {
      role: 'user',
      content: [
        { type: 'text', text: 'Describe the image in detail.' },
        {
          type: 'image',
          image: fs.readFileSync('./data/comic-cat.png'),
        },
      ],
    },
  ],
});
```

##### Example: Base-64 encoded image (string)

```ts highlight="8-11"
const result = await generateText({
  model: __MODEL__,
  messages: [
    {
      role: 'user',
      content: [
        { type: 'text', text: 'Describe the image in detail.' },
        {
          type: 'image',
          image: fs.readFileSync('./data/comic-cat.png').toString('base64'),
        },
      ],
    },
  ],
});
```

##### Example: Image URL (string)

```ts highlight="8-12"
const result = await generateText({
  model: __MODEL__,
  messages: [
    {
      role: 'user',
      content: [
        { type: 'text', text: 'Describe the image in detail.' },
        {
          type: 'image',
          image:
            'https://github.com/vercel/ai/blob/main/examples/ai-core/data/comic-cat.png?raw=true',
        },
      ],
    },
  ],
});
```

#### File Parts

<Note type="warning">
  Only a few providers and models currently support file parts: [Google
  Generative AI](/providers/ai-sdk-providers/google-generative-ai), [Google
  Vertex AI](/providers/ai-sdk-providers/google-vertex),
  [OpenAI](/providers/ai-sdk-providers/openai) (for `wav` and `mp3` audio with
  `gpt-4o-audio-preview`), [Anthropic](/providers/ai-sdk-providers/anthropic),
  [OpenAI](/providers/ai-sdk-providers/openai) (for `pdf`).
</Note>

User messages can include file parts. A file can be one of the following:

- base64-encoded file:
  - `string` with base-64 encoded content
  - data URL `string`, e.g. `data:image/png;base64,...`
- binary data:
  - `ArrayBuffer`
  - `Uint8Array`
  - `Buffer`
- URL:
  - http(s) URL `string`, e.g. `https://example.com/some.pdf`
  - `URL` object, e.g. `new URL('https://example.com/some.pdf')`

You need to specify the MIME type of the file you are sending.

##### Example: PDF file from Buffer

```ts highlight="12-15"
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

const result = await generateText({
  model: google('gemini-1.5-flash'),
  messages: [
    {
      role: 'user',
      content: [
        { type: 'text', text: 'What is the file about?' },
        {
          type: 'file',
          mediaType: 'application/pdf',
          data: fs.readFileSync('./data/example.pdf'),
          filename: 'example.pdf', // optional, not used by all providers
        },
      ],
    },
  ],
});
```

##### Example: mp3 audio file from Buffer

```ts highlight="12-14"
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

const result = await generateText({
  model: openai('gpt-4o-audio-preview'),
  messages: [
    {
      role: 'user',
      content: [
        { type: 'text', text: 'What is the audio saying?' },
        {
          type: 'file',
          mediaType: 'audio/mpeg',
          data: fs.readFileSync('./data/galileo.mp3'),
        },
      ],
    },
  ],
});
```

#### Custom Download Function (Experimental)

You can use custom download functions to implement throttling, retries, authentication, caching, and more.

The default download implementation automatically downloads files in parallel when they are not supported by the model.

Custom download function can be passed via the `experimental_download` property:

```ts
const result = await generateText({
  model: __MODEL__,
  experimental_download: async (
    requestedDownloads: Array<{
      url: URL;
      isUrlSupportedByModel: boolean;
    }>,
  ): PromiseLike<
    Array<{
      data: Uint8Array;
      mediaType: string | undefined;
    } | null>
  > => {
    // ... download the files and return an array with similar order
  },
  messages: [
    {
      role: 'user',
      content: [
        {
          type: 'file',
          data: new URL('https://api.company.com/private/document.pdf'),
          mediaType: 'application/pdf',
        },
      ],
    },
  ],
});
```

<Note>
  The `experimental_download` option is experimental and may change in future
  releases.
</Note>

### Assistant Messages

Assistant messages are messages that have a role of `assistant`.
They are typically previous responses from the assistant
and can contain text, reasoning, and tool call parts.

#### Example: Assistant message with text content

```ts highlight="5"
const result = await generateText({
  model: __MODEL__,
  messages: [
    { role: 'user', content: 'Hi!' },
    { role: 'assistant', content: 'Hello, how can I help?' },
  ],
});
```

#### Example: Assistant message with text content in array

```ts highlight="7"
const result = await generateText({
  model: __MODEL__,
  messages: [
    { role: 'user', content: 'Hi!' },
    {
      role: 'assistant',
      content: [{ type: 'text', text: 'Hello, how can I help?' }],
    },
  ],
});
```

#### Example: Assistant message with tool call content

```ts highlight="7-14"
const result = await generateText({
  model: __MODEL__,
  messages: [
    { role: 'user', content: 'How many calories are in this block of cheese?' },
    {
      role: 'assistant',
      content: [
        {
          type: 'tool-call',
          toolCallId: '12345',
          toolName: 'get-nutrition-data',
          input: { cheese: 'Roquefort' },
        },
      ],
    },
  ],
});
```

#### Example: Assistant message with file content

<Note>
  This content part is for model-generated files. Only a few models support
  this, and only for file types that they can generate.
</Note>

```ts highlight="9-11"
const result = await generateText({
  model: __MODEL__,
  messages: [
    { role: 'user', content: 'Generate an image of a roquefort cheese!' },
    {
      role: 'assistant',
      content: [
        {
          type: 'file',
          mediaType: 'image/png',
          data: fs.readFileSync('./data/roquefort.jpg'),
        },
      ],
    },
  ],
});
```

### Tool messages

<Note>
  [Tools](/docs/foundations/tools) (also known as function calling) are programs
  that you can provide an LLM to extend its built-in functionality. This can be
  anything from calling an external API to calling functions within your UI.
  Learn more about Tools in [the next section](/docs/foundations/tools).
</Note>

For models that support [tool](/docs/foundations/tools) calls, assistant messages can contain tool call parts, and tool messages can contain tool output parts.
A single assistant message can call multiple tools, and a single tool message can contain multiple tool results.

```ts highlight="14-42"
const result = await generateText({
  model: __MODEL__,
  messages: [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: 'How many calories are in this block of cheese?',
        },
        { type: 'image', image: fs.readFileSync('./data/roquefort.jpg') },
      ],
    },
    {
      role: 'assistant',
      content: [
        {
          type: 'tool-call',
          toolCallId: '12345',
          toolName: 'get-nutrition-data',
          input: { cheese: 'Roquefort' },
        },
        // there could be more tool calls here (parallel calling)
      ],
    },
    {
      role: 'tool',
      content: [
        {
          type: 'tool-result',
          toolCallId: '12345', // needs to match the tool call id
          toolName: 'get-nutrition-data',
          output: {
            type: 'json',
            value: {
              name: 'Cheese, roquefort',
              calories: 369,
              fat: 31,
              protein: 22,
            },
          },
        },
        // there could be more tool results here (parallel calling)
      ],
    },
  ],
});
```

#### Multi-modal Tool Results

<Note type="warning">
  Multi-part tool results are experimental and only supported by Anthropic.
</Note>

Tool results can be multi-part and multi-modal, e.g. a text and an image.
You can use the `experimental_content` property on tool parts to specify multi-part tool results.

```ts highlight="24-46"
const result = await generateText({
  model: __MODEL__,
  messages: [
    // ...
    {
      role: 'tool',
      content: [
        {
          type: 'tool-result',
          toolCallId: '12345', // needs to match the tool call id
          toolName: 'get-nutrition-data',
          // for models that do not support multi-part tool results,
          // you can include a regular output part:
          output: {
            type: 'json',
            value: {
              name: 'Cheese, roquefort',
              calories: 369,
              fat: 31,
              protein: 22,
            },
          },
        },
        {
          type: 'tool-result',
          toolCallId: '12345', // needs to match the tool call id
          toolName: 'get-nutrition-data',
          // for models that support multi-part tool results,
          // you can include a multi-part content part:
          output: {
            type: 'content',
            value: [
              {
                type: 'text',
                text: 'Here is an image of the nutrition data for the cheese:',
              },
              {
                type: 'media',
                data: fs
                  .readFileSync('./data/roquefort-nutrition-data.png')
                  .toString('base64'),
                mediaType: 'image/png',
              },
            ],
          },
        },
      ],
    },
  ],
});
```

### System Messages

System messages are messages that are sent to the model before the user messages to guide the assistant's behavior.
You can alternatively use the `system` property.

```ts highlight="4"
const result = await generateText({
  model: __MODEL__,
  messages: [
    { role: 'system', content: 'You help planning travel itineraries.' },
    {
      role: 'user',
      content:
        'I am planning a trip to Berlin for 3 days. Please suggest the best tourist activities for me to do.',
    },
  ],
});
```


# Tools

While [large language models (LLMs)](/docs/foundations/overview#large-language-models) have incredible generation capabilities,
they struggle with discrete tasks (e.g. mathematics) and interacting with the outside world (e.g. getting the weather).

Tools are actions that an LLM can invoke.
The results of these actions can be reported back to the LLM to be considered in the next response.

For example, when you ask an LLM for the "weather in London", and there is a weather tool available, it could call a tool
with London as the argument. The tool would then fetch the weather data and return it to the LLM. The LLM can then use this
information in its response.

## What is a tool?

A tool is an object that can be called by the model to perform a specific task.
You can use tools with [`generateText`](/docs/reference/ai-sdk-core/generate-text)
and [`streamText`](/docs/reference/ai-sdk-core/stream-text) by passing one or more tools to the `tools` parameter.

A tool consists of three properties:

- **`description`**: An optional description of the tool that can influence when the tool is picked.
- **`inputSchema`**: A [Zod schema](/docs/foundations/tools#schema-specification-and-validation-with-zod) or a [JSON schema](/docs/reference/ai-sdk-core/json-schema) that defines the input required for the tool to run. The schema is consumed by the LLM, and also used to validate the LLM tool calls.
- **`execute`**: An optional async function that is called with the arguments from the tool call.

<Note>
  `streamUI` uses UI generator tools with a `generate` function that can return
  React components.
</Note>

If the LLM decides to use a tool, it will generate a tool call.
Tools with an `execute` function are run automatically when these calls are generated.
The output of the tool calls are returned using tool result objects.

You can automatically pass tool results back to the LLM
using [multi-step calls](/docs/ai-sdk-core/tools-and-tool-calling#multi-step-calls) with `streamText` and `generateText`.

## Schemas

Schemas are used to define and validate the [tool input](/docs/ai-sdk-core/tools-and-tool-calling), tools outputs, and structured output generation.

The AI SDK supports the following schemas:

- [Zod](https://zod.dev/) v3 and v4 directly or via [`zodSchema()`](/docs/reference/ai-sdk-core/zod-schema)
- [Valibot](https://valibot.dev/) via [`valibotSchema()`](/docs/reference/ai-sdk-core/valibot-schema) from `@ai-sdk/valibot`
- [Standard JSON Schema](https://standardschema.dev/json-schema) compatible schemas
- Raw JSON schemas via [`jsonSchema()`](/docs/reference/ai-sdk-core/json-schema)

<Note>
  You can also use schemas for structured output generation with
  [`generateText`](/docs/reference/ai-sdk-core/generate-text) and
  [`streamText`](/docs/reference/ai-sdk-core/stream-text) using the `output`
  setting.
</Note>

## Tool Packages

Given tools are JavaScript objects, they can be packaged and distributed through npm like any other library. This makes it easy to share reusable tools across projects and with the community.

### Using Ready-Made Tool Packages

Install a tool package and import the tools you need:

```bash
pnpm add some-tool-package
```

Then pass them directly to `generateText`, `streamText`, or your agent definition:

```ts highlight="2, 8"
import { generateText, stepCountIs } from 'ai';
import { searchTool } from 'some-tool-package';

const { text } = await generateText({
  model: 'anthropic/claude-haiku-4.5',
  prompt: 'When was Vercel Ship AI?',
  tools: {
    webSearch: searchTool,
  },
  stopWhen: stepCountIs(10),
});
```

### Publishing Your Own Tools

You can publish your own tool packages to npm for others to use. Simply export your tool objects from your package:

```ts
// my-tools/index.ts
export const myTool = {
  description: 'A helpful tool',
  inputSchema: z.object({
    query: z.string(),
  }),
  execute: async ({ query }) => {
    // your tool logic
    return result;
  },
};
```

Anyone can then install and use your tools by importing them.

To get started, you can use the [AI SDK Tool Package Template](https://github.com/vercel-labs/ai-sdk-tool-as-package-template) which provides a ready-to-use starting point for publishing your own tools.

## Toolsets

When you work with tools, you typically need a mix of application-specific tools and general-purpose tools. The community has created various toolsets and resources to help you build and use tools.

### Ready-to-Use Tool Packages

These packages provide pre-built tools you can install and use immediately:

- **[@exalabs/ai-sdk](https://www.npmjs.com/package/@exalabs/ai-sdk)** - Web search tool that lets AI search the web and get real-time information.
- **[@parallel-web/ai-sdk-tools](https://www.npmjs.com/package/@parallel-web/ai-sdk-tools)** - Web search and extract tools powered by Parallel Web API for real-time information and content extraction.
- **[@perplexity-ai/ai-sdk](https://www.npmjs.com/package/@perplexity-ai/ai-sdk)** - Search the web with real-time results and advanced filtering powered by Perplexity's Search API.
- **[@tavily/ai-sdk](https://www.npmjs.com/package/@tavily/ai-sdk)** - Search, extract, crawl, and map tools for enterprise-grade agents to explore the web in real-time.
- **[Stripe agent tools](https://docs.stripe.com/agents?framework=vercel)** - Tools for interacting with Stripe.
- **[StackOne ToolSet](https://docs.stackone.com/agents/typescript/frameworks/vercel-ai-sdk)** - Agentic integrations for hundreds of [enterprise SaaS](https://www.stackone.com/integrations) platforms.
- **[agentic](https://docs.agentic.so/marketplace/ts-sdks/ai-sdk)** - A collection of 20+ tools that connect to external APIs such as [Exa](https://exa.ai/) or [E2B](https://e2b.dev/).
- **[Amazon Bedrock AgentCore](https://github.com/aws/bedrock-agentcore-sdk-typescript)** - Fully managed AI agent services including [**Browser**](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/built-in-tools.html) (a fast and secure cloud-based browser runtime to enable agents to interact with web applications, fill forms, navigate websites, and extract information) and [**Code Interpreter**](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/built-in-tools.html) (an isolated sandbox environment for agents to execute code in Python, JavaScript, and TypeScript, enhancing accuracy and expanding ability to solve complex end-to-end tasks).
- **[@airweave/vercel-ai-sdk](https://www.npmjs.com/package/@airweave/vercel-ai-sdk)** - Unified semantic search across 35+ data sources (Notion, Slack, Google Drive, databases, and more) for AI agents.
- **[Composio](https://docs.composio.dev/providers/vercel)** - 250+ tools like GitHub, Gmail, Salesforce and [more](https://composio.dev/tools).
- **[JigsawStack](http://www.jigsawstack.com/docs/integration/vercel)** - Over 30+ small custom fine-tuned models available for specific uses.
- **[AI Tools Registry](https://ai-tools-registry.vercel.app)** - A Shadcn-compatible tool definitions and components registry for the AI SDK.
- **[Toolhouse](https://docs.toolhouse.ai/toolhouse/toolhouse-sdk/using-vercel-ai)** - AI function-calling in 3 lines of code for over 25 different actions.

### MCP Tools

These are pre-built tools available as MCP servers:

- **[Smithery](https://smithery.ai/docs/integrations/vercel_ai_sdk)** - An open marketplace of 6,000+ MCPs, including [Browserbase](https://browserbase.com/) and [Exa](https://exa.ai/).
- **[Pipedream](https://pipedream.com/docs/connect/mcp/ai-frameworks/vercel-ai-sdk)** - Developer toolkit that lets you easily add 3,000+ integrations to your app or AI agent.
- **[Apify](https://docs.apify.com/platform/integrations/vercel-ai-sdk)** - Apify provides a [marketplace](https://apify.com/store) of thousands of tools for web scraping, data extraction, and browser automation.

### Tool Building Tutorials

These tutorials and guides help you build your own tools that integrate with specific services:

- **[browserbase](https://docs.browserbase.com/integrations/vercel/introduction#vercel-ai-integration)** - Tutorial for building browser tools that run a headless browser.
- **[browserless](https://docs.browserless.io/ai-integrations/vercel-ai-sdk)** - Guide for integrating browser automation (self-hosted or cloud-based).
- **[AI Tool Maker](https://github.com/nihaocami/ai-tool-maker)** - A CLI utility to generate AI SDK tools from OpenAPI specs.
- **[Interlify](https://www.interlify.com/docs/integrate-with-vercel-ai)** - Guide for converting APIs into tools.
- **[DeepAgent](https://deepagent.amardeep.space/docs/vercel-ai-sdk)** - A suite of 50+ AI tools and integrations, seamlessly connecting with APIs like Tavily, E2B, Airtable and [more](https://deepagent.amardeep.space/docs).

<Note>
  Do you have open source tools or tool libraries that are compatible with the
  AI SDK? Please [file a pull request](https://github.com/vercel/ai/pulls) to
  add them to this list.
</Note>

## Learn more

The AI SDK Core [Tool Calling](/docs/ai-sdk-core/tools-and-tool-calling)
and [Agents](/docs/foundations/agents) documentation has more information about tools and tool calling.


# Streaming

Streaming conversational text UIs (like ChatGPT) have gained massive popularity over the past few months. This section explores the benefits and drawbacks of streaming and blocking interfaces.

[Large language models (LLMs)](/docs/foundations/overview#large-language-models) are extremely powerful. However, when generating long outputs, they can be very slow compared to the latency you're likely used to. If you try to build a traditional blocking UI, your users might easily find themselves staring at loading spinners for 5, 10, even up to 40s waiting for the entire LLM response to be generated. This can lead to a poor user experience, especially in conversational applications like chatbots. Streaming UIs can help mitigate this issue by **displaying parts of the response as they become available**.

<div className="grid lg:grid-cols-2 grid-cols-1 gap-4 mt-8">
  <Card
    title="Blocking UI"
    description="Blocking responses wait until the full response is available before displaying it."
  >
    <BrowserIllustration highlight blocking />
  </Card>
  <Card
    title="Streaming UI"
    description="Streaming responses can transmit parts of the response as they become available."
  >
    <BrowserIllustration highlight />
  </Card>
</div>

## Real-world Examples

Here are 2 examples that illustrate how streaming UIs can improve user experiences in a real-world setting – the first uses a blocking UI, while the second uses a streaming UI.

### Blocking UI

<InlinePrompt
  initialInput="Come up with the first 200 characters of the first book in the Harry Potter series."
  blocking
/>

### Streaming UI

<InlinePrompt initialInput="Come up with the first 200 characters of the first book in the Harry Potter series." />

As you can see, the streaming UI is able to start displaying the response much faster than the blocking UI. This is because the blocking UI has to wait for the entire response to be generated before it can display anything, while the streaming UI can display parts of the response as they become available.

While streaming interfaces can greatly enhance user experiences, especially with larger language models, they aren't always necessary or beneficial. If you can achieve your desired functionality using a smaller, faster model without resorting to streaming, this route can often lead to simpler and more manageable development processes.

However, regardless of the speed of your model, the AI SDK is designed to make implementing streaming UIs as simple as possible. In the example below, we stream text generation from OpenAI's `gpt-4.1` in under 10 lines of code using the SDK's [`streamText`](/docs/reference/ai-sdk-core/stream-text) function:

```ts
import { streamText } from 'ai';
__PROVIDER_IMPORT__;

const { textStream } = streamText({
  model: __MODEL__,
  prompt: 'Write a poem about embedding models.',
});

for await (const textPart of textStream) {
  console.log(textPart);
}
```

For an introduction to streaming UIs and the AI SDK, check out our [Getting Started guides](/docs/getting-started).


# Next.js App Router Quickstart

The AI SDK is a powerful Typescript library designed to help developers build AI-powered applications.

In this quickstart tutorial, you'll build a simple agent with a streaming chat user interface. Along the way, you'll learn key concepts and techniques that are fundamental to using the AI SDK in your own projects.

If you are unfamiliar with the concepts of [Prompt Engineering](/docs/advanced/prompt-engineering) and [HTTP Streaming](/docs/advanced/why-streaming), you can optionally read these documents first.

## Prerequisites

To follow this quickstart, you'll need:

- Node.js 18+ and pnpm installed on your local development machine.
- A [ Vercel AI Gateway ](https://vercel.com/ai-gateway) API key.

If you haven't obtained your Vercel AI Gateway API key, you can do so by [signing up](https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fai&title=Go+to+AI+Gateway) on the Vercel website.

## Create Your Application

Start by creating a new Next.js application. This command will create a new directory named `my-ai-app` and set up a basic Next.js application inside it.

<div className="mb-4">
  <Note>
    Be sure to select yes when prompted to use the App Router and Tailwind CSS.
    If you are looking for the Next.js Pages Router quickstart guide, you can
    find it [here](/docs/getting-started/nextjs-pages-router).
  </Note>
</div>

<Snippet text="pnpm create next-app@latest my-ai-app" />

Navigate to the newly created directory:

<Snippet text="cd my-ai-app" />

### Install dependencies

Install `ai` and `@ai-sdk/react`, the AI package and AI SDK's React hooks. The AI SDK's [ Vercel AI Gateway provider ](/providers/ai-sdk-providers/ai-gateway) ships with the `ai` package. You'll also install `zod`, a schema validation library used for defining tool inputs.

<Note>
  This guide uses the Vercel AI Gateway provider so you can access hundreds of
  models from different providers with one API key, but you can switch to any
  provider or model by installing its package. Check out available [AI SDK
  providers](/providers/ai-sdk-providers) for more information.
</Note>

<div className="my-4">
  <Tabs items={['pnpm', 'npm', 'yarn', 'bun']}>
    <Tab>
      <Snippet text="pnpm add ai@beta @ai-sdk/react@beta zod" dark />
    </Tab>
    <Tab>
      <Snippet text="npm install ai@beta @ai-sdk/react@beta zod" dark />
    </Tab>
    <Tab>
      <Snippet text="yarn add ai@beta @ai-sdk/react@beta zod" dark />
    </Tab>

    <Tab>
      <Snippet text="bun add ai@beta @ai-sdk/react@beta zod" dark />
    </Tab>

  </Tabs>
</div>

### Configure your AI Gateway API key

Create a `.env.local` file in your project root and add your AI Gateway API key. This key authenticates your application with Vercel AI Gateway.

<Snippet text="touch .env.local" />

Edit the `.env.local` file:

```env filename=".env.local"
AI_GATEWAY_API_KEY=xxxxxxxxx
```

Replace `xxxxxxxxx` with your actual Vercel AI Gateway API key.

<Note className="mb-4">
  The AI SDK's Vercel AI Gateway Provider will default to using the
  `AI_GATEWAY_API_KEY` environment variable.
</Note>

## Create a Route Handler

Create a route handler, `app/api/chat/route.ts` and add the following code:

```tsx filename="app/api/chat/route.ts"
import { streamText, UIMessage, convertToModelMessages } from 'ai';
__PROVIDER_IMPORT__;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: __MODEL__,
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
```

Let's take a look at what is happening in this code:

1. Define an asynchronous `POST` request handler and extract `messages` from the body of the request. The `messages` variable contains a history of the conversation between you and the chatbot and provides the chatbot with the necessary context to make the next generation. The `messages` are of UIMessage type, which are designed for use in application UI - they contain the entire message history and associated metadata like timestamps.
2. Call [`streamText`](/docs/reference/ai-sdk-core/stream-text), which is imported from the `ai` package. This function accepts a configuration object that contains a `model` provider and `messages` (defined in step 1). You can pass additional [settings](/docs/ai-sdk-core/settings) to further customise the model's behaviour. The `messages` key expects a `ModelMessage[]` array. This type is different from `UIMessage` in that it does not include metadata, such as timestamps or sender information. To convert between these types, we use the `convertToModelMessages` function, which strips the UI-specific metadata and transforms the `UIMessage[]` array into the `ModelMessage[]` format that the model expects.
3. The `streamText` function returns a [`StreamTextResult`](/docs/reference/ai-sdk-core/stream-text#result-object). This result object contains the [ `toUIMessageStreamResponse` ](/docs/reference/ai-sdk-core/stream-text#to-data-stream-response) function which converts the result to a streamed response object.
4. Finally, return the result to the client to stream the response.

This Route Handler creates a POST request endpoint at `/api/chat`.

## Choosing a Provider

The AI SDK supports dozens of model providers through [first-party](/providers/ai-sdk-providers), [OpenAI-compatible](/providers/openai-compatible-providers), and [ community ](/providers/community-providers) packages.

This quickstart uses the [Vercel AI Gateway](https://vercel.com/ai-gateway) provider, which is the default [global provider](/docs/ai-sdk-core/provider-management#global-provider-configuration). This means you can access models using a simple string in the model configuration:

```ts
model: __MODEL__;
```

You can also explicitly import and use the gateway provider in two other equivalent ways:

```ts
// Option 1: Import from 'ai' package (included by default)
import { gateway } from 'ai';
model: gateway('anthropic/claude-sonnet-4.5');

// Option 2: Install and import from '@ai-sdk/gateway' package
import { gateway } from '@ai-sdk/gateway';
model: gateway('anthropic/claude-sonnet-4.5');
```

### Using other providers

To use a different provider, install its package and create a provider instance. For example, to use OpenAI directly:

<div className="my-4">
  <Tabs items={['pnpm', 'npm', 'yarn', 'bun']}>
    <Tab>
      <Snippet text="pnpm add @ai-sdk/openai@beta" dark />
    </Tab>
    <Tab>
      <Snippet text="npm install @ai-sdk/openai@beta" dark />
    </Tab>
    <Tab>
      <Snippet text="yarn add @ai-sdk/openai@beta" dark />
    </Tab>

    <Tab>
      <Snippet text="bun add @ai-sdk/openai@beta" dark />
    </Tab>

  </Tabs>
</div>

```ts
import { openai } from '@ai-sdk/openai';

model: openai('gpt-5.1');
```

#### Updating the global provider

You can change the default global provider so string model references use your preferred provider everywhere in your application. Learn more about [provider management](/docs/ai-sdk-core/provider-management#global-provider-configuration).

Pick the approach that best matches how you want to manage providers across your application.

## Wire up the UI

Now that you have a Route Handler that can query an LLM, it's time to setup your frontend. The AI SDK's [ UI ](/docs/ai-sdk-ui) package abstracts the complexity of a chat interface into one hook, [`useChat`](/docs/reference/ai-sdk-ui/use-chat).

Update your root page (`app/page.tsx`) with the following code to show a list of chat messages and provide a user message input:

```tsx filename="app/page.tsx"
'use client';

import { useChat } from '@ai-sdk/react';
import { useState } from 'react';

export default function Chat() {
  const [input, setInput] = useState('');
  const { messages, sendMessage } = useChat();
  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
      {messages.map(message => (
        <div key={message.id} className="whitespace-pre-wrap">
          {message.role === 'user' ? 'User: ' : 'AI: '}
          {message.parts.map((part, i) => {
            switch (part.type) {
              case 'text':
                return <div key={`${message.id}-${i}`}>{part.text}</div>;
            }
          })}
        </div>
      ))}

      <form
        onSubmit={e => {
          e.preventDefault();
          sendMessage({ text: input });
          setInput('');
        }}
      >
        <input
          className="fixed dark:bg-zinc-900 bottom-0 w-full max-w-md p-2 mb-8 border border-zinc-300 dark:border-zinc-800 rounded shadow-xl"
          value={input}
          placeholder="Say something..."
          onChange={e => setInput(e.currentTarget.value)}
        />
      </form>
    </div>
  );
}
```

<Note>
  Make sure you add the `"use client"` directive to the top of your file. This
  allows you to add interactivity with Javascript.
</Note>

This page utilizes the `useChat` hook, which will, by default, use the `POST` API route you created earlier (`/api/chat`). The hook provides functions and state for handling user input and form submission. The `useChat` hook provides multiple utility functions and state variables:

- `messages` - the current chat messages (an array of objects with `id`, `role`, and `parts` properties).
- `sendMessage` - a function to send a message to the chat API.

The component uses local state (`useState`) to manage the input field value, and handles form submission by calling `sendMessage` with the input text and then clearing the input field.

The LLM's response is accessed through the message `parts` array. Each message contains an ordered array of `parts` that represents everything the model generated in its response. These parts can include plain text, reasoning tokens, and more that you will see later. The `parts` array preserves the sequence of the model's outputs, allowing you to display or process each component in the order it was generated.

## Running Your Application

With that, you have built everything you need for your chatbot! To start your application, use the command:

<Snippet text="pnpm run dev" />

Head to your browser and open http://localhost:3000. You should see an input field. Test it out by entering a message and see the AI chatbot respond in real-time! The AI SDK makes it fast and easy to build AI chat interfaces with Next.js.

## Enhance Your Chatbot with Tools

While large language models (LLMs) have incredible generation capabilities, they struggle with discrete tasks (e.g. mathematics) and interacting with the outside world (e.g. getting the weather). This is where [tools](/docs/ai-sdk-core/tools-and-tool-calling) come in.

Tools are actions that an LLM can invoke. The results of these actions can be reported back to the LLM to be considered in the next response.

For example, if a user asks about the current weather, without tools, the model would only be able to provide general information based on its training data. But with a weather tool, it can fetch and provide up-to-date, location-specific weather information.

Let's enhance your chatbot by adding a simple weather tool.

### Update Your Route Handler

Modify your `app/api/chat/route.ts` file to include the new weather tool:

```tsx filename="app/api/chat/route.ts" highlight="2,13-27"
import { streamText, UIMessage, convertToModelMessages, tool } from 'ai';
__PROVIDER_IMPORT__;
import { z } from 'zod';

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: __MODEL__,
    messages: await convertToModelMessages(messages),
    tools: {
      weather: tool({
        description: 'Get the weather in a location (fahrenheit)',
        inputSchema: z.object({
          location: z.string().describe('The location to get the weather for'),
        }),
        execute: async ({ location }) => {
          const temperature = Math.round(Math.random() * (90 - 32) + 32);
          return {
            location,
            temperature,
          };
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
```

In this updated code:

1. You import the `tool` function from the `ai` package and `z` from `zod` for schema validation.
2. You define a `tools` object with a `weather` tool. This tool:

   - Has a description that helps the model understand when to use it.
   - Defines `inputSchema` using a Zod schema, specifying that it requires a `location` string to execute this tool. The model will attempt to extract this input from the context of the conversation. If it can't, it will ask the user for the missing information.
   - Defines an `execute` function that simulates getting weather data (in this case, it returns a random temperature). This is an asynchronous function running on the server so you can fetch real data from an external API.

Now your chatbot can "fetch" weather information for any location the user asks about. When the model determines it needs to use the weather tool, it will generate a tool call with the necessary input. The `execute` function will then be automatically run, and the tool output will be added to the `messages` as a `tool` message.

Try asking something like "What's the weather in New York?" and see how the model uses the new tool.

Notice the blank response in the UI? This is because instead of generating a text response, the model generated a tool call. You can access the tool call and subsequent tool result on the client via the `tool-weather` part of the `message.parts` array.

<Note>
  Tool parts are always named `tool-{toolName}`, where `{toolName}` is the key
  you used when defining the tool. In this case, since we defined the tool as
  `weather`, the part type is `tool-weather`.
</Note>

### Update the UI

To display the tool invocation in your UI, update your `app/page.tsx` file:

```tsx filename="app/page.tsx" highlight="16-21"
'use client';

import { useChat } from '@ai-sdk/react';
import { useState } from 'react';

export default function Chat() {
  const [input, setInput] = useState('');
  const { messages, sendMessage } = useChat();
  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
      {messages.map(message => (
        <div key={message.id} className="whitespace-pre-wrap">
          {message.role === 'user' ? 'User: ' : 'AI: '}
          {message.parts.map((part, i) => {
            switch (part.type) {
              case 'text':
                return <div key={`${message.id}-${i}`}>{part.text}</div>;
              case 'tool-weather':
                return (
                  <pre key={`${message.id}-${i}`}>
                    {JSON.stringify(part, null, 2)}
                  </pre>
                );
            }
          })}
        </div>
      ))}

      <form
        onSubmit={e => {
          e.preventDefault();
          sendMessage({ text: input });
          setInput('');
        }}
      >
        <input
          className="fixed dark:bg-zinc-900 bottom-0 w-full max-w-md p-2 mb-8 border border-zinc-300 dark:border-zinc-800 rounded shadow-xl"
          value={input}
          placeholder="Say something..."
          onChange={e => setInput(e.currentTarget.value)}
        />
      </form>
    </div>
  );
}
```

With this change, you're updating the UI to handle different message parts. For text parts, you display the text content as before. For weather tool invocations, you display a JSON representation of the tool call and its result.

Now, when you ask about the weather, you'll see the tool call and its result displayed in your chat interface.

## Enabling Multi-Step Tool Calls

You may have noticed that while the tool is now visible in the chat interface, the model isn't using this information to answer your original query. This is because once the model generates a tool call, it has technically completed its generation.

To solve this, you can enable multi-step tool calls using `stopWhen`. By default, `stopWhen` is set to `stepCountIs(1)`, which means generation stops after the first step when there are tool results. By changing this condition, you can allow the model to automatically send tool results back to itself to trigger additional generations until your specified stopping condition is met. In this case, you want the model to continue generating so it can use the weather tool results to answer your original question.

### Update Your Route Handler

Modify your `app/api/chat/route.ts` file to include the `stopWhen` condition:

```tsx filename="app/api/chat/route.ts"
import {
  streamText,
  UIMessage,
  convertToModelMessages,
  tool,
  stepCountIs,
} from 'ai';
__PROVIDER_IMPORT__;
import { z } from 'zod';

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: __MODEL__,
    messages: await convertToModelMessages(messages),
    stopWhen: stepCountIs(5),
    tools: {
      weather: tool({
        description: 'Get the weather in a location (fahrenheit)',
        inputSchema: z.object({
          location: z.string().describe('The location to get the weather for'),
        }),
        execute: async ({ location }) => {
          const temperature = Math.round(Math.random() * (90 - 32) + 32);
          return {
            location,
            temperature,
          };
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
```

In this updated code:

1. You set `stopWhen` to be when `stepCountIs` 5, allowing the model to use up to 5 "steps" for any given generation.
2. You add an `onStepFinish` callback to log any `toolResults` from each step of the interaction, helping you understand the model's tool usage. This means we can also delete the `toolCall` and `toolResult` `console.log` statements from the previous example.

Head back to the browser and ask about the weather in a location. You should now see the model using the weather tool results to answer your question.

By setting `stopWhen: stepCountIs(5)`, you're allowing the model to use up to 5 "steps" for any given generation. This enables more complex interactions and allows the model to gather and process information over several steps if needed. You can see this in action by adding another tool to convert the temperature from Celsius to Fahrenheit.

### Add another tool

Update your `app/api/chat/route.ts` file to add a new tool to convert the temperature from Fahrenheit to Celsius:

```tsx filename="app/api/chat/route.ts" highlight="34-47"
import {
  streamText,
  UIMessage,
  convertToModelMessages,
  tool,
  stepCountIs,
} from 'ai';
__PROVIDER_IMPORT__;
import { z } from 'zod';

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: __MODEL__,
    messages: await convertToModelMessages(messages),
    stopWhen: stepCountIs(5),
    tools: {
      weather: tool({
        description: 'Get the weather in a location (fahrenheit)',
        inputSchema: z.object({
          location: z.string().describe('The location to get the weather for'),
        }),
        execute: async ({ location }) => {
          const temperature = Math.round(Math.random() * (90 - 32) + 32);
          return {
            location,
            temperature,
          };
        },
      }),
      convertFahrenheitToCelsius: tool({
        description: 'Convert a temperature in fahrenheit to celsius',
        inputSchema: z.object({
          temperature: z
            .number()
            .describe('The temperature in fahrenheit to convert'),
        }),
        execute: async ({ temperature }) => {
          const celsius = Math.round((temperature - 32) * (5 / 9));
          return {
            celsius,
          };
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
```

### Update Your Frontend

update your `app/page.tsx` file to render the new temperature conversion tool:

```tsx filename="app/page.tsx" highlight="21"
'use client';

import { useChat } from '@ai-sdk/react';
import { useState } from 'react';

export default function Chat() {
  const [input, setInput] = useState('');
  const { messages, sendMessage } = useChat();
  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
      {messages.map(message => (
        <div key={message.id} className="whitespace-pre-wrap">
          {message.role === 'user' ? 'User: ' : 'AI: '}
          {message.parts.map((part, i) => {
            switch (part.type) {
              case 'text':
                return <div key={`${message.id}-${i}`}>{part.text}</div>;
              case 'tool-weather':
              case 'tool-convertFahrenheitToCelsius':
                return (
                  <pre key={`${message.id}-${i}`}>
                    {JSON.stringify(part, null, 2)}
                  </pre>
                );
            }
          })}
        </div>
      ))}

      <form
        onSubmit={e => {
          e.preventDefault();
          sendMessage({ text: input });
          setInput('');
        }}
      >
        <input
          className="fixed dark:bg-zinc-900 bottom-0 w-full max-w-md p-2 mb-8 border border-zinc-300 dark:border-zinc-800 rounded shadow-xl"
          value={input}
          placeholder="Say something..."
          onChange={e => setInput(e.currentTarget.value)}
        />
      </form>
    </div>
  );
}
```

This update handles the new `tool-convertFahrenheitToCelsius` part type, displaying the temperature conversion tool calls and results in the UI.

Now, when you ask "What's the weather in New York in celsius?", you should see a more complete interaction:

1. The model will call the weather tool for New York.
2. You'll see the tool output displayed.
3. It will then call the temperature conversion tool to convert the temperature from Fahrenheit to Celsius.
4. The model will then use that information to provide a natural language response about the weather in New York.

This multi-step approach allows the model to gather information and use it to provide more accurate and contextual responses, making your chatbot considerably more useful.

This simple example demonstrates how tools can expand your model's capabilities. You can create more complex tools to integrate with real APIs, databases, or any other external systems, allowing the model to access and process real-world data in real-time. Tools bridge the gap between the model's knowledge cutoff and current information.

## Where to Next?

You've built an AI chatbot using the AI SDK! From here, you have several paths to explore:

- To learn more about the AI SDK, read through the [documentation](/docs).
- If you're interested in diving deeper with guides, check out the [RAG (retrieval-augmented generation)](/docs/guides/rag-chatbot) and [multi-modal chatbot](/docs/guides/multi-modal-chatbot) guides.
- To jumpstart your first AI project, explore available [templates](https://vercel.com/templates?type=ai).


# Next.js Pages Router Quickstart

The AI SDK is a powerful Typescript library designed to help developers build AI-powered applications.

In this quickstart tutorial, you'll build a simple agent with a streaming chat user interface. Along the way, you'll learn key concepts and techniques that are fundamental to using the AI SDK in your own projects.

If you are unfamiliar with the concepts of [Prompt Engineering](/docs/advanced/prompt-engineering) and [HTTP Streaming](/docs/advanced/why-streaming), you can optionally read these documents first.

## Prerequisites

To follow this quickstart, you'll need:

- Node.js 18+ and pnpm installed on your local development machine.
- A [ Vercel AI Gateway ](https://vercel.com/ai-gateway) API key.

If you haven't obtained your Vercel AI Gateway API key, you can do so by [signing up](https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fai&title=Go+to+AI+Gateway) on the Vercel website.

## Setup Your Application

Start by creating a new Next.js application. This command will create a new directory named `my-ai-app` and set up a basic Next.js application inside it.

<Note>
  Be sure to select no when prompted to use the App Router. If you are looking
  for the Next.js App Router quickstart guide, you can find it
  [here](/docs/getting-started/nextjs-app-router).
</Note>

<Snippet text="pnpm create next-app@latest my-ai-app" />

Navigate to the newly created directory:

<Snippet text="cd my-ai-app" />

### Install dependencies

Install `ai` and `@ai-sdk/react`, the AI package and AI SDK's React hooks. The AI SDK's [ Vercel AI Gateway provider ](/providers/ai-sdk-providers/ai-gateway) ships with the `ai` package. You'll also install `zod`, a schema validation library used for defining tool inputs.

<Note>
  This guide uses the Vercel AI Gateway provider so you can access hundreds of
  models from different providers with one API key, but you can switch to any
  provider or model by installing its package. Check out available [AI SDK
  providers](/providers/ai-sdk-providers) for more information.
</Note>

<div className="my-4">
  <Tabs items={['pnpm', 'npm', 'yarn', 'bun']}>
    <Tab>
      <Snippet text="pnpm add ai@beta @ai-sdk/react@beta zod@beta" dark />
    </Tab>
    <Tab>
      <Snippet text="npm install ai@beta @ai-sdk/react@beta zod@beta" dark />
    </Tab>
    <Tab>
      <Snippet text="yarn add ai@beta @ai-sdk/react@beta zod@beta" dark />
    </Tab>

    <Tab>
      <Snippet text="bun add ai@beta @ai-sdk/react@beta zod@beta" dark />
    </Tab>

  </Tabs>
</div>

### Configure your AI Gateway API key

Create a `.env.local` file in your project root and add your AI Gateway API key. This key authenticates your application with the Vercel AI Gateway.

<Snippet text="touch .env.local" />

Edit the `.env.local` file:

```env filename=".env.local"
AI_GATEWAY_API_KEY=xxxxxxxxx
```

Replace `xxxxxxxxx` with your actual Vercel AI Gateway API key.

<Note className="mb-4">
  The AI SDK's Vercel AI Gateway Provider will default to using the
  `AI_GATEWAY_API_KEY` environment variable.
</Note>

## Create a Route Handler

<Note>
  As long as you are on Next.js 13+, you can use Route Handlers (using the App
  Router) alongside the Pages Router. This is recommended to enable you to use
  the Web APIs interface/signature and to better support streaming.
</Note>

Create a Route Handler (`app/api/chat/route.ts`) and add the following code:

```tsx filename="app/api/chat/route.ts"
import { streamText, UIMessage, convertToModelMessages } from 'ai';
__PROVIDER_IMPORT__;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: __MODEL__,
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
```

Let's take a look at what is happening in this code:

1. Define an asynchronous `POST` request handler and extract `messages` from the body of the request. The `messages` variable contains a history of the conversation between you and the chatbot and provides the chatbot with the necessary context to make the next generation. The `messages` are of UIMessage type, which are designed for use in application UI - they contain the entire message history and associated metadata like timestamps.
2. Call [`streamText`](/docs/reference/ai-sdk-core/stream-text), which is imported from the `ai` package. This function accepts a configuration object that contains a `model` provider and `messages` (defined in step 1). You can pass additional [settings](/docs/ai-sdk-core/settings) to further customise the model's behaviour. The `messages` key expects a `ModelMessage[]` array. This type is different from `UIMessage` in that it does not include metadata, such as timestamps or sender information. To convert between these types, we use the `convertToModelMessages` function, which strips the UI-specific metadata and transforms the `UIMessage[]` array into the `ModelMessage[]` format that the model expects.
3. The `streamText` function returns a [`StreamTextResult`](/docs/reference/ai-sdk-core/stream-text#result-object). This result object contains the [ `toUIMessageStreamResponse` ](/docs/reference/ai-sdk-core/stream-text#to-data-stream-response) function which converts the result to a streamed response object.
4. Finally, return the result to the client to stream the response.

This Route Handler creates a POST request endpoint at `/api/chat`.

## Choosing a Provider

The AI SDK supports dozens of model providers through [first-party](/providers/ai-sdk-providers), [OpenAI-compatible](/providers/openai-compatible-providers), and [ community ](/providers/community-providers) packages.

This quickstart uses the [Vercel AI Gateway](https://vercel.com/ai-gateway) provider, which is the default [global provider](/docs/ai-sdk-core/provider-management#global-provider-configuration). This means you can access models using a simple string in the model configuration:

```ts
model: __MODEL__;
```

You can also explicitly import and use the gateway provider in two other equivalent ways:

```ts
// Option 1: Import from 'ai' package (included by default)
import { gateway } from 'ai';
model: gateway('anthropic/claude-sonnet-4.5');

// Option 2: Install and import from '@ai-sdk/gateway' package
import { gateway } from '@ai-sdk/gateway';
model: gateway('anthropic/claude-sonnet-4.5');
```

### Using other providers

To use a different provider, install its package and create a provider instance. For example, to use OpenAI directly:

<div className="my-4">
  <Tabs items={['pnpm', 'npm', 'yarn', 'bun']}>
    <Tab>
      <Snippet text="pnpm add @ai-sdk/openai@beta" dark />
    </Tab>
    <Tab>
      <Snippet text="npm install @ai-sdk/openai@beta" dark />
    </Tab>
    <Tab>
      <Snippet text="yarn add @ai-sdk/openai@beta" dark />
    </Tab>

    <Tab>
      <Snippet text="bun add @ai-sdk/openai@beta" dark />
    </Tab>

  </Tabs>
</div>

```ts
import { openai } from '@ai-sdk/openai';

model: openai('gpt-5.1');
```

#### Updating the global provider

You can change the default global provider so string model references use your preferred provider everywhere in your application. Learn more about [provider management](/docs/ai-sdk-core/provider-management#global-provider-configuration).

Pick the approach that best matches how you want to manage providers across your application.

## Wire up the UI

Now that you have an API route that can query an LLM, it's time to setup your frontend. The AI SDK's [ UI ](/docs/ai-sdk-ui) package abstract the complexity of a chat interface into one hook, [`useChat`](/docs/reference/ai-sdk-ui/use-chat).

Update your root page (`pages/index.tsx`) with the following code to show a list of chat messages and provide a user message input:

```tsx filename="pages/index.tsx"
import { useChat } from '@ai-sdk/react';
import { useState } from 'react';

export default function Chat() {
  const [input, setInput] = useState('');
  const { messages, sendMessage } = useChat();
  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
      {messages.map(message => (
        <div key={message.id} className="whitespace-pre-wrap">
          {message.role === 'user' ? 'User: ' : 'AI: '}
          {message.parts.map((part, i) => {
            switch (part.type) {
              case 'text':
                return <div key={`${message.id}-${i}`}>{part.text}</div>;
            }
          })}
        </div>
      ))}

      <form
        onSubmit={e => {
          e.preventDefault();
          sendMessage({ text: input });
          setInput('');
        }}
      >
        <input
          className="fixed dark:bg-zinc-900 bottom-0 w-full max-w-md p-2 mb-8 border border-zinc-300 dark:border-zinc-800 rounded shadow-xl"
          value={input}
          placeholder="Say something..."
          onChange={e => setInput(e.currentTarget.value)}
        />
      </form>
    </div>
  );
}
```

This page utilizes the `useChat` hook, which will, by default, use the `POST` API route you created earlier (`/api/chat`). The hook provides functions and state for handling user input and form submission. The `useChat` hook provides multiple utility functions and state variables:

- `messages` - the current chat messages (an array of objects with `id`, `role`, and `parts` properties).
- `sendMessage` - a function to send a message to the chat API.

The component uses local state (`useState`) to manage the input field value, and handles form submission by calling `sendMessage` with the input text and then clearing the input field.

The LLM's response is accessed through the message `parts` array. Each message contains an ordered array of `parts` that represents everything the model generated in its response. These parts can include plain text, reasoning tokens, and more that you will see later. The `parts` array preserves the sequence of the model's outputs, allowing you to display or process each component in the order it was generated.

## Running Your Application

With that, you have built everything you need for your chatbot! To start your application, use the command:

<Snippet text="pnpm run dev" />

Head to your browser and open http://localhost:3000. You should see an input field. Test it out by entering a message and see the AI chatbot respond in real-time! The AI SDK makes it fast and easy to build AI chat interfaces with Next.js.

## Enhance Your Chatbot with Tools

While large language models (LLMs) have incredible generation capabilities, they struggle with discrete tasks (e.g. mathematics) and interacting with the outside world (e.g. getting the weather). This is where [tools](/docs/ai-sdk-core/tools-and-tool-calling) come in.

Tools are actions that an LLM can invoke. The results of these actions can be reported back to the LLM to be considered in the next response.

For example, if a user asks about the current weather, without tools, the model would only be able to provide general information based on its training data. But with a weather tool, it can fetch and provide up-to-date, location-specific weather information.

### Update Your Route Handler

Let's start by giving your chatbot a weather tool. Update your Route Handler (`app/api/chat/route.ts`):

```tsx filename="app/api/chat/route.ts"
import { streamText, UIMessage, convertToModelMessages, tool } from 'ai';
__PROVIDER_IMPORT__;
import { z } from 'zod';

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: __MODEL__,
    messages: await convertToModelMessages(messages),
    tools: {
      weather: tool({
        description: 'Get the weather in a location (fahrenheit)',
        inputSchema: z.object({
          location: z.string().describe('The location to get the weather for'),
        }),
        execute: async ({ location }) => {
          const temperature = Math.round(Math.random() * (90 - 32) + 32);
          return {
            location,
            temperature,
          };
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
```

In this updated code:

1. You import the `tool` function from the `ai` package and `z` from `zod` for schema validation.
2. You define a `tools` object with a `weather` tool. This tool:

   - Has a description that helps the model understand when to use it.
   - Defines `inputSchema` using a Zod schema, specifying that it requires a `location` string to execute this tool. The model will attempt to extract this input from the context of the conversation. If it can't, it will ask the user for the missing information.
   - Defines an `execute` function that simulates getting weather data (in this case, it returns a random temperature). This is an asynchronous function running on the server so you can fetch real data from an external API.

Now your chatbot can "fetch" weather information for any location the user asks about. When the model determines it needs to use the weather tool, it will generate a tool call with the necessary input. The `execute` function will then be automatically run, and the tool output will be added to the `messages` as a `tool` message.

Try asking something like "What's the weather in New York?" and see how the model uses the new tool.

Notice the blank response in the UI? This is because instead of generating a text response, the model generated a tool call. You can access the tool call and subsequent tool result on the client via the `tool-weather` part of the `message.parts` array.

<Note>
  Tool parts are always named `tool-{toolName}`, where `{toolName}` is the key
  you used when defining the tool. In this case, since we defined the tool as
  `weather`, the part type is `tool-weather`.
</Note>

### Update the UI

To display the tool invocations in your UI, update your `pages/index.tsx` file:

```tsx filename="pages/index.tsx" highlight="16-21"
import { useChat } from '@ai-sdk/react';
import { useState } from 'react';

export default function Chat() {
  const [input, setInput] = useState('');
  const { messages, sendMessage } = useChat();
  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
      {messages.map(message => (
        <div key={message.id} className="whitespace-pre-wrap">
          {message.role === 'user' ? 'User: ' : 'AI: '}
          {message.parts.map((part, i) => {
            switch (part.type) {
              case 'text':
                return <div key={`${message.id}-${i}`}>{part.text}</div>;
              case 'tool-weather':
                return (
                  <pre key={`${message.id}-${i}`}>
                    {JSON.stringify(part, null, 2)}
                  </pre>
                );
            }
          })}
        </div>
      ))}

      <form
        onSubmit={e => {
          e.preventDefault();
          sendMessage({ text: input });
          setInput('');
        }}
      >
        <input
          className="fixed dark:bg-zinc-900 bottom-0 w-full max-w-md p-2 mb-8 border border-zinc-300 dark:border-zinc-800 rounded shadow-xl"
          value={input}
          placeholder="Say something..."
          onChange={e => setInput(e.currentTarget.value)}
        />
      </form>
    </div>
  );
}
```

With this change, you're updating the UI to handle different message parts. For text parts, you display the text content as before. For weather tool invocations, you display a JSON representation of the tool call and its result.

Now, when you ask about the weather, you'll see the tool call and its result displayed in your chat interface.

## Enabling Multi-Step Tool Calls

You may have noticed that while the tool is now visible in the chat interface, the model isn't using this information to answer your original query. This is because once the model generates a tool call, it has technically completed its generation.

To solve this, you can enable multi-step tool calls using `stopWhen`. By default, `stopWhen` is set to `stepCountIs(1)`, which means generation stops after the first step when there are tool results. By changing this condition, you can allow the model to automatically send tool results back to itself to trigger additional generations until your specified stopping condition is met. In this case, you want the model to continue generating so it can use the weather tool results to answer your original question.

### Update Your Route Handler

Modify your `app/api/chat/route.ts` file to include the `stopWhen` condition:

```tsx filename="app/api/chat/route.ts"
import {
  streamText,
  UIMessage,
  convertToModelMessages,
  tool,
  stepCountIs,
} from 'ai';
__PROVIDER_IMPORT__;
import { z } from 'zod';

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: __MODEL__,
    messages: await convertToModelMessages(messages),
    stopWhen: stepCountIs(5),
    tools: {
      weather: tool({
        description: 'Get the weather in a location (fahrenheit)',
        inputSchema: z.object({
          location: z.string().describe('The location to get the weather for'),
        }),
        execute: async ({ location }) => {
          const temperature = Math.round(Math.random() * (90 - 32) + 32);
          return {
            location,
            temperature,
          };
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
```

Head back to the browser and ask about the weather in a location. You should now see the model using the weather tool results to answer your question.

By setting `stopWhen: stepCountIs(5)`, you're allowing the model to use up to 5 "steps" for any given generation. This enables more complex interactions and allows the model to gather and process information over several steps if needed. You can see this in action by adding another tool to convert the temperature from Celsius to Fahrenheit.

### Add another tool

Update your `app/api/chat/route.ts` file to add a new tool to convert the temperature from Fahrenheit to Celsius:

```tsx filename="app/api/chat/route.ts" highlight="26-39"
import {
  streamText,
  UIMessage,
  convertToModelMessages,
  tool,
  stepCountIs,
} from 'ai';
__PROVIDER_IMPORT__;
import { z } from 'zod';

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: __MODEL__,
    messages: await convertToModelMessages(messages),
    stopWhen: stepCountIs(5),
    tools: {
      weather: tool({
        description: 'Get the weather in a location (fahrenheit)',
        inputSchema: z.object({
          location: z.string().describe('The location to get the weather for'),
        }),
        execute: async ({ location }) => {
          const temperature = Math.round(Math.random() * (90 - 32) + 32);
          return {
            location,
            temperature,
          };
        },
      }),
      convertFahrenheitToCelsius: tool({
        description: 'Convert a temperature in fahrenheit to celsius',
        inputSchema: z.object({
          temperature: z
            .number()
            .describe('The temperature in fahrenheit to convert'),
        }),
        execute: async ({ temperature }) => {
          const celsius = Math.round((temperature - 32) * (5 / 9));
          return {
            celsius,
          };
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
```

### Update Your Frontend

Update your `pages/index.tsx` file to render the new temperature conversion tool:

```tsx filename="pages/index.tsx" highlight="21"
import { useChat } from '@ai-sdk/react';
import { useState } from 'react';

export default function Chat() {
  const [input, setInput] = useState('');
  const { messages, sendMessage } = useChat();
  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
      {messages.map(message => (
        <div key={message.id} className="whitespace-pre-wrap">
          {message.role === 'user' ? 'User: ' : 'AI: '}
          {message.parts.map((part, i) => {
            switch (part.type) {
              case 'text':
                return <div key={`${message.id}-${i}`}>{part.text}</div>;
              case 'tool-weather':
              case 'tool-convertFahrenheitToCelsius':
                return (
                  <pre key={`${message.id}-${i}`}>
                    {JSON.stringify(part, null, 2)}
                  </pre>
                );
            }
          })}
        </div>
      ))}

      <form
        onSubmit={e => {
          e.preventDefault();
          sendMessage({ text: input });
          setInput('');
        }}
      >
        <input
          className="fixed dark:bg-zinc-900 bottom-0 w-full max-w-md p-2 mb-8 border border-zinc-300 dark:border-zinc-800 rounded shadow-xl"
          value={input}
          placeholder="Say something..."
          onChange={e => setInput(e.currentTarget.value)}
        />
      </form>
    </div>
  );
}
```

This update handles the new `tool-convertFahrenheitToCelsius` part type, displaying the temperature conversion tool calls and results in the UI.

Now, when you ask "What's the weather in New York in celsius?", you should see a more complete interaction:

1. The model will call the weather tool for New York.
2. You'll see the tool output displayed.
3. It will then call the temperature conversion tool to convert the temperature from Fahrenheit to Celsius.
4. The model will then use that information to provide a natural language response about the weather in New York.

This multi-step approach allows the model to gather information and use it to provide more accurate and contextual responses, making your chatbot considerably more useful.

This simple example demonstrates how tools can expand your model's capabilities. You can create more complex tools to integrate with real APIs, databases, or any other external systems, allowing the model to access and process real-world data in real-time. Tools bridge the gap between the model's knowledge cutoff and current information.

## Where to Next?

You've built an AI chatbot using the AI SDK! From here, you have several paths to explore:

- To learn more about the AI SDK, read through the [documentation](/docs).
- If you're interested in diving deeper with guides, check out the [RAG (retrieval-augmented generation)](/docs/guides/rag-chatbot) and [multi-modal chatbot](/docs/guides/multi-modal-chatbot) guides.
- To jumpstart your first AI project, explore available [templates](https://vercel.com/templates?type=ai).


# Node.js Quickstart

The AI SDK is a powerful Typescript library designed to help developers build AI-powered applications.

In this quickstart tutorial, you'll build a simple agent with a streaming chat user interface. Along the way, you'll learn key concepts and techniques that are fundamental to using the SDK in your own projects.

If you are unfamiliar with the concepts of [Prompt Engineering](/docs/advanced/prompt-engineering) and [HTTP Streaming](/docs/advanced/why-streaming), you can optionally read these documents first.

## Prerequisites

To follow this quickstart, you'll need:

- Node.js 18+ and pnpm installed on your local development machine.
- A [ Vercel AI Gateway ](https://vercel.com/ai-gateway) API key.

If you haven't obtained your Vercel AI Gateway API key, you can do so by [signing up](https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fai&title=Go+to+AI+Gateway) on the Vercel website.

## Setup Your Application

Start by creating a new directory using the `mkdir` command. Change into your new directory and then run the `pnpm init` command. This will create a `package.json` in your new directory.

```bash
mkdir my-ai-app
cd my-ai-app
pnpm init
```

### Install Dependencies

Install `ai`, the AI SDK, along with other necessary dependencies.

<Note>
  The AI SDK is designed to be a unified interface to interact with any large
  language model. This means that you can change model and providers with just
  one line of code! Learn more about [available providers](/providers) and
  [building custom providers](/providers/community-providers/custom-providers)
  in the [providers](/providers) section.
</Note>

```bash
pnpm add ai@beta zod dotenv
pnpm add -D @types/node tsx typescript
```

The `ai` package contains the AI SDK. You will use `zod` to define type-safe schemas that you will pass to the large language model (LLM). You will use `dotenv` to access environment variables (your Vercel AI Gateway key) within your application. There are also three development dependencies, installed with the `-D` flag, that are necessary to run your Typescript code.

### Configure Vercel AI Gateway API key

Create a `.env` file in your project's root directory and add your Vercel AI Gateway API Key. This key is used to authenticate your application with the Vercel AI Gateway service.

<Snippet text="touch .env" />

Edit the `.env` file:

```env filename=".env"
AI_GATEWAY_API_KEY=xxxxxxxxx
```

Replace `xxxxxxxxx` with your actual Vercel AI Gateway API key.

<Note className="mb-4">
  The AI SDK will use the `AI_GATEWAY_API_KEY` environment variable to
  authenticate with Vercel AI Gateway.
</Note>

## Create Your Application

Create an `index.ts` file in the root of your project and add the following code:

```ts filename="index.ts"
import { ModelMessage, streamText } from 'ai';
__PROVIDER_IMPORT__;
import 'dotenv/config';
import * as readline from 'node:readline/promises';

const terminal = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const messages: ModelMessage[] = [];

async function main() {
  while (true) {
    const userInput = await terminal.question('You: ');

    messages.push({ role: 'user', content: userInput });

    const result = streamText({
      model: __MODEL__,
      messages,
    });

    let fullResponse = '';
    process.stdout.write('\nAssistant: ');
    for await (const delta of result.textStream) {
      fullResponse += delta;
      process.stdout.write(delta);
    }
    process.stdout.write('\n\n');

    messages.push({ role: 'assistant', content: fullResponse });
  }
}

main().catch(console.error);
```

Let's take a look at what is happening in this code:

1. Set up a readline interface to take input from the terminal, enabling interactive sessions directly from the command line.
2. Initialize an array called `messages` to store the history of your conversation. This history allows the agent to maintain context in ongoing dialogues.
3. In the `main` function:

- Prompt for and capture user input, storing it in `userInput`.
- Add user input to the `messages` array as a user message.
- Call [`streamText`](/docs/reference/ai-sdk-core/stream-text), which is imported from the `ai` package. This function accepts a configuration object that contains a `model` provider and `messages`.
- Iterate over the text stream returned by the `streamText` function (`result.textStream`) and print the contents of the stream to the terminal.
- Add the assistant's response to the `messages` array.

## Running Your Application

With that, you have built everything you need for your agent! To start your application, use the command:

<Snippet text="pnpm tsx index.ts" />

You should see a prompt in your terminal. Test it out by entering a message and see the AI agent respond in real-time! The AI SDK makes it fast and easy to build AI chat interfaces with Node.js.

## Choosing a Provider

The AI SDK supports dozens of model providers through [first-party](/providers/ai-sdk-providers), [OpenAI-compatible](/providers/openai-compatible-providers), and [ community ](/providers/community-providers) packages.

This quickstart uses the [Vercel AI Gateway](https://vercel.com/ai-gateway) provider, which is the default [global provider](/docs/ai-sdk-core/provider-management#global-provider-configuration). This means you can access models using a simple string in the model configuration:

```ts
model: __MODEL__;
```

You can also explicitly import and use the gateway provider in two other equivalent ways:

```ts
// Option 1: Import from 'ai' package (included by default)
import { gateway } from 'ai';
model: gateway('anthropic/claude-sonnet-4.5');

// Option 2: Install and import from '@ai-sdk/gateway' package
import { gateway } from '@ai-sdk/gateway';
model: gateway('anthropic/claude-sonnet-4.5');
```

### Using other providers

To use a different provider, install its package and create a provider instance. For example, to use OpenAI directly:

<div className="my-4">
  <Tabs items={['pnpm', 'npm', 'yarn', 'bun']}>
    <Tab>
      <Snippet text="pnpm add @ai-sdk/openai@beta" dark />
    </Tab>
    <Tab>
      <Snippet text="npm install @ai-sdk/openai@beta" dark />
    </Tab>
    <Tab>
      <Snippet text="yarn add @ai-sdk/openai@beta" dark />
    </Tab>

    <Tab>
      <Snippet text="bun add @ai-sdk/openai@beta" dark />
    </Tab>

  </Tabs>
</div>

```ts
import { openai } from '@ai-sdk/openai';

model: openai('gpt-5.1');
```

## Enhance Your Agent with Tools

While large language models (LLMs) have incredible generation capabilities, they struggle with discrete tasks (e.g. mathematics) and interacting with the outside world (e.g. getting the weather). This is where [tools](/docs/ai-sdk-core/tools-and-tool-calling) come in.

Tools are actions that an LLM can invoke. The results of these actions can be reported back to the LLM to be considered in the next response.

For example, if a user asks about the current weather, without tools, the agent would only be able to provide general information based on its training data. But with a weather tool, it can fetch and provide up-to-date, location-specific weather information.

Let's enhance your agent by adding a simple weather tool.

### Update Your Application

Modify your `index.ts` file to include the new weather tool:

```ts filename="index.ts" highlight="2,4,24-37"
import { ModelMessage, streamText, tool } from 'ai';
__PROVIDER_IMPORT__;
import 'dotenv/config';
import { z } from 'zod';
import * as readline from 'node:readline/promises';

const terminal = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const messages: ModelMessage[] = [];

async function main() {
  while (true) {
    const userInput = await terminal.question('You: ');

    messages.push({ role: 'user', content: userInput });

    const result = streamText({
      model: __MODEL__,
      messages,
      tools: {
        weather: tool({
          description: 'Get the weather in a location (fahrenheit)',
          inputSchema: z.object({
            location: z
              .string()
              .describe('The location to get the weather for'),
          }),
          execute: async ({ location }) => {
            const temperature = Math.round(Math.random() * (90 - 32) + 32);
            return {
              location,
              temperature,
            };
          },
        }),
      },
    });

    let fullResponse = '';
    process.stdout.write('\nAssistant: ');
    for await (const delta of result.textStream) {
      fullResponse += delta;
      process.stdout.write(delta);
    }
    process.stdout.write('\n\n');

    messages.push({ role: 'assistant', content: fullResponse });
  }
}

main().catch(console.error);
```

In this updated code:

1. You import the `tool` function from the `ai` package.
2. You define a `tools` object with a `weather` tool. This tool:

   - Has a description that helps the agent understand when to use it.
   - Defines `inputSchema` using a Zod schema, specifying that it requires a `location` string to execute this tool. The agent will attempt to extract this input from the context of the conversation. If it can't, it will ask the user for the missing information.
   - Defines an `execute` function that simulates getting weather data (in this case, it returns a random temperature). This is an asynchronous function running on the server so you can fetch real data from an external API.

Now your agent can "fetch" weather information for any location the user asks about. When the agent determines it needs to use the weather tool, it will generate a tool call with the necessary parameters. The `execute` function will then be automatically run, and the results will be used by the agent to generate its response.

Try asking something like "What's the weather in New York?" and see how the agent uses the new tool.

Notice the blank "assistant" response? This is because instead of generating a text response, the agent generated a tool call. You can access the tool call and subsequent tool result in the `toolCall` and `toolResult` keys of the result object.

```typescript highlight="46-47"
import { ModelMessage, streamText, tool } from 'ai';
__PROVIDER_IMPORT__;
import 'dotenv/config';
import { z } from 'zod';
import * as readline from 'node:readline/promises';

const terminal = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const messages: ModelMessage[] = [];

async function main() {
  while (true) {
    const userInput = await terminal.question('You: ');

    messages.push({ role: 'user', content: userInput });

    const result = streamText({
      model: __MODEL__,
      messages,
      tools: {
        weather: tool({
          description: 'Get the weather in a location (fahrenheit)',
          inputSchema: z.object({
            location: z
              .string()
              .describe('The location to get the weather for'),
          }),
          execute: async ({ location }) => {
            const temperature = Math.round(Math.random() * (90 - 32) + 32);
            return {
              location,
              temperature,
            };
          },
        }),
      },
    });

    let fullResponse = '';
    process.stdout.write('\nAssistant: ');
    for await (const delta of result.textStream) {
      fullResponse += delta;
      process.stdout.write(delta);
    }
    process.stdout.write('\n\n');

    console.log(await result.toolCalls);
    console.log(await result.toolResults);
    messages.push({ role: 'assistant', content: fullResponse });
  }
}

main().catch(console.error);
```

Now, when you ask about the weather, you'll see the tool call and its result displayed in your chat interface.

## Enabling Multi-Step Tool Calls

You may have noticed that while the tool results are visible in the chat interface, the agent isn't using this information to answer your original query. This is because once the agent generates a tool call, it has technically completed its generation.

To solve this, you can enable multi-step tool calls using `stopWhen`. This feature will automatically send tool results back to the agent to trigger an additional generation until the stopping condition you define is met. In this case, you want the agent to answer your question using the results from the weather tool.

### Update Your Application

Modify your `index.ts` file to configure stopping conditions with `stopWhen`:

```ts filename="index.ts" highlight="38-41"
import { ModelMessage, streamText, tool, stepCountIs } from 'ai';
__PROVIDER_IMPORT__;
import 'dotenv/config';
import { z } from 'zod';
import * as readline from 'node:readline/promises';

const terminal = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const messages: ModelMessage[] = [];

async function main() {
  while (true) {
    const userInput = await terminal.question('You: ');

    messages.push({ role: 'user', content: userInput });

    const result = streamText({
      model: __MODEL__,
      messages,
      tools: {
        weather: tool({
          description: 'Get the weather in a location (fahrenheit)',
          inputSchema: z.object({
            location: z
              .string()
              .describe('The location to get the weather for'),
          }),
          execute: async ({ location }) => {
            const temperature = Math.round(Math.random() * (90 - 32) + 32);
            return {
              location,
              temperature,
            };
          },
        }),
      },
      stopWhen: stepCountIs(5),
      onStepFinish: async ({ toolResults }) => {
        if (toolResults.length) {
          console.log(JSON.stringify(toolResults, null, 2));
        }
      },
    });

    let fullResponse = '';
    process.stdout.write('\nAssistant: ');
    for await (const delta of result.textStream) {
      fullResponse += delta;
      process.stdout.write(delta);
    }
    process.stdout.write('\n\n');

    messages.push({ role: 'assistant', content: fullResponse });
  }
}

main().catch(console.error);
```

In this updated code:

1. You set `stopWhen` to be when `stepCountIs` 5, allowing the agent to use up to 5 "steps" for any given generation.
2. You add an `onStepFinish` callback to log any `toolResults` from each step of the interaction, helping you understand the agent's tool usage. This means we can also delete the `toolCall` and `toolResult` `console.log` statements from the previous example.

Now, when you ask about the weather in a location, you should see the agent using the weather tool results to answer your question.

By setting `stopWhen: stepCountIs(5)`, you're allowing the agent to use up to 5 "steps" for any given generation. This enables more complex interactions and allows the agent to gather and process information over several steps if needed. You can see this in action by adding another tool to convert the temperature from Celsius to Fahrenheit.

### Adding a second tool

Update your `index.ts` file to add a new tool to convert the temperature from Celsius to Fahrenheit:

```ts filename="index.ts" highlight="37-48"
import { ModelMessage, streamText, tool, stepCountIs } from 'ai';
__PROVIDER_IMPORT__;
import 'dotenv/config';
import { z } from 'zod';
import * as readline from 'node:readline/promises';

const terminal = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const messages: ModelMessage[] = [];

async function main() {
  while (true) {
    const userInput = await terminal.question('You: ');

    messages.push({ role: 'user', content: userInput });

    const result = streamText({
      model: __MODEL__,
      messages,
      tools: {
        weather: tool({
          description: 'Get the weather in a location (fahrenheit)',
          inputSchema: z.object({
            location: z
              .string()
              .describe('The location to get the weather for'),
          }),
          execute: async ({ location }) => {
            const temperature = Math.round(Math.random() * (90 - 32) + 32);
            return {
              location,
              temperature,
            };
          },
        }),
        convertFahrenheitToCelsius: tool({
          description: 'Convert a temperature in fahrenheit to celsius',
          inputSchema: z.object({
            temperature: z
              .number()
              .describe('The temperature in fahrenheit to convert'),
          }),
          execute: async ({ temperature }) => {
            const celsius = Math.round((temperature - 32) * (5 / 9));
            return {
              celsius,
            };
          },
        }),
      },
      stopWhen: stepCountIs(5),
      onStepFinish: async ({ toolResults }) => {
        if (toolResults.length) {
          console.log(JSON.stringify(toolResults, null, 2));
        }
      },
    });

    let fullResponse = '';
    process.stdout.write('\nAssistant: ');
    for await (const delta of result.textStream) {
      fullResponse += delta;
      process.stdout.write(delta);
    }
    process.stdout.write('\n\n');

    messages.push({ role: 'assistant', content: fullResponse });
  }
}

main().catch(console.error);
```

Now, when you ask "What's the weather in New York in celsius?", you should see a more complete interaction:

1. The agent will call the weather tool for New York.
2. You'll see the tool result logged.
3. It will then call the temperature conversion tool to convert the temperature from Fahrenheit to Celsius.
4. The agent will then use that information to provide a natural language response about the weather in New York.

This multi-step approach allows the agent to gather information and use it to provide more accurate and contextual responses, making your agent considerably more useful.

This example demonstrates how tools can expand your agent's capabilities. You can create more complex tools to integrate with real APIs, databases, or any other external systems, allowing the agent to access and process real-world data in real-time and perform actions that interact with the outside world. Tools bridge the gap between the agent's knowledge cutoff and current information, while also enabling it to take meaningful actions beyond just generating text responses.

## Where to Next?

You've built an AI agent using the AI SDK! From here, you have several paths to explore:

- To learn more about the AI SDK, read through the [documentation](/docs).
- If you're interested in diving deeper with guides, check out the [RAG (retrieval-augmented generation)](/docs/guides/rag-chatbot) and [multi-modal chatbot](/docs/guides/multi-modal-chatbot) guides.
- To jumpstart your first AI project, explore available [templates](https://vercel.com/templates?type=ai).


# Node.js Quickstart

The AI SDK is a powerful Typescript library designed to help developers build AI-powered applications.

In this quickstart tutorial, you'll build a simple agent with a streaming chat user interface. Along the way, you'll learn key concepts and techniques that are fundamental to using the SDK in your own projects.

If you are unfamiliar with the concepts of [Prompt Engineering](/docs/advanced/prompt-engineering) and [HTTP Streaming](/docs/advanced/why-streaming), you can optionally read these documents first.

## Prerequisites

To follow this quickstart, you'll need:

- Node.js 18+ and pnpm installed on your local development machine.
- A [ Vercel AI Gateway ](https://vercel.com/ai-gateway) API key.

If you haven't obtained your Vercel AI Gateway API key, you can do so by [signing up](https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fai&title=Go+to+AI+Gateway) on the Vercel website.

## Setup Your Application

Start by creating a new directory using the `mkdir` command. Change into your new directory and then run the `pnpm init` command. This will create a `package.json` in your new directory.

```bash
mkdir my-ai-app
cd my-ai-app
pnpm init
```

### Install Dependencies

Install `ai`, the AI SDK, along with other necessary dependencies.

<Note>
  The AI SDK is designed to be a unified interface to interact with any large
  language model. This means that you can change model and providers with just
  one line of code! Learn more about [available providers](/providers) and
  [building custom providers](/providers/community-providers/custom-providers)
  in the [providers](/providers) section.
</Note>

```bash
pnpm add ai@beta zod dotenv
pnpm add -D @types/node tsx typescript
```

The `ai` package contains the AI SDK. You will use `zod` to define type-safe schemas that you will pass to the large language model (LLM). You will use `dotenv` to access environment variables (your Vercel AI Gateway key) within your application. There are also three development dependencies, installed with the `-D` flag, that are necessary to run your Typescript code.

### Configure Vercel AI Gateway API key

Create a `.env` file in your project's root directory and add your Vercel AI Gateway API Key. This key is used to authenticate your application with the Vercel AI Gateway service.

<Snippet text="touch .env" />

Edit the `.env` file:

```env filename=".env"
AI_GATEWAY_API_KEY=xxxxxxxxx
```

Replace `xxxxxxxxx` with your actual Vercel AI Gateway API key.

<Note className="mb-4">
  The AI SDK will use the `AI_GATEWAY_API_KEY` environment variable to
  authenticate with Vercel AI Gateway.
</Note>

## Create Your Application

Create an `index.ts` file in the root of your project and add the following code:

```ts filename="index.ts"
import { ModelMessage, streamText } from 'ai';
__PROVIDER_IMPORT__;
import 'dotenv/config';
import * as readline from 'node:readline/promises';

const terminal = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const messages: ModelMessage[] = [];

async function main() {
  while (true) {
    const userInput = await terminal.question('You: ');

    messages.push({ role: 'user', content: userInput });

    const result = streamText({
      model: __MODEL__,
      messages,
    });

    let fullResponse = '';
    process.stdout.write('\nAssistant: ');
    for await (const delta of result.textStream) {
      fullResponse += delta;
      process.stdout.write(delta);
    }
    process.stdout.write('\n\n');

    messages.push({ role: 'assistant', content: fullResponse });
  }
}

main().catch(console.error);
```

Let's take a look at what is happening in this code:

1. Set up a readline interface to take input from the terminal, enabling interactive sessions directly from the command line.
2. Initialize an array called `messages` to store the history of your conversation. This history allows the agent to maintain context in ongoing dialogues.
3. In the `main` function:

- Prompt for and capture user input, storing it in `userInput`.
- Add user input to the `messages` array as a user message.
- Call [`streamText`](/docs/reference/ai-sdk-core/stream-text), which is imported from the `ai` package. This function accepts a configuration object that contains a `model` provider and `messages`.
- Iterate over the text stream returned by the `streamText` function (`result.textStream`) and print the contents of the stream to the terminal.
- Add the assistant's response to the `messages` array.

## Running Your Application

With that, you have built everything you need for your agent! To start your application, use the command:

<Snippet text="pnpm tsx index.ts" />

You should see a prompt in your terminal. Test it out by entering a message and see the AI agent respond in real-time! The AI SDK makes it fast and easy to build AI chat interfaces with Node.js.

## Choosing a Provider

The AI SDK supports dozens of model providers through [first-party](/providers/ai-sdk-providers), [OpenAI-compatible](/providers/openai-compatible-providers), and [ community ](/providers/community-providers) packages.

This quickstart uses the [Vercel AI Gateway](https://vercel.com/ai-gateway) provider, which is the default [global provider](/docs/ai-sdk-core/provider-management#global-provider-configuration). This means you can access models using a simple string in the model configuration:

```ts
model: __MODEL__;
```

You can also explicitly import and use the gateway provider in two other equivalent ways:

```ts
// Option 1: Import from 'ai' package (included by default)
import { gateway } from 'ai';
model: gateway('anthropic/claude-sonnet-4.5');

// Option 2: Install and import from '@ai-sdk/gateway' package
import { gateway } from '@ai-sdk/gateway';
model: gateway('anthropic/claude-sonnet-4.5');
```

### Using other providers

To use a different provider, install its package and create a provider instance. For example, to use OpenAI directly:

<div className="my-4">
  <Tabs items={['pnpm', 'npm', 'yarn', 'bun']}>
    <Tab>
      <Snippet text="pnpm add @ai-sdk/openai@beta" dark />
    </Tab>
    <Tab>
      <Snippet text="npm install @ai-sdk/openai@beta" dark />
    </Tab>
    <Tab>
      <Snippet text="yarn add @ai-sdk/openai@beta" dark />
    </Tab>

    <Tab>
      <Snippet text="bun add @ai-sdk/openai@beta" dark />
    </Tab>

  </Tabs>
</div>

```ts
import { openai } from '@ai-sdk/openai';

model: openai('gpt-5.1');
```

## Enhance Your Agent with Tools

While large language models (LLMs) have incredible generation capabilities, they struggle with discrete tasks (e.g. mathematics) and interacting with the outside world (e.g. getting the weather). This is where [tools](/docs/ai-sdk-core/tools-and-tool-calling) come in.

Tools are actions that an LLM can invoke. The results of these actions can be reported back to the LLM to be considered in the next response.

For example, if a user asks about the current weather, without tools, the agent would only be able to provide general information based on its training data. But with a weather tool, it can fetch and provide up-to-date, location-specific weather information.

Let's enhance your agent by adding a simple weather tool.

### Update Your Application

Modify your `index.ts` file to include the new weather tool:

```ts filename="index.ts" highlight="2,4,24-37"
import { ModelMessage, streamText, tool } from 'ai';
__PROVIDER_IMPORT__;
import 'dotenv/config';
import { z } from 'zod';
import * as readline from 'node:readline/promises';

const terminal = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const messages: ModelMessage[] = [];

async function main() {
  while (true) {
    const userInput = await terminal.question('You: ');

    messages.push({ role: 'user', content: userInput });

    const result = streamText({
      model: __MODEL__,
      messages,
      tools: {
        weather: tool({
          description: 'Get the weather in a location (fahrenheit)',
          inputSchema: z.object({
            location: z
              .string()
              .describe('The location to get the weather for'),
          }),
          execute: async ({ location }) => {
            const temperature = Math.round(Math.random() * (90 - 32) + 32);
            return {
              location,
              temperature,
            };
          },
        }),
      },
    });

    let fullResponse = '';
    process.stdout.write('\nAssistant: ');
    for await (const delta of result.textStream) {
      fullResponse += delta;
      process.stdout.write(delta);
    }
    process.stdout.write('\n\n');

    messages.push({ role: 'assistant', content: fullResponse });
  }
}

main().catch(console.error);
```

In this updated code:

1. You import the `tool` function from the `ai` package.
2. You define a `tools` object with a `weather` tool. This tool:

   - Has a description that helps the agent understand when to use it.
   - Defines `inputSchema` using a Zod schema, specifying that it requires a `location` string to execute this tool. The agent will attempt to extract this input from the context of the conversation. If it can't, it will ask the user for the missing information.
   - Defines an `execute` function that simulates getting weather data (in this case, it returns a random temperature). This is an asynchronous function running on the server so you can fetch real data from an external API.

Now your agent can "fetch" weather information for any location the user asks about. When the agent determines it needs to use the weather tool, it will generate a tool call with the necessary parameters. The `execute` function will then be automatically run, and the results will be used by the agent to generate its response.

Try asking something like "What's the weather in New York?" and see how the agent uses the new tool.

Notice the blank "assistant" response? This is because instead of generating a text response, the agent generated a tool call. You can access the tool call and subsequent tool result in the `toolCall` and `toolResult` keys of the result object.

```typescript highlight="46-47"
import { ModelMessage, streamText, tool } from 'ai';
__PROVIDER_IMPORT__;
import 'dotenv/config';
import { z } from 'zod';
import * as readline from 'node:readline/promises';

const terminal = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const messages: ModelMessage[] = [];

async function main() {
  while (true) {
    const userInput = await terminal.question('You: ');

    messages.push({ role: 'user', content: userInput });

    const result = streamText({
      model: __MODEL__,
      messages,
      tools: {
        weather: tool({
          description: 'Get the weather in a location (fahrenheit)',
          inputSchema: z.object({
            location: z
              .string()
              .describe('The location to get the weather for'),
          }),
          execute: async ({ location }) => {
            const temperature = Math.round(Math.random() * (90 - 32) + 32);
            return {
              location,
              temperature,
            };
          },
        }),
      },
    });

    let fullResponse = '';
    process.stdout.write('\nAssistant: ');
    for await (const delta of result.textStream) {
      fullResponse += delta;
      process.stdout.write(delta);
    }
    process.stdout.write('\n\n');

    console.log(await result.toolCalls);
    console.log(await result.toolResults);
    messages.push({ role: 'assistant', content: fullResponse });
  }
}

main().catch(console.error);
```

Now, when you ask about the weather, you'll see the tool call and its result displayed in your chat interface.

## Enabling Multi-Step Tool Calls

You may have noticed that while the tool results are visible in the chat interface, the agent isn't using this information to answer your original query. This is because once the agent generates a tool call, it has technically completed its generation.

To solve this, you can enable multi-step tool calls using `stopWhen`. This feature will automatically send tool results back to the agent to trigger an additional generation until the stopping condition you define is met. In this case, you want the agent to answer your question using the results from the weather tool.

### Update Your Application

Modify your `index.ts` file to configure stopping conditions with `stopWhen`:

```ts filename="index.ts" highlight="38-41"
import { ModelMessage, streamText, tool, stepCountIs } from 'ai';
__PROVIDER_IMPORT__;
import 'dotenv/config';
import { z } from 'zod';
import * as readline from 'node:readline/promises';

const terminal = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const messages: ModelMessage[] = [];

async function main() {
  while (true) {
    const userInput = await terminal.question('You: ');

    messages.push({ role: 'user', content: userInput });

    const result = streamText({
      model: __MODEL__,
      messages,
      tools: {
        weather: tool({
          description: 'Get the weather in a location (fahrenheit)',
          inputSchema: z.object({
            location: z
              .string()
              .describe('The location to get the weather for'),
          }),
          execute: async ({ location }) => {
            const temperature = Math.round(Math.random() * (90 - 32) + 32);
            return {
              location,
              temperature,
            };
          },
        }),
      },
      stopWhen: stepCountIs(5),
      onStepFinish: async ({ toolResults }) => {
        if (toolResults.length) {
          console.log(JSON.stringify(toolResults, null, 2));
        }
      },
    });

    let fullResponse = '';
    process.stdout.write('\nAssistant: ');
    for await (const delta of result.textStream) {
      fullResponse += delta;
      process.stdout.write(delta);
    }
    process.stdout.write('\n\n');

    messages.push({ role: 'assistant', content: fullResponse });
  }
}

main().catch(console.error);
```

In this updated code:

1. You set `stopWhen` to be when `stepCountIs` 5, allowing the agent to use up to 5 "steps" for any given generation.
2. You add an `onStepFinish` callback to log any `toolResults` from each step of the interaction, helping you understand the agent's tool usage. This means we can also delete the `toolCall` and `toolResult` `console.log` statements from the previous example.

Now, when you ask about the weather in a location, you should see the agent using the weather tool results to answer your question.

By setting `stopWhen: stepCountIs(5)`, you're allowing the agent to use up to 5 "steps" for any given generation. This enables more complex interactions and allows the agent to gather and process information over several steps if needed. You can see this in action by adding another tool to convert the temperature from Celsius to Fahrenheit.

### Adding a second tool

Update your `index.ts` file to add a new tool to convert the temperature from Celsius to Fahrenheit:

```ts filename="index.ts" highlight="37-48"
import { ModelMessage, streamText, tool, stepCountIs } from 'ai';
__PROVIDER_IMPORT__;
import 'dotenv/config';
import { z } from 'zod';
import * as readline from 'node:readline/promises';

const terminal = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const messages: ModelMessage[] = [];

async function main() {
  while (true) {
    const userInput = await terminal.question('You: ');

    messages.push({ role: 'user', content: userInput });

    const result = streamText({
      model: __MODEL__,
      messages,
      tools: {
        weather: tool({
          description: 'Get the weather in a location (fahrenheit)',
          inputSchema: z.object({
            location: z
              .string()
              .describe('The location to get the weather for'),
          }),
          execute: async ({ location }) => {
            const temperature = Math.round(Math.random() * (90 - 32) + 32);
            return {
              location,
              temperature,
            };
          },
        }),
        convertFahrenheitToCelsius: tool({
          description: 'Convert a temperature in fahrenheit to celsius',
          inputSchema: z.object({
            temperature: z
              .number()
              .describe('The temperature in fahrenheit to convert'),
          }),
          execute: async ({ temperature }) => {
            const celsius = Math.round((temperature - 32) * (5 / 9));
            return {
              celsius,
            };
          },
        }),
      },
      stopWhen: stepCountIs(5),
      onStepFinish: async ({ toolResults }) => {
        if (toolResults.length) {
          console.log(JSON.stringify(toolResults, null, 2));
        }
      },
    });

    let fullResponse = '';
    process.stdout.write('\nAssistant: ');
    for await (const delta of result.textStream) {
      fullResponse += delta;
      process.stdout.write(delta);
    }
    process.stdout.write('\n\n');

    messages.push({ role: 'assistant', content: fullResponse });
  }
}

main().catch(console.error);
```

Now, when you ask "What's the weather in New York in celsius?", you should see a more complete interaction:

1. The agent will call the weather tool for New York.
2. You'll see the tool result logged.
3. It will then call the temperature conversion tool to convert the temperature from Fahrenheit to Celsius.
4. The agent will then use that information to provide a natural language response about the weather in New York.

This multi-step approach allows the agent to gather information and use it to provide more accurate and contextual responses, making your agent considerably more useful.

This example demonstrates how tools can expand your agent's capabilities. You can create more complex tools to integrate with real APIs, databases, or any other external systems, allowing the agent to access and process real-world data in real-time and perform actions that interact with the outside world. Tools bridge the gap between the agent's knowledge cutoff and current information, while also enabling it to take meaningful actions beyond just generating text responses.

## Where to Next?

You've built an AI agent using the AI SDK! From here, you have several paths to explore:

- To learn more about the AI SDK, read through the [documentation](/docs).
- If you're interested in diving deeper with guides, check out the [RAG (retrieval-augmented generation)](/docs/guides/rag-chatbot) and [multi-modal chatbot](/docs/guides/multi-modal-chatbot) guides.
- To jumpstart your first AI project, explore available [templates](https://vercel.com/templates?type=ai).
