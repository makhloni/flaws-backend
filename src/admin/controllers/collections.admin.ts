import { Request, Response } from 'express'
import prisma from '../../lib/prisma'
import { layout } from '../views/layout'

export async function getCollections(req: Request, res: Response) {
  const collections = await prisma.collection.findMany({
    include: { products: { select: { id: true } } },
    orderBy: { name: 'asc' },
  })

  const rows = collections.map(c => `
    <tr>
      <td><strong>${c.name}</strong></td>
      <td style="color:#888;">${c.slug}</td>
      <td><span class="badge badge-${c.gender === 'MEN' ? 'confirmed' : 'processing'}">${c.gender}</span></td>
      <td>${c.products.length}</td>
      <td>
        <div style="display:flex;gap:0.5rem;">
          <a href="/admin/collections/${c.id}/edit" class="btn btn-sm btn-secondary">Edit</a>
          <form method="POST" action="/admin/collections/${c.id}/delete" onsubmit="return confirm('Delete this collection?')">
            <button type="submit" class="btn btn-sm btn-danger">Delete</button>
          </form>
        </div>
      </td>
    </tr>
  `).join('')

  const body = `
    <div class="page-header">
      <span class="page-title">Collections</span>
      <a href="/admin/collections/new" class="btn btn-primary">+ New Collection</a>
    </div>
    <div class="card">
      ${collections.length === 0 ? '<div class="empty-state">No collections yet</div>' : `
        <table>
          <thead><tr><th>Name</th><th>Slug</th><th>Gender</th><th>Products</th><th></th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      `}
    </div>
  `
  res.send(layout('Collections', body, 'collections'))
}

export async function getNewCollection(req: Request, res: Response) {
  const error = req.query.error || ''
  const body = `
    <div class="page-header">
      <span class="page-title">New Collection</span>
      <a href="/admin/collections" class="btn btn-secondary">← Back</a>
    </div>
    <div class="card" style="max-width:600px;">
      ${error ? `<div class="alert alert-error">${error}</div>` : ''}
      <form method="POST" action="/admin/collections">
        <div class="form-group">
          <label class="form-label">Name</label>
          <input class="form-input" type="text" name="name" placeholder="Men's Essentials" required />
        </div>
        <div class="form-group">
          <label class="form-label">Slug</label>
          <input class="form-input" type="text" name="slug" placeholder="mens-essentials" required />
        </div>
        <div class="form-group">
          <label class="form-label">Gender</label>
          <select class="form-select" name="gender">
            <option value="MEN">Men</option>
            <option value="WOMEN">Women</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Description (optional)</label>
          <textarea class="form-textarea" name="description" placeholder="Collection description..."></textarea>
        </div>
        <button type="submit" class="btn btn-primary">Create Collection</button>
      </form>
    </div>
  `
  res.send(layout('New Collection', body, 'collections'))
}

export async function postCollection(req: Request, res: Response) {
  const { name, slug, gender, description } = req.body
  try {
    await prisma.collection.create({ data: { name, slug, gender, description: description || null } })
    res.redirect('/admin/collections')
  } catch {
    res.redirect(`/admin/collections/new?error=Slug already exists or invalid data`)
  }
}

export async function getEditCollection(req: Request, res: Response) {
  const id = req.params.id as string
  const collection = await prisma.collection.findUnique({ where: { id } })
  if (!collection) return res.redirect('/admin/collections')
  const error = req.query.error || ''

  const body = `
    <div class="page-header">
      <span class="page-title">Edit Collection</span>
      <a href="/admin/collections" class="btn btn-secondary">← Back</a>
    </div>
    <div class="card" style="max-width:600px;">
      ${error ? `<div class="alert alert-error">${error}</div>` : ''}
      <form method="POST" action="/admin/collections/${collection.id}/edit">
        <div class="form-group">
          <label class="form-label">Name</label>
          <input class="form-input" type="text" name="name" value="${collection.name}" required />
        </div>
        <div class="form-group">
          <label class="form-label">Slug</label>
          <input class="form-input" type="text" name="slug" value="${collection.slug}" required />
        </div>
        <div class="form-group">
          <label class="form-label">Gender</label>
          <select class="form-select" name="gender">
            <option value="MEN" ${collection.gender === 'MEN' ? 'selected' : ''}>Men</option>
            <option value="WOMEN" ${collection.gender === 'WOMEN' ? 'selected' : ''}>Women</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea class="form-textarea" name="description">${collection.description || ''}</textarea>
        </div>
        <button type="submit" class="btn btn-primary">Save Changes</button>
      </form>
    </div>
  `
  res.send(layout('Edit Collection', body, 'collections'))
}

export async function postEditCollection(req: Request, res: Response) {
  const id = req.params.id as string
  const { name, slug, gender, description } = req.body
  try {
    await prisma.collection.update({
      where: { id },
      data: { name, slug, gender, description: description || null },
    })
    res.redirect('/admin/collections')
  } catch {
    res.redirect(`/admin/collections/${id}/edit?error=Failed to update`)
  }
}

export async function deleteCollection(req: Request, res: Response) {
  const id = req.params.id as string
  await prisma.collection.delete({ where: { id } })
  res.redirect('/admin/collections')
}