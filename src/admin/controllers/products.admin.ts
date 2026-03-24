import { Request, Response } from 'express'
import prisma from '../../lib/prisma'
import { layout } from '../views/layout'
import { supabaseAdmin } from '../../lib/supabase'
import { logActivity } from '../lib/logger'
import path from 'path'

export async function getProducts(req: Request, res: Response) {
  const products = await prisma.product.findMany({
    include: {
      collection: true,
      images: true,
      variants: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  const rows = products.map(p => {
    const primary = p.images.find(i => i.isPrimary)?.url || p.images[0]?.url
    const totalStock = p.variants.reduce((sum, v) => sum + v.stock, 0)
    const stockColor = totalStock === 0 ? '#ff6b6b' : totalStock <= 10 ? '#ffb347' : '#888'

    return `
    <tr>
      <td>${primary ? `<img src="${primary}" class="img-thumb" />` : '<div class="img-thumb" style="background:#1a1a1a;"></div>'}</td>
      <td>
        <strong>${p.name}</strong><br/>
        <span style="color:#888;font-size:0.7rem;">${p.slug}</span>
      </td>
      <td style="color:#888;">${p.collection?.name || '—'}</td>
      <td><span class="badge badge-${p.gender === 'MEN' ? 'confirmed' : 'processing'}">${p.gender}</span></td>
      <td>${p.variants.length}</td>
      <td style="color:${stockColor};font-weight:600;">${totalStock === 0 ? 'Out of stock' : totalStock}</td>
      <td>${p.isFeatured ? '<span class="badge badge-shipped">Featured</span>' : '—'}</td>
      <td>
        <div style="display:flex;gap:0.5rem;">
          <a href="/admin/products/${p.id}/edit" class="btn btn-sm btn-secondary">Edit</a>
          <button type="button" onclick="deleteProduct('${p.id}', '${p.name.replace(/'/g, "\\'")}')" class="btn btn-sm btn-danger">Delete</button>
        </div>
      </td>
    </tr>
  `
  }).join('')
  const body = `
  <div class="page-header">
    <span class="page-title">Products</span>
    <a href="/admin/products/new" class="btn btn-primary">+ New Product</a>
  </div>
  <div class="card">
    ${products.length === 0 ? '<div class="empty-state">No products yet</div>' : `
      <table>
        <thead><tr><th></th><th>Product</th><th>Collection</th><th>Gender</th><th>Variants</th><th>Stock</th><th>Featured</th><th></th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    `}
  </div>

 <!-- Delete Confirmation Modal -->
<div id="delete-modal" style="
  display:none;position:fixed;inset:0;z-index:9999;
  background:rgba(0,0,0,0.8);backdrop-filter:blur(4px);
  align-items:center;justify-content:center;
">
  <div style="
    background:#111;border:1px solid #1a1a1a;
    padding:2rem;width:100%;max-width:400px;margin:1rem;
  ">
    <p style="font-size:0.6rem;letter-spacing:0.2em;text-transform:uppercase;color:#888;margin-bottom:0.75rem;">
      Confirm Deletion
    </p>
    <p style="font-size:1rem;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;color:#fff;margin-bottom:0.5rem;" id="delete-modal-name"></p>
    <p style="font-size:0.75rem;color:#888;margin-bottom:2rem;line-height:1.6;">
      This will permanently delete the product, all its variants and images. This cannot be undone.
    </p>
    <div style="display:flex;gap:0.75rem;">
      <button
        onclick="confirmDelete()"
        style="flex:1;padding:0.9rem;background:#ff6b6b;border:none;color:#fff;font-size:0.65rem;letter-spacing:0.15em;text-transform:uppercase;font-weight:600;cursor:pointer;font-family:inherit;"
      >
        Delete Product
      </button>
      <button
        onclick="closeModal()"
        style="flex:1;padding:0.9rem;background:none;border:1px solid #333;color:#888;font-size:0.65rem;letter-spacing:0.15em;text-transform:uppercase;cursor:pointer;font-family:inherit;"
      >
        Cancel
      </button>
    </div>
  </div>
</div>

<script>
  let pendingDeleteId = null

  function deleteProduct(id, name) {
    pendingDeleteId = id
    document.getElementById('delete-modal-name').textContent = name
    const modal = document.getElementById('delete-modal')
    modal.style.display = 'flex'
  }

  function closeModal() {
    pendingDeleteId = null
    document.getElementById('delete-modal').style.display = 'none'
  }

function confirmDelete() {
  if (!pendingDeleteId) return
  closeModal()
  fetch('/admin/products/' + pendingDeleteId + '/delete', { method: 'POST' })
    .then(res => {
      if (!res.ok) return res.json().then(d => { throw new Error(d.error) })
      window.location.href = '/admin/products'
    })
    .catch(err => alert('Failed to delete: ' + err.message))
}

  // Close on backdrop click
  document.getElementById('delete-modal').addEventListener('click', function(e) {
    if (e.target === this) closeModal()
  })
</script>
`
  res.send(layout('Products', body, 'products'))
}

export async function getNewProduct(req: Request, res: Response) {
  const collections = await prisma.collection.findMany({ orderBy: { name: 'asc' } })
  const error = req.query.error || ''

  const collectionOptions = collections.map(c =>
    `<option value="${c.id}">${c.name}</option>`
  ).join('')

  const body = `
    <div class="page-header">
      <span class="page-title">New Product</span>
      <a href="/admin/products" class="btn btn-secondary">← Back</a>
    </div>
    ${error ? `<div class="alert alert-error">${error}</div>` : ''}
    <form method="POST" action="/admin/products" enctype="multipart/form-data">
      <div style="display:grid;grid-template-columns:1fr 380px;gap:1.5rem;align-items:start;">
        <div>
          <div class="card" style="margin-bottom:1.5rem;">
            <div style="font-size:0.65rem;letter-spacing:0.2em;text-transform:uppercase;color:#888;margin-bottom:1.5rem;">Product Info</div>
            <div class="form-group">
              <label class="form-label">Product Name</label>
              <input class="form-input" type="text" name="name" placeholder="Classic White Tee" required />
            </div>
            <div class="form-group">
              <label class="form-label">Slug</label>
              <input class="form-input" type="text" name="slug" placeholder="classic-white-tee" required />
            </div>
            <div class="form-group">
              <label class="form-label">Description</label>
              <textarea class="form-textarea" name="description" placeholder="Product description..."></textarea>
            </div>
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">Collection</label>
                <select class="form-select" name="collectionId">
                  <option value="">No collection</option>
                  ${collectionOptions}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Gender</label>
                <select class="form-select" name="gender">
                  <option value="MEN">Men</option>
                  <option value="WOMEN">Women</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label style="display:flex;align-items:center;gap:0.75rem;cursor:pointer;">
                <input type="checkbox" name="isFeatured" value="true" />
                <span class="form-label" style="margin:0;">Featured product</span>
              </label>
            </div>
          </div>

          <div class="card" style="margin-bottom:1.5rem;">
            <div style="font-size:0.65rem;letter-spacing:0.2em;text-transform:uppercase;color:#888;margin-bottom:1.5rem;">
              Variants <span style="color:#444;margin-left:0.5rem;">(at least one required)</span>
            </div>
            <div id="variants-container">
              ${variantRow(0)}
            </div>
            <button type="button" onclick="addVariant()" class="btn btn-secondary btn-sm" style="margin-top:1rem;">+ Add Variant</button>
          </div>
        </div>

        <div>
          <div class="card" style="margin-bottom:1.5rem;">
            <div style="font-size:0.65rem;letter-spacing:0.2em;text-transform:uppercase;color:#888;margin-bottom:1.5rem;">Images</div>
            <div class="form-group">
              <label class="form-label">Upload Images</label>
              <input class="form-input" type="file" name="images" multiple accept="image/*" style="padding:0.5rem;" />
              <p style="font-size:0.65rem;color:#555;margin-top:0.5rem;">First image will be set as primary. Max 5 images.</p>
            </div>
          </div>
          <button type="submit" class="btn btn-primary" style="width:100%;padding:1.25rem;">Create Product</button>
        </div>
      </div>
    </form>

    <script>
      let variantCount = 1
      function variantRow(i) {
        return \`${variantRow('VARINDEX')}\`.replace(/VARINDEX/g, i)
      }
      function addVariant() {
        const container = document.getElementById('variants-container')
        const div = document.createElement('div')
        div.innerHTML = variantRow(variantCount++)
        container.appendChild(div)
      }
    </script>
  `
  res.send(layout('New Product', body, 'products'))
}

function variantRow(i: number | string) {
  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']
  const sizeOptions = sizes.map(s => `<option value="${s}">${s}</option>`).join('')
  return `
    <div style="border:1px solid #1a1a1a;padding:1rem;margin-bottom:1rem;">
      <div class="form-grid-3">
        <div class="form-group">
          <label class="form-label">Size</label>
          <select class="form-select" name="variants[${i}][size]">${sizeOptions}</select>
        </div>
        <div class="form-group">
          <label class="form-label">Color</label>
          <input class="form-input" type="text" name="variants[${i}][color]" placeholder="Black" />
        </div>
        <div class="form-group">
          <label class="form-label">Color Hex</label>
          <input class="form-input" type="text" name="variants[${i}][colorHex]" placeholder="#000000" />
        </div>
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Price (R)</label>
          <input class="form-input" type="number" step="0.01" name="variants[${i}][price]" placeholder="599.00" required />
        </div>
        <div class="form-group">
          <label class="form-label">Sale Price (optional)</label>
          <input class="form-input" type="number" step="0.01" name="variants[${i}][salePrice]" placeholder="—" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Stock</label>
        <input class="form-input" type="number" name="variants[${i}][stock]" placeholder="10" value="10" required />
      </div>
      <div class="form-group">
        <label class="form-label">SKU</label>
        <input class="form-input" type="text" name="variants[${i}][sku]" placeholder="FLW-BLK-M-001" />
      </div>
    </div>
  `
}

export async function postProduct(req: Request, res: Response) {
  try {
    const { name, slug, description, collectionId, gender, isFeatured } = req.body
    const files = req.files as Express.Multer.File[]

    const imageUrls: string[] = []
    for (const file of files || []) {
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(file.originalname)}`
      const { error } = await supabaseAdmin.storage
        .from(process.env.SUPABASE_STORAGE_BUCKET || 'product-images')
        .upload(fileName, file.buffer, { contentType: file.mimetype, upsert: false })
      if (!error) {
        const { data } = supabaseAdmin.storage
          .from(process.env.SUPABASE_STORAGE_BUCKET || 'product-images')
          .getPublicUrl(fileName)
        imageUrls.push(data.publicUrl)
      }
    }

    const variantsRaw = req.body.variants || {}
    const variants = Object.values(variantsRaw) as any[]

    const product = await prisma.product.create({
      data: {
        name, slug,
        description: description || null,
        gender,
        isFeatured: isFeatured === 'true',
        isActive: true,
        collectionId: collectionId || null,
        images: {
          create: imageUrls.map((url, i) => ({
            url, isPrimary: i === 0, position: i,
          })),
        },
        variants: {
          create: variants.map(v => ({
            size: v.size,
            color: v.color || 'Default',
            colorHex: v.colorHex || '#000000',
            price: parseFloat(v.price),
            salePrice: v.salePrice ? parseFloat(v.salePrice) : null,
            stock: parseInt(v.stock),
            sku: v.sku || null,
          })),
        },
      },
    })

    await logActivity('PRODUCT_CREATED', 'Product', `Product "${name}" created`, product.id)

    res.redirect('/admin/products')
  } catch (err: any) {
    console.error(err)
    res.redirect(`/admin/products/new?error=${encodeURIComponent(err.message)}`)
  }
}

export async function getEditProduct(req: Request, res: Response) {
  const id = req.params.id as string
  const product = await prisma.product.findUnique({
    where: { id },
    include: { collection: true, images: true, variants: true },
  })
  if (!product) return res.redirect('/admin/products')

  const collections = await prisma.collection.findMany({ orderBy: { name: 'asc' } })
  const error = req.query.error || ''

  const collectionOptions = collections.map(c =>
    `<option value="${c.id}" ${product.collectionId === c.id ? 'selected' : ''}>${c.name}</option>`
  ).join('')

  const existingImages = product.images.map(img => `
  <div style="position:relative;display:inline-block;margin-right:8px;margin-bottom:8px;">
    <img src="${img.url}" class="img-thumb-lg" />
    <button
      type="button"
      onclick="deleteImage('${product.id}', '${img.id}')"
      style="position:absolute;top:2px;right:2px;background:#ff6b6b;border:none;color:#fff;width:20px;height:20px;cursor:pointer;font-size:0.7rem;border-radius:50%;"
    >×</button>
    ${img.isPrimary ? '<span style="display:block;font-size:0.55rem;color:#888;text-align:center;margin-top:2px;">Primary</span>' : ''}
  </div>
`).join('')

  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']
  const existingVariants = product.variants.map((v, i) => {
    const sizeOptions = sizes.map(s => `<option value="${s}" ${v.size === s ? 'selected' : ''}>${s}</option>`).join('')
    return `
      <div style="border:1px solid #1a1a1a;padding:1rem;margin-bottom:1rem;">
        <input type="hidden" name="variantIds[${i}]" value="${v.id}" />
        <div class="form-grid-3">
          <div class="form-group">
            <label class="form-label">Size</label>
            <select class="form-select" name="variants[${i}][size]">${sizeOptions}</select>
          </div>
          <div class="form-group">
            <label class="form-label">Color</label>
            <input class="form-input" type="text" name="variants[${i}][color]" value="${v.color}" />
          </div>
          <div class="form-group">
            <label class="form-label">Color Hex</label>
            <input class="form-input" type="text" name="variants[${i}][colorHex]" value="${v.colorHex}" />
          </div>
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Price (R)</label>
            <input class="form-input" type="number" step="0.01" name="variants[${i}][price]" value="${v.price}" required />
          </div>
          <div class="form-group">
            <label class="form-label">Sale Price</label>
            <input class="form-input" type="number" step="0.01" name="variants[${i}][salePrice]" value="${v.salePrice || ''}" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Stock</label>
          <input class="form-input" type="number" name="variants[${i}][stock]" value="${v.stock}" required />
        </div>
      </div>
    `
  }).join('')

  const body = `
    <div class="page-header">
      <span class="page-title">Edit: ${product.name}</span>
      <a href="/admin/products" class="btn btn-secondary">← Back</a>
    </div>
    ${error ? `<div class="alert alert-error">${error}</div>` : ''}
    <form method="POST" action="/admin/products/${product.id}/edit" enctype="multipart/form-data">
      <div style="display:grid;grid-template-columns:1fr 380px;gap:1.5rem;align-items:start;">
        <div>
          <div class="card" style="margin-bottom:1.5rem;">
            <div style="font-size:0.65rem;letter-spacing:0.2em;text-transform:uppercase;color:#888;margin-bottom:1.5rem;">Product Info</div>
            <div class="form-group">
              <label class="form-label">Name</label>
              <input class="form-input" type="text" name="name" value="${product.name}" required />
            </div>
            <div class="form-group">
              <label class="form-label">Slug</label>
              <input class="form-input" type="text" name="slug" value="${product.slug}" required />
            </div>
            <div class="form-group">
              <label class="form-label">Description</label>
              <textarea class="form-textarea" name="description">${product.description || ''}</textarea>
            </div>
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">Collection</label>
                <select class="form-select" name="collectionId">
                  <option value="">No collection</option>
                  ${collectionOptions}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Gender</label>
                <select class="form-select" name="gender">
                  <option value="MEN" ${product.gender === 'MEN' ? 'selected' : ''}>Men</option>
                  <option value="WOMEN" ${product.gender === 'WOMEN' ? 'selected' : ''}>Women</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label style="display:flex;align-items:center;gap:0.75rem;cursor:pointer;">
                <input type="checkbox" name="isFeatured" value="true" ${product.isFeatured ? 'checked' : ''} />
                <span class="form-label" style="margin:0;">Featured product</span>
              </label>
            </div>
          </div>

          <div class="card" style="margin-bottom:1.5rem;">
            <div style="font-size:0.65rem;letter-spacing:0.2em;text-transform:uppercase;color:#888;margin-bottom:1.5rem;">Variants</div>
            ${existingVariants}
          </div>
        </div>

        <div>
          <div class="card" style="margin-bottom:1.5rem;">
            <div style="font-size:0.65rem;letter-spacing:0.2em;text-transform:uppercase;color:#888;margin-bottom:1rem;">Current Images</div>
            <div style="margin-bottom:1rem;">${existingImages || '<p style="color:#888;font-size:0.75rem;">No images</p>'}</div>
            <div style="font-size:0.65rem;letter-spacing:0.2em;text-transform:uppercase;color:#888;margin:1rem 0 0.5rem;">Add More Images</div>
            <input class="form-input" type="file" name="images" multiple accept="image/*" style="padding:0.5rem;" />
          </div>
          <button type="submit" class="btn btn-primary" style="width:100%;padding:1.25rem;">Save Changes</button>
        </div>
      </div>
    </form>
    <script>
    function deleteImage(productId, imageId) {
      if (!confirm('Delete this image?')) return
      fetch('/admin/products/' + productId + '/images/' + imageId + '/delete', {
        method: 'POST',
      }).then(() => {
        window.location.href = '/admin/products/' + productId + '/edit'
      }).catch(() => {
        alert('Failed to delete image')
      })
    }
  </script>
  `
  res.send(layout(`Edit: ${product.name}`, body, 'products'))
}

export async function postEditProduct(req: Request, res: Response) {
  const id = req.params.id as string
  try {
    const { name, slug, description, collectionId, gender, isFeatured } = req.body
    const files = req.files as Express.Multer.File[]

    for (const file of files || []) {
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(file.originalname)}`
      const { error } = await supabaseAdmin.storage
        .from(process.env.SUPABASE_STORAGE_BUCKET || 'product-images')
        .upload(fileName, file.buffer, { contentType: file.mimetype })
      if (!error) {
        const { data } = supabaseAdmin.storage
          .from(process.env.SUPABASE_STORAGE_BUCKET || 'product-images')
          .getPublicUrl(fileName)
        const currentCount = await prisma.productImage.count({ where: { productId: id } })
        await prisma.productImage.create({
          data: {
            productId: id,
            url: data.publicUrl,
            isPrimary: currentCount === 0,
            position: currentCount,
          },
        })
      }
    }

    const variantsRaw = req.body.variants || {}
    const variantIds = req.body.variantIds || {}
    const variantEntries = Object.entries(variantsRaw) as [string, any][]

    for (const [i, v] of variantEntries) {
      const variantId = variantIds[i] as string
      if (variantId) {
        await prisma.productVariant.update({
          where: { id: variantId },
          data: {
            size: v.size,
            color: v.color,
            colorHex: v.colorHex,
            price: parseFloat(v.price),
            salePrice: v.salePrice ? parseFloat(v.salePrice) : null,
            stock: parseInt(v.stock),
          },
        })
      }
    }

    await prisma.product.update({
      where: { id },
      data: {
        name, slug,
        description: description || null,
        gender,
        isFeatured: isFeatured === 'true',
        collectionId: collectionId || null,
      },
    })

    await logActivity('PRODUCT_UPDATED', 'Product', `Product "${name}" updated`, id)

    res.redirect('/admin/products')
  } catch (err: any) {
    res.redirect(`/admin/products/${id}/edit?error=${encodeURIComponent(err.message)}`)
  }
}

export async function deleteProduct(req: Request, res: Response) {
  const id = req.params.id as string
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { images: true },
    })

    if (!product) {
      return res.status(404).json({ error: 'Product not found' })
    }

    // Delete images from Supabase storage
    for (const image of product.images) {
      const fileName = image.url.split('/').pop()
      if (fileName) {
        await supabaseAdmin.storage
          .from(process.env.SUPABASE_STORAGE_BUCKET || 'product-images')
          .remove([fileName])
      }
    }

    // Delete all relations in correct order
    await prisma.productImage.deleteMany({ where: { productId: id } })
    await prisma.cart.deleteMany({ where: { productId: id } })
    await prisma.orderItem.deleteMany({ where: { productId: id } })
    await prisma.productVariant.deleteMany({ where: { productId: id } })
    await prisma.product.delete({ where: { id } })

    await logActivity('PRODUCT_DELETED', 'Product', `Product "${product.name}" deleted`, id)

    res.json({ success: true })
  } catch (err: any) {
    console.error('Delete product error:', err)
    res.status(500).json({ error: err.message })
  }
}

export async function deleteProductImage(req: Request, res: Response) {
  const productId = req.params.id as string
  const imageId = req.params.imageId as string
  const image = await prisma.productImage.findUnique({ where: { id: imageId } })
  if (image) {
    const fileName = image.url.split('/').pop()
    if (fileName) {
      await supabaseAdmin.storage
        .from(process.env.SUPABASE_STORAGE_BUCKET || 'product-images')
        .remove([fileName])
    }
    await prisma.productImage.delete({ where: { id: imageId } })
  }
  res.redirect(`/admin/products/${productId}/edit`)
}