import createHttpError from 'http-errors'
import { Note } from '../models/note.js'

export async function getAllNotes(req, res, next) {
  try {
    const { page = 1, perPage = 10, tag, search } = req.query
    const skip = (page - 1) * perPage
    const notesQuery = Note.find()
    if (tag) {
      notesQuery.where('tag').equals(tag)
    }
    if (search) {
      notesQuery.where({ $text: { $search: search } })
    }
    const [totalNotes, notes] = await Promise.all([
      notesQuery.clone().countDocuments(),
      notesQuery.skip(skip).limit(perPage).lean()
    ])
    const totalPages = Math.ceil(totalNotes / perPage)
    res.status(200).json({
      page,
      perPage,
      totalNotes,
      totalPages,
      notes
    })
  } catch (e) {
    next(e)
  }
}

export async function getNoteById(req, res, next) {
  try {
    const { noteId } = req.params
    const note = await Note.findById(noteId).lean()
    if (!note) {
      throw createHttpError(404, 'Note not found')
    }
    res.status(200).json(note)
  } catch (e) {
    next(e)
  }
}

export async function createNote(req, res, next) {
  try {
    const { title, content, tag } = req.body
    const note = await Note.create({ title, content, tag })
    res.status(201).json(note)
  } catch (e) {
    next(e)
  }
}

export async function updateNote(req, res, next) {
  try {
    const { noteId } = req.params
    const update = req.body
    const note = await Note.findByIdAndUpdate(noteId, update, {
      new: true
    }).lean()
    if (!note) {
      throw createHttpError(404, 'Note not found')
    }
    res.status(200).json(note)
  } catch (e) {
    next(e)
  }
}

export async function deleteNote(req, res, next) {
  try {
    const { noteId } = req.params
    const note = await Note.findByIdAndDelete(noteId).lean()
    if (!note) {
      throw createHttpError(404, 'Note not found')
    }
    res.status(200).json(note)
  } catch (e) {
    next(e)
  }
}
