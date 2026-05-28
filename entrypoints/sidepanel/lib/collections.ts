import { storage } from 'wxt/utils/storage';
import { generateStructured, type GenerateResult } from './ai';
import type { PageContent } from './extractor';

export type FieldType = 'string' | 'number' | 'url' | 'date';

export type Field = { key: string; label: string; type: FieldType };

export type Item = {
  id: string;
  source: { url: string; title: string; capturedAt: number };
  values: Record<string, unknown>;
};

export type Collection = {
  id: string;
  name: string;
  schema: Field[];
  items: Item[];
  createdAt: number;
  updatedAt: number;
};

export const collections = storage.defineItem<Collection[]>('local:collections', {
  fallback: [],
});

export async function listCollections(): Promise<Collection[]> {
  return collections.getValue();
}

export async function deleteCollection(id: string): Promise<void> {
  const current = await collections.getValue();
  await collections.setValue(current.filter((c) => c.id !== id));
}

export async function deleteItem(collectionId: string, itemId: string): Promise<void> {
  const current = await collections.getValue();
  await collections.setValue(
    current.map((c) =>
      c.id === collectionId
        ? { ...c, items: c.items.filter((i) => i.id !== itemId), updatedAt: Date.now() }
        : c,
    ),
  );
}

async function createCollectionAndFirstItem(
  name: string,
  schema: Field[],
  firstItem: Item,
): Promise<Collection> {
  const now = Date.now();
  const newCollection: Collection = {
    id: crypto.randomUUID(),
    name: name.trim().slice(0, 60) || 'lista',
    schema,
    items: [firstItem],
    createdAt: now,
    updatedAt: now,
  };
  const current = await collections.getValue();
  await collections.setValue([newCollection, ...current]);
  return newCollection;
}

async function appendItemToCollection(collectionId: string, item: Item): Promise<Collection | null> {
  const current = await collections.getValue();
  let updated: Collection | null = null;
  const next = current.map((c) => {
    if (c.id !== collectionId) return c;
    updated = { ...c, items: [item, ...c.items], updatedAt: Date.now() };
    return updated;
  });
  if (!updated) return null;
  await collections.setValue(next);
  return updated;
}

const VALID_FIELD_TYPES: ReadonlySet<FieldType> = new Set(['string', 'number', 'url', 'date']);

const RESERVED_KEYS: ReadonlySet<string> = new Set([
  'type',
  'required',
  'key',
  'label',
  'schema',
  'value',
  'properties',
  'items',
  'additionalproperties',
  'fields',
  'data',
]);

const INFER_AND_EXTRACT_SYSTEM_PROMPT = `Sos un extractor de datos web. El usuario te da una página y vos:
1. Identificás qué tipo de cosa es (y si es un producto, qué SUBTIPO: mueble, tecnología, ropa, electrodoméstico, herramienta, etc.).
2. Proponés 5-10 campos que tendría sentido trackear si juntara varias páginas del mismo tipo. INCLUÍ campos genéricos (precio, marca) Y campos específicos del subtipo (medidas, materiales, specs técnicas, etc.).
3. Extraés los valores específicos de esta página.

EJEMPLOS por tipo:

- Propiedad inmobiliaria → precio, moneda, ambientes, m2_cubiertos, m2_totales, barrio, direccion, antiguedad, expensas
- Paper académico → titulo, autores, anio, revista, doi, citas, abstract_corto
- Artículo / noticia → titulo, autor, fecha_publicado, tema, fuente, tiempo_lectura
- Trabajo / job posting → empresa, posicion, salario, modalidad, ubicacion, seniority, stack
- Receta → nombre, tiempo_preparacion, porciones, dificultad, ingredientes_principales

PRODUCTO E-COMMERCE — adaptá los campos al SUBTIPO de producto:
- MUEBLE → nombre, precio, marca, material, dimensiones, color, peso, capacidad, garantia
- TECNOLOGÍA (notebook/celular/TV/etc) → nombre, precio, marca, modelo, procesador, ram, almacenamiento, pantalla, bateria, sistema_operativo, conectividad
- ROPA / CALZADO → nombre, precio, marca, talle, material, color, genero, temporada
- ELECTRODOMÉSTICO → nombre, precio, marca, modelo, capacidad, consumo, eficiencia_energetica, dimensiones, color
- HERRAMIENTA → nombre, precio, marca, potencia, voltaje, peso, accesorios_incluidos
- LIBRO → titulo, autor, editorial, anio, paginas, isbn, idioma, genero
- ALIMENTO / BEBIDA → nombre, precio, marca, cantidad, ingredientes, calorias, origen
- OTRO PRODUCTO → adaptá los campos a las características visibles en la página

REGLAS DURAS:
- Identificá el SUBTIPO antes de elegir campos. NO uses solo campos genéricos (precio, marca) si la página tiene specs concretas (medidas, materiales, capacidades, etc.) — esos son la diferencia entre una tabla útil y una vacía.
- Los nombres de campo describen el CONTENIDO (ej: "precio", "material", "ram"). NUNCA uses como key: "type", "required", "key", "label", "schema", "value", "properties", "items", "additionalProperties", "fields", "data".
- Si un valor no aparece en la página, devolvé null (NO inventes).
- Types posibles: 'string', 'number', 'url', 'date'.
- Keys en snake_case sin acentos. Labels en español natural ('Precio', 'Dimensiones').
- Para dimensiones, podés devolverlas como string ("150 x 80 x 75 cm") o desglosadas si es claro (ancho_cm, alto_cm, profundidad_cm). Lo que sea más útil para esta categoría.

Output: SOLO JSON, sin markdown, sin explicación, sin texto antes o después.
Shape EXACTA:
{
  "fields": [
    {"key": "precio", "label": "Precio", "type": "number"},
    {"key": "material", "label": "Material", "type": "string"}
  ],
  "data": {
    "precio": 89999,
    "material": "MDF símil mármol"
  }
}`;

const INFER_RESPONSE_SCHEMA = {
  type: 'object',
  required: ['fields', 'data'],
  properties: {
    fields: {
      type: 'array',
      minItems: 4,
      maxItems: 10,
      items: {
        type: 'object',
        required: ['key', 'label', 'type'],
        properties: {
          key: { type: 'string' },
          label: { type: 'string' },
          type: { type: 'string', enum: ['string', 'number', 'url', 'date'] },
        },
      },
    },
    data: { type: 'object' },
  },
} as const;

function buildExtractResponseSchema(schema: Field[]): object {
  const properties: Record<string, object> = {};
  for (const f of schema) {
    const baseType = f.type === 'number' ? 'number' : 'string';
    properties[f.key] = { type: baseType, nullable: true };
  }
  return {
    type: 'object',
    required: ['data'],
    properties: {
      data: {
        type: 'object',
        required: schema.map((f) => f.key),
        properties,
      },
    },
  };
}

function buildUserPrompt(page: PageContent): string {
  return `URL: ${page.url}
Título: ${page.title}

Contenido de la página:
${page.mainText}`;
}

function buildExtractSystemPrompt(schema: Field[]): string {
  const fieldsList = schema.map((f) => `- ${f.key} (${f.type}): ${f.label}`).join('\n');
  return `Sos un extractor de datos web. Extraé los campos pedidos de la página.

Campos esperados:
${fieldsList}

Reglas:
- Si un valor no aparece en la página, devolvé null para ese campo.
- Respetá los types declarados.

Output: SOLO JSON, sin markdown, sin explicación.
Shape EXACTA:
{
  "data": {"precio": 250000}
}`;
}

function validateSchema(rawFields: unknown): Field[] {
  if (!Array.isArray(rawFields)) return [];
  const result: Field[] = [];
  for (const f of rawFields) {
    if (!f || typeof f !== 'object') continue;
    const c = f as { key?: unknown; label?: unknown; type?: unknown };
    if (typeof c.key !== 'string' || c.key.length === 0) continue;
    if (typeof c.label !== 'string' || c.label.length === 0) continue;
    if (typeof c.type !== 'string') continue;
    if (!VALID_FIELD_TYPES.has(c.type as FieldType)) continue;
    if (RESERVED_KEYS.has(c.key.toLowerCase())) continue;
    result.push({ key: c.key, label: c.label, type: c.type as FieldType });
  }
  return result;
}

export type SavePageResult =
  | { ok: true; collection: Collection; item: Item }
  | { ok: false; error: 'no-key' | 'auth' | 'network' | 'parse' | 'empty' | 'unknown' | 'invalid-schema'; message?: string };

export async function savePageToNewCollection(
  name: string,
  page: PageContent,
): Promise<SavePageResult> {
  const result: GenerateResult<{ fields: unknown; data: Record<string, unknown> }> =
    await generateStructured(
      INFER_AND_EXTRACT_SYSTEM_PROMPT,
      buildUserPrompt(page),
      INFER_RESPONSE_SCHEMA,
    );

  if (!result.ok) return { ok: false, error: result.error, message: result.message };

  const schema = validateSchema(result.data.fields);
  if (schema.length === 0) {
    return { ok: false, error: 'invalid-schema', message: 'El modelo no devolvió campos válidos.' };
  }

  const cleanValues: Record<string, unknown> = {};
  for (const f of schema) {
    cleanValues[f.key] = result.data.data?.[f.key] ?? null;
  }

  const item: Item = {
    id: crypto.randomUUID(),
    source: { url: page.url, title: page.title, capturedAt: Date.now() },
    values: cleanValues,
  };

  const collection = await createCollectionAndFirstItem(name, schema, item);
  return { ok: true, collection, item };
}

export async function savePageToExistingCollection(
  collectionId: string,
  page: PageContent,
): Promise<SavePageResult> {
  const current = await collections.getValue();
  const target = current.find((c) => c.id === collectionId);
  if (!target) return { ok: false, error: 'unknown', message: 'La lista no existe.' };

  const result: GenerateResult<{ data: Record<string, unknown> }> = await generateStructured(
    buildExtractSystemPrompt(target.schema),
    buildUserPrompt(page),
    buildExtractResponseSchema(target.schema),
  );

  if (!result.ok) return { ok: false, error: result.error, message: result.message };

  const cleanValues: Record<string, unknown> = {};
  for (const f of target.schema) {
    cleanValues[f.key] = result.data.data?.[f.key] ?? null;
  }

  const item: Item = {
    id: crypto.randomUUID(),
    source: { url: page.url, title: page.title, capturedAt: Date.now() },
    values: cleanValues,
  };

  const updated = await appendItemToCollection(collectionId, item);
  if (!updated) return { ok: false, error: 'unknown', message: 'No pude actualizar la lista.' };
  return { ok: true, collection: updated, item };
}
