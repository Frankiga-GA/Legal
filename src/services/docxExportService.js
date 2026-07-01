import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';

/**
 * Convierte un texto markdown (con asteriscos para negritas) en un archivo Word (.docx)
 * @param {string} text - El texto del documento
 * @param {string} filename - Nombre del archivo a descargar
 */
export const exportToDocx = async (text, filename = 'Escrito_Legal.docx') => {
  if (!text) return;

  const paragraphs = text.split('\n').filter(p => p.trim() !== '');

  const docParagraphs = paragraphs.map(para => {
    const pTrim = para.replace(/^\s+/, '').trim();
    const pUpper = pTrim.toUpperCase();

    // Parseador básico para **negritas**
    const parts = pTrim.split(/(\*\*.*?\*\*)/g);
    
    const textRuns = parts.map(part => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return new TextRun({
          text: part.slice(2, -2),
          bold: true,
          font: 'Times New Roman',
          size: 24, // 12pt en Word = 24 medios puntos
        });
      }
      return new TextRun({
        text: part,
        font: 'Times New Roman',
        size: 24,
      });
    });

    // Detectar si el texto debería ir centrado (Ej. Sumilla, Señor Juez, Asunto)
    let alignment = AlignmentType.JUSTIFIED;
    
    // Si es "SEÑOR JUEZ", centrarlo
    if (pUpper.startsWith('SEÑOR JUEZ')) {
      alignment = AlignmentType.CENTER;
    }
    
    // Para simplificar, la sangría del apersonamiento
    const isApersonamiento = pUpper.includes('IDENTIFICADO CON DNI') || 
                             pUpper.includes('IDENTIFICADA CON DNI') || 
                             pUpper.includes('A USTED RESPETUOSAMENTE DIGO') ||
                             pUpper.includes('ANTE USTED DIGO') ||
                             pUpper.includes('A UD. DIGO');

    return new Paragraph({
      children: textRuns,
      alignment: alignment,
      spacing: {
        after: 200,
        line: 360, // Interlineado 1.5
      },
      indent: isApersonamiento ? { left: 4000 } : undefined, // Sangría a la derecha (4000 twips ~ 7cm)
    });
  });

  const doc = new Document({
    creator: 'LUSTI Legal Intelligence',
    title: filename,
    sections: [
      {
        properties: {},
        children: docParagraphs,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, filename);
};
