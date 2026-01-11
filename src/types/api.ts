// API client types for external services

import { Book } from './book'

// OpenAI API types
export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface OpenAIRequest {
  model: string
  messages: OpenAIMessage[]
  max_completion_tokens: number
}

export interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
}

// Gemini API types
export interface GeminiRequest {
  contents: Array<{
    parts: Array<{ text: string }>
  }>
}

export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>
    }
  }>
}

// Deepgram types
export interface DeepgramTranscript {
  transcript: string
  is_final: boolean
}

export interface DeepgramMessage {
  channel: {
    alternatives: DeepgramTranscript[]
  }
}

// ImgBB API types
export interface ImgBBUploadResponse {
  data: {
    url: string
    delete_url: string
    display_url: string
  }
  success: boolean
  status: number
}

// Import stats
export interface ImportStats {
  chapters: number
  subchapters: number
  paragraphs: number
  images: number
}

export interface ImportResult {
  success: boolean
  book?: Book
  stats?: ImportStats
  error?: string
}
