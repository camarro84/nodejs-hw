import createHttpError from 'http-errors'
import { Note } from '../models/note.js'

export async function getAllNotes(req, res, next) {
  try {
    const { page = 1, perPage = 10, tag, search } = req.query
    const pageNumber = Number(page) || 1
    const perPageNumber = Number(perPage) || 10
    const skip = (pageNumber - 1) * perPageNumber
    const filter = { userId: req.user._id }
    if (tag) {
      filter.tag = tag
    }
    const notesQuery = Note.find(filter)
    if (search) {
      notesQuery.where({ $text: { $search: search } })
    }
    const [totalNotes, notes] = await Promise.all([
      notesQuery.clone().countDocuments(),
      notesQuery.skip(skip).limit(perPageNumber).lean()
    ])
    const totalPages = Math.ceil(totalNotes / perPageNumber)
    res.status(200).json({
      page: pageNumber,
      perPage: perPageNumber,
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
    const note = await Note.findOne({
      _id: noteId,
      userId: req.user._id
    }).lean()
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
    const note = await Note.create({
      title,
      content,
      tag,
      userId: req.user._id
    })
    res.status(201).json(note)
  } catch (e) {
    next(e)
  }
}

export async function updateNote(req, res, next) {
  try {
    const { noteId } = req.params
    const update = req.body
    const note = await Note.findOneAndUpdate(
      { _id: noteId, userId: req.user._id },
      update,
      {
        new: true
      }
    ).lean()
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
    const note = await Note.findOneAndDelete({
      _id: noteId,
      userId: req.user._id
    }).lean()
    if (!note) {
      throw createHttpError(404, 'Note not found')
    }
    res.status(200).json(note)
  } catch (e) {
    next(e)
  }
}
