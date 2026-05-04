export type LeadStatus =
  | "novo"
  | "contatado"
  | "qualificado"
  | "nao_qualificado"
  | "nao_atendeu"
  | "caixa_postal";

export interface Lead {
  id: string;
  nome: string;
  telefone: string;
  empresa: string;
  email: string;
  origem: string;
  status: LeadStatus;
  score: number;
  ultimaTentativa: string | null;
  tentativas: number;
  observacoes?: string;
}

export const statusLabels: Record<LeadStatus, string> = {
  novo: "Novo",
  contatado: "Contatado",
  qualificado: "Qualificado",
  nao_qualificado: "Não qualificado",
  nao_atendeu: "Não atendeu",
  caixa_postal: "Caixa postal",
};

export const mockLeads: Lead[] = [
  { id: "1", nome: "Ana Beatriz Souza", telefone: "+55 11 98765-4321", empresa: "Tecidos Premium SP", email: "ana@tecidospremium.com.br", origem: "digitaletextil.com.br", status: "qualificado", score: 87, ultimaTentativa: "2026-05-04T09:32:00", tentativas: 1 },
  { id: "2", nome: "Carlos Eduardo Lima", telefone: "+55 11 99123-4567", empresa: "Malhas CL", email: "carlos@malhascl.com.br", origem: "digitaletextil.com.br", status: "contatado", score: 62, ultimaTentativa: "2026-05-04T09:15:00", tentativas: 2 },
  { id: "3", nome: "Mariana Oliveira", telefone: "+55 21 98888-1122", empresa: "Estampa & Cia", email: "mari@estampaecia.com.br", origem: "digitaletextil.com.br", status: "nao_atendeu", score: 0, ultimaTentativa: "2026-05-04T08:50:00", tentativas: 3 },
  { id: "4", nome: "Roberto Mendes", telefone: "+55 47 99999-5544", empresa: "Têxtil Sul", email: "roberto@textilsul.com.br", origem: "digitaletextil.com.br", status: "novo", score: 0, ultimaTentativa: null, tentativas: 0 },
  { id: "5", nome: "Patrícia Ferreira", telefone: "+55 11 97777-3322", empresa: "PF Confecções", email: "patricia@pfconf.com.br", origem: "digitaletextil.com.br", status: "qualificado", score: 92, ultimaTentativa: "2026-05-03T16:42:00", tentativas: 1 },
  { id: "6", nome: "Diego Santos", telefone: "+55 11 96666-2211", empresa: "DS Moda", email: "diego@dsmoda.com.br", origem: "digitaletextil.com.br", status: "nao_qualificado", score: 24, ultimaTentativa: "2026-05-03T14:18:00", tentativas: 1 },
  { id: "7", nome: "Juliana Castro", telefone: "+55 31 98222-7788", empresa: "JC Tecidos", email: "ju@jctecidos.com.br", origem: "digitaletextil.com.br", status: "caixa_postal", score: 0, ultimaTentativa: "2026-05-03T11:05:00", tentativas: 2 },
  { id: "8", nome: "Felipe Andrade", telefone: "+55 11 95555-9090", empresa: "Andrade Têxtil", email: "felipe@andrade.com.br", origem: "digitaletextil.com.br", status: "novo", score: 0, ultimaTentativa: null, tentativas: 0 },
  { id: "9", nome: "Renata Borges", telefone: "+55 41 94444-1010", empresa: "RB Malharia", email: "renata@rbmalharia.com.br", origem: "digitaletextil.com.br", status: "qualificado", score: 78, ultimaTentativa: "2026-05-02T17:20:00", tentativas: 1 },
  { id: "10", nome: "Thiago Nunes", telefone: "+55 11 93333-2020", empresa: "TN Estamparia", email: "thiago@tnestamp.com.br", origem: "digitaletextil.com.br", status: "contatado", score: 55, ultimaTentativa: "2026-05-04T10:01:00", tentativas: 1 },
];

export const dailyCallStats = [
  { dia: "Seg", ligacoes: 42, qualificados: 12 },
  { dia: "Ter", ligacoes: 58, qualificados: 18 },
  { dia: "Qua", ligacoes: 47, qualificados: 14 },
  { dia: "Qui", ligacoes: 65, qualificados: 22 },
  { dia: "Sex", ligacoes: 71, qualificados: 26 },
  { dia: "Sáb", ligacoes: 23, qualificados: 7 },
  { dia: "Dom", ligacoes: 0, qualificados: 0 },
];
