/**
 * Canva Integration Service
 * Integración con Canva MCP para generación de diseños
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// IDs de assets subidos a Canva
export const CANVA_ASSETS = {
  logoFull: 'MAG8-tcewFQ',
  logoIcon: 'MAG8-lpjasE',
};

// Brand Kits disponibles
export const CANVA_BRAND_KITS = {
  default: 'kADdAKEsaX8',
  revive: 'kAGkwNNgWuk',
};

interface CanvaDesign {
  design_id: string;
  title: string;
  thumbnail: {
    url: string;
    width: number;
    height: number;
  };
  edit_url: string;
  created_at: number;
  updated_at: number;
  page_count?: number;
}

interface CanvaSearchResult {
  items: CanvaDesign[];
  continuation?: string;
}

interface CanvaExportResult {
  url: string;
  format: string;
}

/**
 * Ejecutar comando MCP de Canva
 */
async function executeCanvaMCP(tool: string, input: Record<string, unknown>): Promise<unknown> {
  const inputJson = JSON.stringify(input).replace(/"/g, '\\"');
  const command = `manus-mcp-cli tool call ${tool} --server canva --input "${inputJson}"`;
  
  try {
    const { stdout, stderr } = await execAsync(command, { timeout: 60000 });
    
    // Buscar el resultado JSON en la salida
    const resultMatch = stdout.match(/Tool execution result:\s*(\{[\s\S]*\})/);
    if (resultMatch) {
      return JSON.parse(resultMatch[1]);
    }
    
    // Si hay error, lanzar excepción
    if (stderr || stdout.includes('Error:')) {
      throw new Error(stderr || stdout);
    }
    
    return null;
  } catch (error) {
    console.error('Canva MCP Error:', error);
    throw error;
  }
}

/**
 * Buscar diseños en Canva
 */
export async function searchDesigns(query: string, sortBy: string = 'relevance'): Promise<CanvaSearchResult> {
  try {
    const result = await executeCanvaMCP('search-designs', {
      query,
      sort_by: sortBy,
      user_intent: `Search for ${query} designs for Clínica Miró`,
    });
    
    return result as CanvaSearchResult;
  } catch (error) {
    console.error('Error searching Canva designs:', error);
    return { items: [] };
  }
}

/**
 * Obtener información de un diseño
 */
export async function getDesign(designId: string): Promise<CanvaDesign | null> {
  try {
    const result = await executeCanvaMCP('get-design', {
      design_id: designId,
      user_intent: 'Get design details for Clínica Miró campaign',
    });
    
    return result as CanvaDesign;
  } catch (error) {
    console.error('Error getting Canva design:', error);
    return null;
  }
}

/**
 * Obtener formatos de exportación disponibles
 */
export async function getExportFormats(designId: string): Promise<string[]> {
  try {
    const result = await executeCanvaMCP('get-export-formats', {
      design_id: designId,
      user_intent: 'Check export formats for design',
    }) as { formats?: string[] };
    
    return result?.formats || ['pdf', 'png', 'jpg'];
  } catch (error) {
    console.error('Error getting export formats:', error);
    return ['pdf', 'png', 'jpg'];
  }
}

/**
 * Exportar diseño a un formato específico
 */
export async function exportDesign(
  designId: string, 
  format: 'pdf' | 'png' | 'jpg' | 'pptx' | 'mp4' = 'png'
): Promise<CanvaExportResult | null> {
  try {
    const result = await executeCanvaMCP('export-design', {
      design_id: designId,
      format: { type: format },
      user_intent: `Export design as ${format} for Clínica Miró campaign`,
    });
    
    return result as CanvaExportResult;
  } catch (error) {
    console.error('Error exporting Canva design:', error);
    return null;
  }
}

/**
 * Listar Brand Kits disponibles
 */
export async function listBrandKits(): Promise<unknown[]> {
  try {
    const result = await executeCanvaMCP('list-brand-kits', {
      user_intent: 'List brand kits for Clínica Miró',
    }) as { items?: unknown[] };
    
    return result?.items || [];
  } catch (error) {
    console.error('Error listing brand kits:', error);
    return [];
  }
}

/**
 * Crear carpeta en Canva
 */
export async function createFolder(name: string, parentFolderId: string = 'root'): Promise<string | null> {
  try {
    const result = await executeCanvaMCP('create-folder', {
      name,
      parent_folder_id: parentFolderId,
      user_intent: `Create folder ${name} for Clínica Miró assets`,
    }) as { folder_id?: string };
    
    return result?.folder_id || null;
  } catch (error) {
    console.error('Error creating Canva folder:', error);
    return null;
  }
}

/**
 * Subir asset desde URL
 */
export async function uploadAsset(url: string, name: string): Promise<string | null> {
  try {
    const result = await executeCanvaMCP('upload-asset-from-url', {
      url,
      name,
      user_intent: `Upload ${name} asset for Clínica Miró`,
    }) as { job?: { asset?: { id?: string } } };
    
    return result?.job?.asset?.id || null;
  } catch (error) {
    console.error('Error uploading asset to Canva:', error);
    return null;
  }
}

/**
 * Generar diseño con IA (requiere Canva Pro)
 */
export async function generateDesign(
  query: string,
  designType: string = 'instagram_post',
  brandKitId?: string,
  assetIds?: string[]
): Promise<unknown | null> {
  try {
    const input: Record<string, unknown> = {
      query,
      design_type: designType,
      user_intent: `Generate ${designType} design for Clínica Miró: ${query.substring(0, 100)}`,
    };
    
    if (brandKitId) {
      input.brand_kit_id = brandKitId;
    }
    
    if (assetIds && assetIds.length > 0) {
      input.asset_ids = assetIds;
    }
    
    const result = await executeCanvaMCP('generate-design', input);
    return result;
  } catch (error) {
    console.error('Error generating Canva design:', error);
    return null;
  }
}

/**
 * Obtener diseños dentales existentes
 */
export async function getDentalDesigns(): Promise<CanvaDesign[]> {
  const result = await searchDesigns('dental');
  return result.items || [];
}

/**
 * Obtener diseños de Instagram
 */
export async function getInstagramDesigns(): Promise<CanvaDesign[]> {
  const result = await searchDesigns('instagram post');
  return result.items || [];
}

export default {
  CANVA_ASSETS,
  CANVA_BRAND_KITS,
  searchDesigns,
  getDesign,
  getExportFormats,
  exportDesign,
  listBrandKits,
  createFolder,
  uploadAsset,
  generateDesign,
  getDentalDesigns,
  getInstagramDesigns,
};
