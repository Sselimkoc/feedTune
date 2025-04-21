import { existsSync } from 'fs';
import { NextResponse } from 'next/server';
import path from 'path';

/**
 * Doküman varlığını kontrol eden API endpoint
 * 
 * @param {Request} request - Gelen istek nesnesi
 * @returns {NextResponse} - Dokümanın varlığı hakkında yanıt
 */
export async function GET(request) {
  try {
    // URL'den doküman adını al
    const { searchParams } = new URL(request.url);
    const docName = searchParams.get('doc');
    
    if (!docName) {
      return NextResponse.json({ 
        success: false, 
        message: 'Doküman adı belirtilmemiş' 
      }, { status: 400 });
    }
    
    // Doküman yolunu oluştur
    const docPath = path.join(process.cwd(), 'src', 'docs', docName);
    
    // Dokümanın varlığını kontrol et
    const exists = existsSync(docPath);
    
    return NextResponse.json({ 
      success: true, 
      exists,
      path: docPath
    });
    
  } catch (error) {
    console.error('Doküman kontrol hatası:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Doküman kontrolü sırasında bir hata oluştu',
      error: error.message
    }, { status: 500 });
  }
} 