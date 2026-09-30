/*
 * Cadastro das propostas do portal.
 *
 * Cada proposta aponta para uma pasta em propostas/ e para a página que abre
 * nela. Propostas que compartilham o mesmo modelo (ex.: Binatural GO e BA)
 * usam a mesma pasta e mudam só os dados salvos pelo painel.
 *
 * `modelo` define os campos editáveis no /admin. Sem modelo, a proposta é só
 * hospedada e compartilhável, sem campos.
 */

const CLUSTER = {
  campos: [
    { secao: 'Identificação', id: 'local', rotulo: 'Unidade (como aparece nos slides)', padrao: '' },
    { secao: 'Identificação', id: 'tag', rotulo: 'Texto da capa, abaixo do logo', padrao: '' },
    { secao: 'Identificação', id: 'contato', rotulo: 'A/C (contato do cliente)', padrao: 'Sr. David' },
    { secao: 'Identificação', id: 'data', rotulo: 'Data da capa', padrao: 'Setembro de 2026' },
    { secao: 'Identificação', id: 'cidade_data', rotulo: 'Local e data da assinatura', padrao: 'Brasília, 30 de setembro de 2026' },
    { secao: 'Identificação', id: 'validade', rotulo: 'Validade da proposta', padrao: '30 dias' },
    { secao: 'Comercial', id: 'pagamento', rotulo: 'Condições de pagamento (em branco não aparece)', padrao: '' },
    { secao: 'Comercial', id: 'margem_padrao', rotulo: 'Margem padrão (%) para itens sem margem própria', tipo: 'numero', padrao: '' },
    { secao: 'Comercial', id: 'exibir_precos', rotulo: 'Mostrar o valor de cada item nas tabelas', tipo: 'booleano', padrao: false },
  ],
  listas: {
    materiais: [
      { id: 'servidor', grupo: 'Processamento', qtd: 2, item: 'Servidor Dell PowerEdge R360',
        spec: 'Rack 1U · Xeon 6 6369P · 64 GB DDR5 · 2 TB SATA · fonte redundante 600 W · iDRAC9 · trilhos · Windows Server 2025 Std',
        custo: 62682, ref: 'Configuração Dell pe_r360_18250' },
      { id: 'qnap', grupo: 'Armazenamento', qtd: 1, item: 'Storage QNAP TS-435XeU-4G',
        spec: 'Rack 1U · 4 baias · 4 GB DDR4 · 2 × 10 GbE SFP+ · 2 × 2.5 GbE · 2 slots M.2 NVMe',
        custo: 7156.25, ref: 'KaBuM 531217' },
      { id: 'hd', grupo: 'Armazenamento', qtd: 4, item: 'HD Seagate IronWolf 8 TB',
        spec: 'NAS · 7200 RPM · 256 MB cache · SATA III (ST8000VN004)',
        custo: 3302.84, ref: 'KaBuM 1061059 (PIX)' },
      { id: 'ssd', grupo: 'Armazenamento', qtd: 2, item: 'SSD NVMe M.2 2 TB',
        spec: 'Formato 2280 · camada de desempenho em RAID 1',
        custo: 2499.99, ref: 'KaBuM 542144 (base de valor)' },
      { id: 'switch', grupo: 'Rede', qtd: 1, item: 'Switch UniFi Pro XG 24',
        spec: 'USW-Pro-XG-24 · camada 3 · 16 × 10 GbE · 8 × 2.5 GbE · 2 × SFP28',
        custo: 10465, ref: 'Loja UI, com impostos' },
      { id: 'rack', grupo: 'Infraestrutura', qtd: 1, item: 'Rack fechado 19" tipo servidor',
        spec: 'Ref. Triunfo Server · profundidade 1000 mm · portas perfuradas com chave · laterais removíveis',
        ref: 'Cotar na Krista ou Horus' },
      { id: 'diversos', grupo: 'Infraestrutura', qtd: 1, item: 'Materiais diversos',
        spec: 'Cabos de rede, patch cords, módulos e cabos SFP, organizadores e acessórios de fixação' },
    ],
    servicos: [
      { id: 'levantamento', qtd: 1, item: 'Levantamento e projeto executivo',
        spec: 'Inventário dos sistemas, volumes de dados, janelas de manutenção e validação do projeto' },
      { id: 'montagem', qtd: 1, item: 'Montagem física e cabeamento',
        spec: 'Instalação do rack, servidores, storage e switch, com cabeamento identificado e organizado' },
      { id: 'storage', qtd: 1, item: 'Configuração do storage',
        spec: 'RAID 1 NVMe e RAID 10 HDD, volumes iSCSI e NFS e serviço QDevice' },
      { id: 'rede', qtd: 1, item: 'Configuração da rede',
        spec: 'VLANs de gerência, cluster, storage, migração e produção, jumbo frames e regras de acesso' },
      { id: 'cluster', qtd: 1, item: 'Implantação do cluster Proxmox VE',
        spec: 'Instalação dos nós, criação do cluster, quorum, storages compartilhados e grupos de HA' },
      { id: 'migracao', qtd: 1, item: 'Migração dos servidores atuais',
        spec: 'Conversão dos servidores em máquinas virtuais fora do expediente e validação com os usuários' },
      { id: 'backup', qtd: 1, item: 'Backup e testes de falha',
        spec: 'Rotina de backup com retenção e testes simulados de falha de nó, disco e link' },
      { id: 'entrega', qtd: 1, item: 'Documentação, treinamento e suporte',
        spec: 'Documentação da solução, treinamento da equipe e suporte presencial e remoto por 90 dias' },
    ],
  },
};

export const PROPOSTAS = [
  {
    slug: 'binatural-cluster-go',
    cliente: 'Binatural',
    titulo: 'Cluster Proxmox VE · apresentação e proposta',
    unidade: 'Formosa, GO',
    pasta: 'binatural-cluster',
    pagina: 'proposta.html',
    modelo: CLUSTER,
    padroes: { local: 'Formosa, GO', tag: 'Formosa · Goiás' },
  },
  {
    slug: 'binatural-cluster-ba',
    cliente: 'Binatural',
    titulo: 'Cluster Proxmox VE · apresentação e proposta',
    unidade: 'Bahia',
    pasta: 'binatural-cluster',
    pagina: 'proposta.html',
    modelo: CLUSTER,
    padroes: { local: 'Bahia', tag: 'Filial · Bahia' },
  },
  {
    slug: 'cftv-termico-samambaia',
    cliente: 'UFV Samambaia',
    titulo: 'CFTV térmico de perímetro',
    unidade: 'UFV Samambaia',
    pasta: 'cftv-termico-samambaia',
    pagina: 'index.html',
  },
];

export const STATUS = ['Rascunho', 'Em cotação', 'Enviada', 'Aprovada', 'Recusada'];

export function proposta(slug) {
  return PROPOSTAS.find((p) => p.slug === slug) || null;
}
