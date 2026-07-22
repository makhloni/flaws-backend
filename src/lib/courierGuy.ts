import axios from 'axios'

const client = axios.create({
  baseURL: process.env.COURIER_GUY_SANDBOX === 'true'
    ? 'https://api.shiplogic.com'
    : 'https://api.portal.thecourierguy.co.za',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.COURIER_GUY_API_KEY}`,
  },
  timeout: 15000,
})

interface AddressInput {
  type?: 'residential' | 'business'
  company?: string
  street: string
  suburb?: string   // maps to local_area
  city: string
  province: string
  postalCode: string
  country?: string   // ISO code, e.g. 'ZA'
  lat?: number
  lng?: number
}

interface ContactInput {
  name: string
  email?: string
  mobileNumber?: string
}

interface ParcelInput {
  description?: string
  weightKg: number
  lengthCm?: number
  widthCm?: number
  heightCm?: number
  alternativeTrackingReference?: string
}

const collectionAddress: AddressInput = {
  type: 'business',
  company: process.env.COURIER_GUY_COLLECTION_NAME!,
  street: process.env.COURIER_GUY_COLLECTION_STREET!,
  suburb: process.env.COURIER_GUY_COLLECTION_SUBURB,
  city: process.env.COURIER_GUY_COLLECTION_CITY!,
  province: process.env.COURIER_GUY_COLLECTION_PROVINCE!,
  postalCode: process.env.COURIER_GUY_COLLECTION_POSTAL_CODE!,
  country: 'ZA',
}

const collectionContact: ContactInput = {
  name: process.env.COURIER_GUY_COLLECTION_CONTACT_NAME!,
  email: process.env.COURIER_GUY_COLLECTION_EMAIL,
  mobileNumber: process.env.COURIER_GUY_COLLECTION_PHONE,
}

export async function getQuote(params: {
  deliveryAddress: AddressInput
  parcels: ParcelInput[]
}) {
  const { data } = await client.post('/rates', {
    collection_address: toCourierAddress(collectionAddress),
    delivery_address: toCourierAddress(params.deliveryAddress),
    parcels: params.parcels.map(toCourierParcel),
  })
  return data // list of rates, each with a service_level_code/service_level_id to pass into createShipment
}

export async function createShipment(params: {
  orderId: string
  deliveryAddress: AddressInput
  deliveryContact: ContactInput
  parcels: ParcelInput[]
  serviceLevelCode?: string
  declaredValue?: number
}) {
  const { data } = await client.post('/shipments', {
    collection_address: toCourierAddress(collectionAddress),
    collection_contact: toCourierContact(collectionContact),
    delivery_address: toCourierAddress(params.deliveryAddress),
    delivery_contact: toCourierContact(params.deliveryContact),
    parcels: params.parcels.map(toCourierParcel),
    service_level_code: params.serviceLevelCode || 'ECO',
    customer_reference: params.orderId,
    customer_reference_name: 'Order no.',
    declared_value: params.declaredValue,
    mute_notifications: false,
  })

 return {
  waybillId: String(data.id ?? data.short_tracking_reference),
  trackingNumber: data.short_tracking_reference ?? data.tracking_reference,
  labelUrl: data.label_url,
  raw: data,
}
}

export async function getShipmentStatus(trackingReference: string) {
  const { data } = await client.get(`/tracking/shipments/${trackingReference}`)
  return data
}

export async function cancelShipment(shortTrackingReference: string) {
  const { data } = await client.post(`/shipments/${shortTrackingReference}/cancel`)
  return data
}

// ─── Mapping helpers ─────────────────────────────────────────

function toCourierAddress(addr: AddressInput) {
  return {
    type: addr.type || 'residential',
    company: addr.company || '',
    street_address: addr.street,
    local_area: addr.suburb || addr.city,
    city: addr.city,
    zone: addr.province,
    code: addr.postalCode,
    country: addr.country || 'ZA',
    ...(addr.lat && addr.lng ? { lat: addr.lat, lng: addr.lng } : {}),
  }
}

function toCourierContact(contact: ContactInput) {
  return {
    name: contact.name,
    mobile_number: contact.mobileNumber || '',
    email: contact.email || '',
  }
}

function toCourierParcel(p: ParcelInput) {
  return {
    parcel_description: p.description,
    submitted_length_cm: p.lengthCm ?? 30,
    submitted_width_cm: p.widthCm ?? 25,
    submitted_height_cm: p.heightCm ?? 10,
    submitted_weight_kg: p.weightKg,
    ...(p.alternativeTrackingReference
      ? { alternative_tracking_reference: p.alternativeTrackingReference }
      : {}),
  }
}