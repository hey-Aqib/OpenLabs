export interface ModelLanguage {
  language_id: string;
  name: string;
}

export interface Model {
  model_id: string;
  name: string;
  description: string;
  can_be_tuned: boolean;
  can_do_text_to_speech: boolean;
  can_do_voice_conversion: boolean;
  token_cost_factor: number;
  languages: ModelLanguage[];
}

export const AVAILABLE_MODELS: Model[] = [
  {
    model_id: "openlabs_multilingual_v2",
    name: "OpenLabs Multilingual v2",
    description: "State-of-the-art neural speech synthesis across 29 languages with rich emotional nuances, pitch dynamics, and dynamic stability control.",
    can_be_tuned: true,
    can_do_text_to_speech: true,
    can_do_voice_conversion: true,
    token_cost_factor: 1.0,
    languages: [
      { language_id: "en", name: "English" },
      { language_id: "ur", name: "Urdu" },
      { language_id: "hi", name: "Hindi" },
      { language_id: "es", name: "Spanish" },
      { language_id: "fr", name: "French" },
      { language_id: "de", name: "German" },
      { language_id: "ja", name: "Japanese" },
      { language_id: "zh", name: "Chinese" },
      { language_id: "ar", name: "Arabic" },
    ]
  },
  {
    model_id: "openlabs_flash_v2_5",
    name: "OpenLabs Flash v2.5",
    description: "Ultra-low latency streaming model optimized for interactive voice agents, gaming dialogue, and conversational bots (~75ms first-chunk TTFB).",
    can_be_tuned: false,
    can_do_text_to_speech: true,
    can_do_voice_conversion: false,
    token_cost_factor: 0.5,
    languages: [
      { language_id: "en", name: "English" },
      { language_id: "es", name: "Spanish" },
      { language_id: "fr", name: "French" },
      { language_id: "de", name: "German" }
    ]
  },
  {
    model_id: "openlabs_turbo_v2",
    name: "OpenLabs Turbo v2",
    description: "High-throughput neural engine engineered for enterprise audio generation and bulk content creation at 50% reduced compute cost.",
    can_be_tuned: false,
    can_do_text_to_speech: true,
    can_do_voice_conversion: false,
    token_cost_factor: 0.5,
    languages: [
      { language_id: "en", name: "English" }
    ]
  },
  {
    model_id: "openlabs_neural_v1",
    name: "OpenLabs Neural v1",
    description: "Legacy foundation acoustic model providing classic warm analog timbre with high prosodic predictability.",
    can_be_tuned: true,
    can_do_text_to_speech: true,
    can_do_voice_conversion: true,
    token_cost_factor: 1.0,
    languages: [
      { language_id: "en", name: "English" }
    ]
  }
];
