import { useState, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  X, Upload, FileSpreadsheet, ChevronDown, Check, AlertTriangle, Loader2, ArrowRight,
} from "lucide-react";

type ImportType = "clients" | "deals";

interface SpreadsheetImportModalProps {
  onClose: () => void;
}

// ─── Column selector ──────────────────────────────────────────────────────────
function ColSelect({
  label, required, headers, value, onChange,
}: {
  label: string;
  required?: boolean;
  headers: string[];
  value: number | undefined;
  onChange: (v: number | undefined) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
        className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
      >
        <option value="">— Não mapear —</option>
        {headers.map((h, i) => (
          <option key={i} value={i}>
            Coluna {i + 1}: {h || `(vazia)`}
          </option>
        ))}
      </select>
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────
export function SpreadsheetImportModal({ onClose }: SpreadsheetImportModalProps) {
  const utils = trpc.useUtils();

  // Step: "upload" | "map" | "done"
  const [step, setStep] = useState<"upload" | "map" | "done">("upload");
  const [importType, setImportType] = useState<ImportType>("clients");
  const [hasHeader, setHasHeader] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const [fileBase64, setFileBase64] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [preview, setPreview] = useState<string[][]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Column mapping state
  const [clientMap, setClientMap] = useState<Record<string, number | undefined>>({
    name: undefined, cpfCnpj: undefined, email: undefined, phone: undefined,
    address: undefined, clientRole: undefined, profession: undefined, maritalStatus: undefined,
  });
  const [dealMap, setDealMap] = useState<Record<string, number | undefined>>({
    type: undefined, totalValue: undefined, monthlyValue: undefined,
    status: undefined, subtype: undefined, paymentModality: undefined, notes: undefined,
  });

  const previewMutation = trpc.import.preview.useMutation({
    onSuccess: (data) => {
      setHeaders(data.headers as string[]);
      setPreview(data.preview as string[][]);
      setTotalRows(data.totalRows);
      setStep("map");
    },
    onError: (err) => toast.error(`Erro ao ler arquivo: ${err.message}`),
  });

  const importClientsMutation = trpc.import.clients.useMutation({
    onSuccess: (data) => {
      setResult(data);
      setStep("done");
      utils.clients.list.invalidate();
      toast.success(`${data.imported} clientes importados!`);
    },
    onError: (err) => toast.error(`Erro na importação: ${err.message}`),
  });

  const importDealsMutation = trpc.import.deals.useMutation({
    onSuccess: (data) => {
      setResult(data);
      setStep("done");
      utils.deals.list.invalidate();
      utils.dashboard.deals.invalidate();
      utils.dashboard.stats.invalidate();
      toast.success(`${data.imported} negócios importados!`);
    },
    onError: (err) => toast.error(`Erro na importação: ${err.message}`),
  });

  const readFile = useCallback((file: File) => {
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["xlsx", "xls", "csv"].includes(ext || "")) {
      toast.error("Formato inválido. Use .xlsx, .xls ou .csv");
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = (e.target?.result as string).split(",")[1];
      setFileBase64(base64);
      previewMutation.mutate({ fileBase64: base64, fileName: file.name });
    };
    reader.readAsDataURL(file);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) readFile(file);
  }, [readFile]);

  const handleImport = () => {
    if (importType === "clients") {
      if (clientMap.name == null) { toast.error("Selecione a coluna de Nome"); return; }
      importClientsMutation.mutate({
        fileBase64, fileName, hasHeader,
        mapping: {
          name: clientMap.name!,
          cpfCnpj: clientMap.cpfCnpj,
          email: clientMap.email,
          phone: clientMap.phone,
          address: clientMap.address,
          clientRole: clientMap.clientRole,
          profession: clientMap.profession,
          maritalStatus: clientMap.maritalStatus,
        },
      });
    } else {
      if (dealMap.type == null) { toast.error("Selecione a coluna de Tipo"); return; }
      importDealsMutation.mutate({
        fileBase64, fileName, hasHeader,
        mapping: {
          type: dealMap.type!,
          totalValue: dealMap.totalValue,
          monthlyValue: dealMap.monthlyValue,
          status: dealMap.status,
          subtype: dealMap.subtype,
          paymentModality: dealMap.paymentModality,
          notes: dealMap.notes,
        },
      });
    }
  };

  const isImporting = importClientsMutation.isPending || importDealsMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Importar Planilha</h2>
              <p className="text-xs text-muted-foreground">Excel (.xlsx, .xls) ou CSV</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-muted-foreground hover:text-gray-900 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* ── Step 1: Upload ── */}
          {step === "upload" && (
            <div className="space-y-5">
              {/* Import type selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">O que deseja importar?</label>
                <div className="grid grid-cols-2 gap-3">
                  {(["clients", "deals"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setImportType(t)}
                      className={`p-3 rounded-xl border-2 text-sm font-semibold transition-colors ${
                        importType === t
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-border text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {t === "clients" ? "👥 Clientes" : "🏠 Negócios"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
                  dragging ? "border-blue-400 bg-blue-50" : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                }`}
              >
                <Upload className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-semibold text-gray-700">Arraste o arquivo aqui</p>
                <p className="text-xs text-muted-foreground mt-1">ou clique para selecionar</p>
                <p className="text-xs text-muted-foreground mt-3 bg-gray-100 inline-block px-3 py-1 rounded-full">
                  .xlsx · .xls · .csv — máx. 5 MB
                </p>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) readFile(f); }}
                />
              </div>

              {previewMutation.isPending && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
                  <Loader2 className="w-4 h-4 animate-spin" /> Lendo arquivo...
                </div>
              )}

              {/* Template download hint */}
              <div className="bg-blue-50 rounded-xl p-4 text-xs text-blue-700">
                <strong>Dica:</strong> A primeira linha deve ser o cabeçalho (ex: Nome, CPF, Email…). Você poderá mapear as colunas no próximo passo.
              </div>
            </div>
          )}

          {/* ── Step 2: Map columns ── */}
          {step === "map" && (
            <div className="space-y-5">
              {/* File info */}
              <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                <FileSpreadsheet className="w-8 h-8 text-green-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 truncate">{fileName}</div>
                  <div className="text-xs text-muted-foreground">{totalRows} linhas de dados detectadas</div>
                </div>
                <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasHeader}
                    onChange={(e) => setHasHeader(e.target.checked)}
                    className="rounded"
                  />
                  Tem cabeçalho
                </label>
              </div>

              {/* Preview table */}
              {preview.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-2">Prévia (primeiras linhas):</p>
                  <div className="overflow-x-auto rounded-xl border border-border">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50">
                        <tr>
                          {headers.map((h, i) => (
                            <th key={i} className="px-3 py-2 text-left font-semibold text-gray-600 whitespace-nowrap border-r border-border last:border-r-0">
                              {h || `Col ${i + 1}`}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {preview.slice(0, 3).map((row, ri) => (
                          <tr key={ri} className="border-t border-border">
                            {row.map((cell, ci) => (
                              <td key={ci} className="px-3 py-2 text-gray-700 whitespace-nowrap border-r border-border last:border-r-0 max-w-[120px] truncate">
                                {String(cell)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Column mapping */}
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-3">Mapeamento de colunas:</p>
                {importType === "clients" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <ColSelect label="Nome" required headers={headers} value={clientMap.name} onChange={(v) => setClientMap(m => ({ ...m, name: v }))} />
                    <ColSelect label="CPF / CNPJ" headers={headers} value={clientMap.cpfCnpj} onChange={(v) => setClientMap(m => ({ ...m, cpfCnpj: v }))} />
                    <ColSelect label="E-mail" headers={headers} value={clientMap.email} onChange={(v) => setClientMap(m => ({ ...m, email: v }))} />
                    <ColSelect label="Telefone" headers={headers} value={clientMap.phone} onChange={(v) => setClientMap(m => ({ ...m, phone: v }))} />
                    <ColSelect label="Endereço" headers={headers} value={clientMap.address} onChange={(v) => setClientMap(m => ({ ...m, address: v }))} />
                    <ColSelect label="Perfil (comprador/vendedor…)" headers={headers} value={clientMap.clientRole} onChange={(v) => setClientMap(m => ({ ...m, clientRole: v }))} />
                    <ColSelect label="Profissão" headers={headers} value={clientMap.profession} onChange={(v) => setClientMap(m => ({ ...m, profession: v }))} />
                    <ColSelect label="Estado civil" headers={headers} value={clientMap.maritalStatus} onChange={(v) => setClientMap(m => ({ ...m, maritalStatus: v }))} />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <ColSelect label="Tipo (venda/locacao…)" required headers={headers} value={dealMap.type} onChange={(v) => setDealMap(m => ({ ...m, type: v }))} />
                    <ColSelect label="Status" headers={headers} value={dealMap.status} onChange={(v) => setDealMap(m => ({ ...m, status: v }))} />
                    <ColSelect label="Valor total (R$)" headers={headers} value={dealMap.totalValue} onChange={(v) => setDealMap(m => ({ ...m, totalValue: v }))} />
                    <ColSelect label="Valor mensal (R$)" headers={headers} value={dealMap.monthlyValue} onChange={(v) => setDealMap(m => ({ ...m, monthlyValue: v }))} />
                    <ColSelect label="Subtipo / Modalidade" headers={headers} value={dealMap.subtype} onChange={(v) => setDealMap(m => ({ ...m, subtype: v }))} />
                    <ColSelect label="Forma de pagamento" headers={headers} value={dealMap.paymentModality} onChange={(v) => setDealMap(m => ({ ...m, paymentModality: v }))} />
                    <ColSelect label="Observações" headers={headers} value={dealMap.notes} onChange={(v) => setDealMap(m => ({ ...m, notes: v }))} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Step 3: Done ── */}
          {step === "done" && result && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Importação concluída!</h3>
              <div className="flex items-center justify-center gap-6 mt-4">
                <div className="text-center">
                  <div className="text-3xl font-black text-green-600">{result.imported}</div>
                  <div className="text-xs text-muted-foreground">importados</div>
                </div>
                {result.skipped > 0 && (
                  <div className="text-center">
                    <div className="text-3xl font-black text-yellow-500">{result.skipped}</div>
                    <div className="text-xs text-muted-foreground">ignorados</div>
                  </div>
                )}
              </div>
              {result.skipped > 0 && (
                <p className="text-xs text-muted-foreground mt-4 flex items-center justify-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-yellow-500" />
                  Linhas ignoradas: campos obrigatórios ausentes ou tipo inválido
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border">
          {step === "upload" && (
            <>
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
              <div />
            </>
          )}
          {step === "map" && (
            <>
              <Button variant="outline" onClick={() => setStep("upload")}>Voltar</Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                onClick={handleImport}
                disabled={isImporting}
              >
                {isImporting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Importando...</>
                ) : (
                  <><ArrowRight className="w-4 h-4" /> Importar {totalRows} linhas</>
                )}
              </Button>
            </>
          )}
          {step === "done" && (
            <>
              <div />
              <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={onClose}>
                Concluir
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
