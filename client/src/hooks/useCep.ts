import { useState } from "react";
import { toast } from "sonner";

export interface CepData {
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
}

export async function fetchCep(cep: string): Promise<CepData | null> {
  const clean = cep.replace(/\D/g, "");
  if (clean.length !== 8) return null;
  try {
    const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export function useCep() {
  const [loading, setLoading] = useState(false);

  const lookup = async (
    cep: string,
    onSuccess: (data: CepData) => void,
    options?: { silent?: boolean }
  ) => {
    const clean = cep.replace(/\D/g, "");
    if (clean.length !== 8) return;
    setLoading(true);
    try {
      const data = await fetchCep(clean);
      if (data && !data.erro) {
        onSuccess(data);
        if (!options?.silent) toast.success("Endereço preenchido automaticamente via CEP");
      } else {
        if (!options?.silent) toast.error("CEP não encontrado");
      }
    } catch {
      if (!options?.silent) toast.error("Erro ao consultar CEP");
    } finally {
      setLoading(false);
    }
  };

  return { lookup, loading };
}
