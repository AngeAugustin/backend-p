export type Locale = "fr" | "en";

export type MessageRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: number;
}

export interface SuggestedQuestion {
  id: string;
  label: Record<Locale, string>;
}
