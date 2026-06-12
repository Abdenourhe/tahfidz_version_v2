// src/lib/validations/library.ts
// Schémas Zod pour le module Bibliothèque

import { z } from "zod"

export const libraryCategorySchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères").max(100, "Nom trop long"),
  nameAr: z.string().optional(),
  nameEn: z.string().optional(),
  description: z.string().max(2000, "Description trop longue").optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
})

export const libraryCollectionSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères").max(200, "Nom trop long"),
  nameAr: z.string().optional(),
  nameEn: z.string().optional(),
  description: z.string().max(5000, "Description trop longue").optional(),
  coverImage: z.string().optional(),
  color: z.string().optional(),
  groupId: z.string().cuid().optional().nullable(),
  isActive: z.boolean().default(true),
})

export const libraryContentSchema = z.object({
  visibility: z.enum(["GLOBAL", "SCHOOL", "CLASS"]),
  collectionId: z.string().cuid().optional().nullable(),
  type: z.enum(["PDF", "VIDEO_SERIES", "VIDEO_SINGLE", "AUDIO"]),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  title: z.string().min(2, "Le titre doit contenir au moins 2 caractères").max(200, "Titre trop long"),
  titleAr: z.string().optional(),
  titleEn: z.string().optional(),
  description: z.string().max(10000, "Description trop longue").optional(),
  descriptionAr: z.string().max(10000, "Description trop longue").optional(),
  descriptionEn: z.string().max(10000, "Description trop longue").optional(),
  thumbnail: z.string().optional(),
  coverImage: z.string().optional(),
  pdfUrl: z.string().optional(),
  pdfPages: z.number().int().min(1).optional(),
  videoUrl: z.string().optional(),
  videoSource: z.enum(["youtube", "vimeo", "local"]).optional(),
  duration: z.number().int().min(0).optional(),
  categoryId: z.string().cuid({ message: "La catégorie est obligatoire" }),
  author: z.string().max(200).optional(),
  language: z.string().max(10).optional(),
  level: z.string().max(50).optional(),
  tags: z.array(z.string().max(50)).max(20, "Maximum 20 tags").default([]),
})

export const libraryEpisodeSchema = z.object({
  title: z.string().min(1, "Le titre est obligatoire").max(200),
  titleAr: z.string().optional(),
  titleEn: z.string().optional(),
  description: z.string().max(5000).optional(),
  videoUrl: z.string().min(1, "L'URL vidéo est obligatoire"),
  duration: z.number().int().min(0).optional(),
  episodeOrder: z.number().int().min(0).default(0),
  thumbnail: z.string().optional(),
})

export const libraryProgressSchema = z.object({
  contentId: z.string().cuid({ message: "Contenu invalide" }),
  progress: z.number().min(0).max(100, "La progression doit être entre 0 et 100"),
  lastPosition: z.number().int().min(0).optional(),
})

export const libraryBookmarkSchema = z.object({
  contentId: z.string().cuid({ message: "Contenu invalide" }),
  note: z.string().max(500).optional(),
})

export type LibraryCategoryInput = z.input<typeof libraryCategorySchema>
export type LibraryCollectionInput = z.input<typeof libraryCollectionSchema>
export type LibraryContentInput = z.input<typeof libraryContentSchema>
export type LibraryEpisodeInput = z.input<typeof libraryEpisodeSchema>
export type LibraryProgressInput = z.input<typeof libraryProgressSchema>
export type LibraryBookmarkInput = z.input<typeof libraryBookmarkSchema>
