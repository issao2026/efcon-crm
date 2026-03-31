import { X, ExternalLink, FileText, Image } from "lucide-react";

interface DocPreviewModalProps {
  url: string;
  fileName?: string;
  onClose: () => void;
}

/**
 * Inline document preview modal.
 * - PDFs are rendered in an <iframe>
 * - Images are rendered in an <img>
 * - Falls back to a download link for other types
 */
export function DocPreviewModal({ url, fileName, onClose }: DocPreviewModalProps) {
  const name = fileName || url.split("/").pop() || "documento";
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const isPdf = ext === "pdf" || url.includes(".pdf");
  const isImage = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "tiff"].includes(ext);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl flex flex-col w-full max-w-4xl max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {isPdf ? (
              <FileText className="w-5 h-5 text-red-500 flex-shrink-0" />
            ) : (
              <Image className="w-5 h-5 text-blue-500 flex-shrink-0" />
            )}
            <span className="text-sm font-semibold text-gray-800 truncate">{name}</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors px-2 py-1 rounded-lg hover:bg-blue-50"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Abrir em nova aba
            </a>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden bg-gray-50 min-h-0">
          {isPdf ? (
            <iframe
              src={url}
              title={name}
              className="w-full h-full border-0"
              style={{ minHeight: "70vh" }}
            />
          ) : isImage ? (
            <div className="flex items-center justify-center w-full h-full p-4" style={{ minHeight: "60vh" }}>
              <img
                src={url}
                alt={name}
                className="max-w-full max-h-full object-contain rounded-lg shadow-md"
                style={{ maxHeight: "75vh" }}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-4 p-8" style={{ minHeight: "40vh" }}>
              <FileText className="w-16 h-16 text-gray-300" />
              <p className="text-gray-500 text-sm text-center">
                Pré-visualização não disponível para este tipo de arquivo.
              </p>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Baixar / Abrir arquivo
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
