import { LanguageModelV1, EmbeddingModelV1, ImageModelV1 } from '@ai-sdk/provider';
import {
    OpenAICompatibleChatLanguageModel,
    OpenAICompatibleChatSettings,
    OpenAICompatibleCompletionLanguageModel,
    OpenAICompatibleEmbeddingModel,
    OpenAICompatibleImageModel,
} from '@ai-sdk/openai-compatible';
import {
    FetchFunction,
    loadApiKey,
    withoutTrailingSlash,
} from '@ai-sdk/provider-utils';
// Import your model id and settings here.

export interface DMRChatSettings extends OpenAICompatibleChatSettings {
    stream?: boolean;
    // Add any custom settings here
}

export interface DMRCompletionSettings {
    // Add completion-specific settings here
}

export interface DMREmbeddingSettings {
    // Add embedding-specific settings here
}

export interface DMRImageSettings {
    // Add image-specific settings here
}

export interface DMRProviderSettings {
    /**
  Example API key.
  */
    apiKey?: string;
    /**
  Base URL for the API calls.
  */
    baseURL?: string;
    /**
  Custom headers to include in the requests.
  */
    headers?: Record<string, string>;
    /**
  Optional custom url query parameters to include in request urls.
  */
    queryParams?: Record<string, string>;
    /**
  Custom fetch implementation. You can use it as a middleware to intercept requests,
  or to provide a custom fetch implementation for e.g. testing.
  */
    fetch?: FetchFunction;
}

export interface DMRProvider {
    /**
  Creates a model for text generation.
  */
    (
        modelId: string,
        settings?: DMRChatSettings,
    ): LanguageModelV1;

    /**
  Creates a chat model for text generation.
  */
    chatModel(
        modelId: string,
        settings?: DMRChatSettings,
    ): LanguageModelV1;

    /**
  Creates a completion model for text generation.
  */
    completionModel(
        modelId: string,
        settings?: DMRCompletionSettings,
    ): LanguageModelV1;

    /**
  Creates a text embedding model for text generation.
  */
    textEmbeddingModel(
        modelId: string,
        settings?: DMREmbeddingSettings,
    ): EmbeddingModelV1<string>;

    /**
  Creates an image model for image generation.
  */
    imageModel(
        modelId: string,
        settings?: DMRImageSettings,
    ): ImageModelV1;
}

export function createDMR(
    options: DMRProviderSettings = {},
): DMRProvider {
    const baseURL = withoutTrailingSlash(
        options.baseURL ?? 'https://localhost:12434/engines/llama.cpp/v1',
    );
    const getHeaders = () => ({
        ...options.headers,
    });

    interface CommonModelConfig {
        provider: string;
        url: ({ path }: { path: string }) => string;
        headers: () => Record<string, string>;
        fetch?: FetchFunction;
    }

    const getCommonModelConfig = (modelType: string): CommonModelConfig => ({
        provider: `example.${modelType}`,
        url: ({ path }) => {
            const url = new URL(`${baseURL}${path}`);
            if (options.queryParams) {
                url.search = new URLSearchParams(options.queryParams).toString();
            }
            return url.toString();
        },
        headers: getHeaders,
        fetch: options.fetch,
    });

    const createChatModel = (
        modelId: string,
        settings: DMRChatSettings = {},
    ) => {
        return new OpenAICompatibleChatLanguageModel(modelId, settings, {
            ...getCommonModelConfig('chat'),
            defaultObjectGenerationMode: 'tool',
        });
    };

    const createCompletionModel = (
        modelId: string,
        settings: DMRCompletionSettings = {},
    ) =>
        new OpenAICompatibleCompletionLanguageModel(
            modelId,
            settings,
            getCommonModelConfig('completion'),
        );

    const createTextEmbeddingModel = (
        modelId: string,
        settings: DMREmbeddingSettings = {},
    ) =>
        new OpenAICompatibleEmbeddingModel(
            modelId,
            settings,
            getCommonModelConfig('embedding'),
        );

    const createImageModel = (
        modelId: string,
        settings: DMRImageSettings = {},
    ) =>
        new OpenAICompatibleImageModel(
            modelId,
            settings,
            getCommonModelConfig('image'),
        );

    const provider = (
        modelId: string,
        settings?: DMRChatSettings,
    ) => createChatModel(modelId, settings);

    provider.completionModel = createCompletionModel;
    provider.chatModel = createChatModel;
    provider.textEmbeddingModel = createTextEmbeddingModel;
    provider.imageModel = createImageModel;

    return provider;
}

// Export default instance
export const dmr = createDMR();

const dmrClient = createDMR({
    baseURL: 'http://localhost:12434/engines/llama.cpp/v1'
});

// When using the chat model, pass stream: false in the settings
const model = dmrClient("your-model-id", {
    stream: false
});