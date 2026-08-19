# AI Lead Connect

Crie um aplicativo web completo de agente virtual de qualificação de leads por telefone com as seguintes funcionalidades:

**1. PAINEL DE CONTROLE PRINCIPAL**

- Dashboard com métricas em tempo real: total de leads, ligações realizadas, leads qualificados, leads não qualificados, taxa de conversão

- Gráfico de desempenho diário/semanal das ligações

- Status das filas de discagem (pendentes, em andamento, concluídos)

- Indicador de conexão com o softphone 3CX

**2. GESTÃO DE LEADS**

- Upload de arquivo CSV/Excel com colunas: nome, telefone, empresa, email, origem (digitaletextil.com.br)

- Campos adicionais customizáveis por lead

- Lista de leads com filtros por status (novo, contatado, qualificado, não qualificado, não atendeu, caixa postal)

- Histórico individual de cada lead com todas as tentativas de contato

- Botão de ação manual para discar lead específico

- Agendamento de follow-up automático para leads que não atenderam

**3. INTEGRAÇÃO COM 3CX SOFTPHONE**

- Configuração de conexão com 3CX via API Webhook ou integração nativa

- Campos de configuração: URL do servidor 3CX, extensão, credenciais de autenticação

- Sistema de discagem automática sequencial da lista de leads

- Detecção de atendimento (humano vs caixa postal)

- Registro de duração da chamada e timestamp

- Status da chamada em tempo real no painel

**4. AGENTE DE VOZ COM IA**

- Configuração do script de conversação do agente virtual (editável):

  • Saudação inicial personalizada: "Olá, [Nome do Lead]? Aqui é a [Nome da Empresa], tudo bem?"

  • Pergunta 1: Confirmação de identidade e se a pessoa ainda está ativa no mercado têxtil

  • Pergunta 2: Interesse atual em soluções digitais têxteis

  • Pergunta 3: Frequência de compras online no setor

  • Pergunta 4: Orçamento mensal aproximado para marketing digital

  • Pergunta 5: Momento ideal para receber uma proposta detalhada

- Voz IA natural em português brasileiro (integração com ElevenLabs, Google Cloud TTS ou OpenAI TTS)

- Capacidade de entender respostas e adaptar o fluxo da conversa

- Tratamento de objeções comuns e respostas pré-programadas

- Finalização cordial da chamada com resumo do combinado

**5. TRANSCRIÇÃO E ARMAZENAMENTO**

- Transcrição em tempo real do áudio da conversa para texto (Speech-to-Text)

- Armazenamento estruturado de cada pergunta e resposta no banco de dados

- Exibição do transcript completo da conversa na ficha do lead

- Destaque visual para palavras-chave e intenções detectadas

- Possibilidade de ouvir a gravação da chamada posteriormente

- Status da transcrição (pendente, concluída, revisada)

**6. SISTEMA DE QUALIFICAÇÃO**

- Critérios configuráveis de qualificação automática baseados nas respostas

- Score de lead calculado automaticamente (0-100)

- Sinalização visual: verde (qualificado), amarelo (potencial), vermelho (não qualificado)

- Classificação automática com base no score e respostas-chave

- Possibilidade de reclassificação manual pelo operador

- Observações e notas internas por lead

**7. INTERFACE E EXPERIÊNCIA**

- Design moderno e responsivo (funciona em desktop e tablet)

- Tema profissional com paleta de cores azul e branco

- Modo escuro disponível

- Barra lateral de navegação com ícones

- Notificações toast para eventos importantes (lead qualificado, erro de conexão)

- Sons de alerta configuráveis para eventos de ligação

- Visualização em tempo real do progresso da lista de discagem

**8. LOGS E RELATÓRIOS**

- Exportação de relatórios em PDF e CSV

- Filtro por período, status, score

- Log detalhado de todas as chamadas realizadas

- Métricas por origem do lead

- Relatório de desempenho do agente IA (taxa de conversão, objeções mais comuns)

**9. INTEGRAÇÕES ADICIONAIS**

- Webhook para envio de leads qualificados para CRM externo

- Campo para URL da API do site digitaletextil.com.br para sincronização automática

- Integração com Google Sheets para backup dos dados

- Suporte a múltiplos usuários com níveis de permissão (admin, operador, visualizador)

**TECNOLOGIAS A SEREM UTILIZADAS**

- Frontend: React com TypeScript e Tailwind CSS

- Backend: Supabase para banco de dados e autenticação

- APIs de IA: OpenAI para o agente conversacional e transcrição

- Integração VoIP: biblioteca SIP.js para comunicação com 3CX ou chamadas diretas via Twilio

- Armazenamento de arquivos: Supabase Storage para gravações

- Hospedagem: Lovable/Netlify para frontend, Supabase para backend

Comece criando a estrutura principal do painel e o módulo de gestão de leads.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://iadigitale.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/74d21155-d711-4f61-8f4b-99b8807417f2).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
