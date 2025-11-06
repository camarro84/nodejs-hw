import createHttpError from 'http-errors'
import { Note } from '../models/note.js'

export async function getAllNotes(req, res, next) {
  try {
    const notes = await Note.find().lean()
    res.status(200).json(notes)
  } catch (e) {
    next(e)
  }
}

export async function getNoteById(req, res, next) {
  try {
    const { noteId } = req.params
    const note = await Note.findById(noteId).lean()
    if (!note) throw createHttpError(404, 'Note not found')
    res.status(200).json(note)
  } catch (e) {
    next(e)
  }
}

export async function createNote(req, res, next) {
  try {
    const note = await Note.create(req.body)
    res.status(201).json(note)
  } catch (e) {
    next(e)
  }
}

export async function updateNote(req, res, next) {
  try {
    const { noteId } = req.params
    const note = await Note.findByIdAndUpdate(noteId, req.body, {
      new: true,
      runValidators: true
    }).lean()
    if (!note) throw createHttpError(404, 'Note not found')
    res.status(200).json(note)
  } catch (e) {
    next(e)
  }
}

export async function deleteNote(req, res, next) {
  try {
    const { noteId } = req.params
    const note = await Note.findByIdAndDelete(noteId).lean()
    if (!note) throw createHttpError(404, 'Note not found')
    res.status(200).json(note)
  } catch (e) {
    next(e)
  }
}
