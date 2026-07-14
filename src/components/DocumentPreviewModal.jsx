import { X, ExternalLink, Download, FileText, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';

const DocumentPreviewModal = ({ doc, onClose }) => {
  const [loading, setLoading] = useState(true);

  // Cerrar con Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!doc) return null;

  const isDrive = doc.source === 'drive' && doc.webViewLink;
  const isImage = doc.fileUrl && /\.(jpg|jpeg|png|gif|webp)$/i.test(doc.fileUrl);
  const isPdf = doc.fileUrl && /\.pdf$/i.test(doc.fileUrl);

  // URL para el iframe
  let iframeUrl = '';
  if (isDrive) {
    // Reemplaza /view por /preview para Google Drive
    iframeUrl = doc.webViewLink.replace(/\/view.*$/, '/preview');
  } else if (isPdf) {
    iframeUrl = doc.fileUrl;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-black/90 p-4 backdrop-blur-sm">
      <div className="flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-brand-dark shadow-2xl border border-white/[0.08]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] p-4 bg-brand-dark/50">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="rounded-lg bg-brand-gold/10 p-2 text-brand-gold shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="truncate font-bold text-brand-ivory text-lg">{doc.name}</h3>
              <p className="text-xs text-brand-accent">{doc.date || 'Sin fecha'} • {doc.size || 'Desconocido'}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 shrink-0 ml-4">
            {isDrive ? (
              <a
                href={doc.webViewLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg bg-white/[0.04] px-4 py-2 text-sm font-medium text-brand-ivory hover:bg-white/[0.08] transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                <span className="hidden sm:inline">Abrir en Drive</span>
              </a>
            ) : doc.fileUrl ? (
              <a
                href={doc.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg bg-white/[0.04] px-4 py-2 text-sm font-medium text-brand-ivory hover:bg-white/[0.08] transition-colors"
                download={doc.name}
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Descargar</span>
              </a>
            ) : null}
            
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-brand-accent hover:bg-red-500/10 hover:text-red-500 transition-colors"
              title="Cerrar (Esc)"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative bg-brand-black flex items-center justify-center p-4">
          
          {loading && (isPdf || isDrive) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-brand-accent bg-brand-black z-10">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-accent border-t-brand-gold"></div>
              <p className="text-sm">Cargando visualizador...</p>
            </div>
          )}

          {isImage ? (
            <img 
              src={doc.fileUrl} 
              alt={doc.name} 
              className="max-h-full max-w-full object-contain rounded"
            />
          ) : (isPdf || isDrive) ? (
            <iframe
              src={iframeUrl}
              className="h-full w-full rounded border-0 bg-white"
              onLoad={() => setLoading(false)}
              title={`Visor de ${doc.name}`}
              allow="autoplay"
            ></iframe>
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-8 max-w-md">
              <div className="mb-4 rounded-full bg-brand-gold/10 p-4">
                <AlertTriangle className="h-10 w-10 text-brand-gold" />
              </div>
              <h4 className="mb-2 text-xl font-bold text-brand-ivory">Formato no compatible</h4>
              <p className="mb-6 text-sm text-brand-accent">
                Por el momento, LUSTI no puede generar una vista previa de archivos como Word o Excel directamente en el navegador. Por favor, descarga el archivo original.
              </p>
              {doc.fileUrl && (
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg bg-brand-gold px-6 py-3 font-bold text-brand-black hover:bg-brand-gold/90 transition-colors"
                  download={doc.name}
                >
                  <Download className="h-5 w-5" />
                  Descargar Original
                </a>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default DocumentPreviewModal;
