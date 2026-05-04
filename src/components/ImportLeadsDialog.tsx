import { useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import { Upload, FileSpreadsheet, Loader2, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const STANDARD_FIELDS = [
  { key: "nome", label: "Nome *", required: true },
  { key: "telefone", label: "Telefone *", required: true },
  { key: "empresa", label: "Empresa" },
  { key: "email", label: "E-mail" },
  { key: "origem", label: "Origem" },
] as const;

type ParsedRow = Record<string, string>;

interface ImportLeadsDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onImported: () => void;
}

export function ImportLeadsDialog({ open, onOpenChange, onImported }: ImportLeadsDialogProps) {
  const { user } = useAuth();
  const fileInput = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [defaultOrigem, setDefaultOrigem] = useState("digitaletextil.com.br");
  const [step, setStep] = useState<"pick" | "map" | "importing" | "done">("pick");
  const [progress, setProgress] = useState({ inserted: 0, total: 0, errors: 0 });

  function reset() {
    setFileName("");
    setHeaders([]);
    setRows([]);
    setMapping({});
    setStep("pick");
    setProgress({ inserted: 0, total: 0, errors: 0 });
    if (fileInput.current) fileInput.current.value = "";
  }

  async function handleFile(file: File) {
    setFileName(file.name);
    const ext = file.name.toLowerCase().split(".").pop();

    try {
      let parsedRows: ParsedRow[] = [];
      let parsedHeaders: string[] = [];

      if (ext === "csv" || ext === "txt") {
        const text = await file.text();
        const result = Papa.parse<ParsedRow>(text, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (h) => h.trim(),
        });
        parsedRows = result.data;
        parsedHeaders = result.meta.fields ?? [];
      } else if (ext === "xlsx" || ext === "xls") {
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<ParsedRow>(sheet, { defval: "", raw: false });
        parsedRows = json;
        parsedHeaders = json.length ? Object.keys(json[0]).map((h) => h.trim()) : [];
      } else {
        toast.error("Formato não suportado. Use CSV, XLSX ou XLS.");
        return;
      }

      if (!parsedRows.length) {
        toast.error("Arquivo vazio ou sem cabeçalho.");
        return;
      }

      // auto-mapping by name
      const auto: Record<string, string> = {};
      for (const f of STANDARD_FIELDS) {
        const match = parsedHeaders.find(
          (h) =>
            h.toLowerCase() === f.key ||
            h.toLowerCase().includes(f.key) ||
            (f.key === "telefone" && /tel|fone|phone|celular/i.test(h)) ||
            (f.key === "empresa" && /empresa|company|razao/i.test(h)) ||
            (f.key === "email" && /e-?mail/i.test(h)) ||
            (f.key === "nome" && /nome|name/i.test(h)),
        );
        if (match) auto[f.key] = match;
      }

      setRows(parsedRows);
      setHeaders(parsedHeaders);
      setMapping(auto);
      setStep("map");
    } catch (err) {
      console.error(err);
      toast.error("Falha ao ler o arquivo");
    }
  }

  const extraColumns = useMemo(() => {
    const used = new Set(Object.values(mapping).filter(Boolean));
    return headers.filter((h) => !used.has(h));
  }, [headers, mapping]);

  const validRowsPreview = useMemo(() => {
    if (step !== "map") return 0;
    if (!mapping.nome || !mapping.telefone) return 0;
    return rows.filter(
      (r) => (r[mapping.nome] ?? "").trim() && (r[mapping.telefone] ?? "").trim(),
    ).length;
  }, [rows, mapping, step]);

  async function handleImport() {
    if (!user) return toast.error("Sessão inválida");
    if (!mapping.nome || !mapping.telefone)
      return toast.error("Mapeie ao menos Nome e Telefone");

    setStep("importing");
    const payload = rows
      .map((r) => {
        const nome = (r[mapping.nome] ?? "").trim();
        const telefone = (r[mapping.telefone] ?? "").trim();
        if (!nome || !telefone) return null;
        const empresa = mapping.empresa ? (r[mapping.empresa] ?? "").trim() || null : null;
        const email = mapping.email ? (r[mapping.email] ?? "").trim() || null : null;
        const origem = mapping.origem
          ? (r[mapping.origem] ?? "").trim() || defaultOrigem
          : defaultOrigem;
        const campos_extras: Record<string, string> = {};
        for (const col of extraColumns) {
          const v = (r[col] ?? "").toString().trim();
          if (v) campos_extras[col] = v;
        }
        return {
          user_id: user.id,
          nome,
          telefone,
          empresa,
          email,
          origem,
          campos_extras,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    setProgress({ inserted: 0, total: payload.length, errors: 0 });

    // batch in chunks of 200
    const CHUNK = 200;
    let inserted = 0;
    let errors = 0;
    for (let i = 0; i < payload.length; i += CHUNK) {
      const chunk = payload.slice(i, i + CHUNK);
      const { error, count } = await supabase
        .from("leads")
        .insert(chunk, { count: "exact" });
      if (error) {
        console.error(error);
        errors += chunk.length;
      } else {
        inserted += count ?? chunk.length;
      }
      setProgress({ inserted, total: payload.length, errors });
    }

    setStep("done");
    if (errors === 0) {
      toast.success(`${inserted} leads importados com sucesso`);
    } else {
      toast.warning(`${inserted} importados, ${errors} com erro`);
    }
    onImported();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar leads</DialogTitle>
          <DialogDescription>
            Carregue um arquivo CSV, XLSX ou XLS. As colunas extras viram campos personalizados.
          </DialogDescription>
        </DialogHeader>

        {step === "pick" && (
          <div
            className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border bg-muted/30 p-12 text-center transition-colors hover:border-primary/50 hover:bg-primary/5"
            onClick={() => fileInput.current?.click()}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <div>
              <p className="font-medium">Clique para escolher o arquivo</p>
              <p className="text-sm text-muted-foreground">CSV, XLSX ou XLS</p>
            </div>
            <input
              ref={fileInput}
              type="file"
              accept=".csv,.xlsx,.xls,.txt"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </div>
        )}

        {step === "map" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2 text-sm">
              <span className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-primary" />
                <span className="font-medium">{fileName}</span>
              </span>
              <span className="text-muted-foreground">
                {rows.length} linhas, {headers.length} colunas
              </span>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium">Mapeie as colunas do arquivo</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {STANDARD_FIELDS.map((f) => (
                  <div key={f.key} className="space-y-1.5">
                    <Label className="text-xs">{f.label}</Label>
                    <Select
                      value={mapping[f.key] ?? "__none__"}
                      onValueChange={(v) =>
                        setMapping((m) => ({ ...m, [f.key]: v === "__none__" ? "" : v }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="— Não mapear —" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">— Não mapear —</SelectItem>
                        {headers.map((h) => (
                          <SelectItem key={h} value={h}>
                            {h}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Origem padrão (se vazia)</Label>
                <Input
                  value={defaultOrigem}
                  onChange={(e) => setDefaultOrigem(e.target.value)}
                />
              </div>

              {extraColumns.length > 0 && (
                <div className="rounded-lg border bg-accent/30 p-3">
                  <p className="text-xs font-medium text-accent-foreground">
                    Campos personalizados detectados ({extraColumns.length})
                  </p>
                  <ScrollArea className="mt-2 max-h-24">
                    <div className="flex flex-wrap gap-1.5">
                      {extraColumns.map((c) => (
                        <Badge key={c} variant="secondary" className="font-normal">
                          {c}
                        </Badge>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
                <span className="font-medium tabular-nums">{validRowsPreview}</span>{" "}
                <span className="text-muted-foreground">de {rows.length} linhas serão importadas</span>
              </div>
            </div>
          </div>
        )}

        {step === "importing" && (
          <div className="flex flex-col items-center justify-center gap-3 py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium">
              Importando {progress.inserted} / {progress.total}...
            </p>
            {progress.errors > 0 && (
              <p className="text-xs text-destructive">{progress.errors} com erro</p>
            )}
          </div>
        )}

        {step === "done" && (
          <div className="flex flex-col items-center justify-center gap-3 py-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/15 text-success">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium">
              {progress.inserted} leads importados
              {progress.errors > 0 && ` · ${progress.errors} com erro`}
            </p>
          </div>
        )}

        <DialogFooter>
          {step === "map" && (
            <>
              <Button variant="outline" onClick={reset}>
                Trocar arquivo
              </Button>
              <Button onClick={handleImport} disabled={!validRowsPreview}>
                <Upload className="mr-2 h-4 w-4" /> Importar {validRowsPreview} leads
              </Button>
            </>
          )}
          {step === "done" && (
            <Button onClick={() => onOpenChange(false)}>Fechar</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
